// pages/api/strava/disconnect.js
import { withIronSessionApiRoute } from 'iron-session/next';
import { sessionOptions } from '../../../lib/session';

export default withIronSessionApiRoute(handler, sessionOptions);

async function handler(req, res) {
  if (req.method === 'POST') {
    // Clear Strava data from session
    delete req.session.stravaToken;
    delete req.session.stravaRefreshToken;
    delete req.session.stravaTokenExpiry;
    delete req.session.athleteName;
    delete req.session.athleteId;
    
    await req.session.save();
    
    return res.json({ success: true });
  }
  
  res.status(405).json({ error: 'Method not allowed' });
}