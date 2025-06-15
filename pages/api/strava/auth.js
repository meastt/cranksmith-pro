// pages/api/strava/auth.js
import { withIronSessionApiRoute } from 'iron-session/next';
import { sessionOptions } from '../../../lib/session';

export default withIronSessionApiRoute(handler, sessionOptions);

async function handler(req, res) {
  const { method, query } = req;

  if (method === 'GET') {
    // Handle OAuth callback from Strava
    const { code, state, error } = query;

    if (error) {
      return res.redirect(`/pro?strava_error=${error}`);
    }

    if (!code) {
      // Initiate OAuth flow
      const clientId = process.env.STRAVA_CLIENT_ID;
      
      if (!clientId) {
        console.error('STRAVA_CLIENT_ID not configured');
        return res.redirect('/pro?strava_error=config_error');
      }
      
      const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/strava/auth`;
      const scope = 'read,activity:read_all';
      const state = Math.random().toString(36).substring(7);

      // Store state in session for CSRF protection
      req.session.oauthState = state;
      await req.session.save();

      const authUrl = `https://www.strava.com/oauth/authorize?` +
        `client_id=${clientId}&` +
        `response_type=code&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `approval_prompt=force&` +
        `scope=${scope}&` +
        `state=${state}`;

      return res.redirect(authUrl);
    }

    // Verify state to prevent CSRF
    if (state !== req.session.oauthState) {
      console.error('OAuth state mismatch');
      return res.redirect('/pro?strava_error=state_mismatch');
    }

    // Exchange code for access token
    try {
      const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: process.env.STRAVA_CLIENT_ID,
          client_secret: process.env.STRAVA_CLIENT_SECRET,
          code,
          grant_type: 'authorization_code'
        })
      });

      const tokenData = await tokenResponse.json();

      if (tokenData.access_token) {
        // Store in secure session
        req.session.stravaToken = tokenData.access_token;
        req.session.stravaRefreshToken = tokenData.refresh_token;
        req.session.stravaTokenExpiry = Date.now() + (tokenData.expires_in * 1000);
        req.session.athleteName = tokenData.athlete?.firstname || 'Unknown';
        req.session.athleteId = tokenData.athlete?.id;
        
        // Clear OAuth state
        delete req.session.oauthState;
        
        await req.session.save();
        
        return res.redirect('/pro?strava_connected=true');
      } else {
        throw new Error('No access token received');
      }
    } catch (error) {
      console.error('Strava auth error:', error);
      return res.redirect('/pro?strava_error=auth_failed');
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}