// pages/api/strava/auth.js
export default async function handler(req, res) {
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
        const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/strava/auth`;
        const scope = 'read,activity:read_all';
        const state = Math.random().toString(36).substring(7);
  
        const authUrl = `https://www.strava.com/oauth/authorize?` +
          `client_id=${clientId}&` +
          `response_type=code&` +
          `redirect_uri=${encodeURIComponent(redirectUri)}&` +
          `approval_prompt=force&` +
          `scope=${scope}&` +
          `state=${state}`;
  
        return res.redirect(authUrl);
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
          // Store tokens in session/database
          // For now, redirect with success and encode the token in URL (not secure for production)
          const athleteName = encodeURIComponent(tokenData.athlete.firstname || 'Unknown');
          const accessToken = encodeURIComponent(tokenData.access_token);
          return res.redirect(`/pro?strava_connected=true&athlete=${athleteName}&access_token=${accessToken}`);
        } else {
          throw new Error('No access token received');
        }
      } catch (error) {
        console.error('Strava auth error:', error);
        return res.redirect(`/pro?strava_error=auth_failed`);
      }
    }
  
    res.status(405).json({ error: 'Method not allowed' });
  }