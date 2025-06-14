// pages/api/compatibility/submit.js
import { createCompatibilityReport } from '../../../lib/compatibility';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 1. Destructure only the fields your table expects:
  const {
    user_id,
    crankset_id,
    cassette_id,
    derailleur_id,
    is_compatible
  } = req.body;

  // 2. Basic validation
  if (
    !user_id ||
    !crankset_id ||
    !cassette_id ||
    !derailleur_id ||
    typeof is_compatible !== 'boolean'
  ) {
    return res.status(400).json({
      error:
        'Request body must include user_id, crankset_id, cassette_id, derailleur_id, and is_compatible (boolean).'
    });
  }

  try {
    const newReport = await createCompatibilityReport({
      user_id,
      crankset_id,
      cassette_id,
      derailleur_id,
      is_compatible
    });
    return res.status(201).json(newReport);
  } catch (error) {
    console.error('Insert error:', error);
    return res.status(500).json({ error: error.message });
  }
}
