// pages/api/test-db.js
import { supabase } from '../../lib/database';

export default async function handler(req, res) {
  // Try selecting one row from compatibility_reports
  const { data, error } = await supabase
    .from('compatibility_reports')
    .select('*')
    .limit(1);

  if (error) {
    console.error('DB error:', error);
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ sample: data });
}
