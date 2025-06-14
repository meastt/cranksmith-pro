// pages/api/compatibility/list.js
import { getCompatibilityReports } from '../../../lib/compatibility';

export default async function handler(req, res) {
  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const reports = await getCompatibilityReports();
    return res.status(200).json(reports);
  } catch (error) {
    console.error('Fetch error:', error);
    return res.status(500).json({ error: error.message });
  }
}
