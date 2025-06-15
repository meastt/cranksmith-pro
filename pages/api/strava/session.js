// pages/api/strava/session.js
import { withIronSessionApiRoute } from 'iron-session/next';
import { sessionOptions } from '../../../lib/session';

export default withIronSessionApiRoute(handler, sessionOptions);

async function handler(req, res) {
  if (req.method === 'GET') {
    // Return current session data
    const { stravaToken, athleteName, athleteId } = req.session;
    
    if (stravaToken) {
      // Optional: Verify token is still valid with Strava API
      // For now, just return session data
      return res.json({
        isConnected: true,
        athleteName: athleteName || 'Unknown',
        athleteId
      });
    }
    
    return res.json({
      isConnected: false
    });
  }
  
  res.status(405).json({ error: 'Method not allowed' });
}