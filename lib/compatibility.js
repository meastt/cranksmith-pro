// lib/compatibility.js
import { supabase } from './database';

export async function getCompatibilityReports() {
  const { data, error } = await supabase
    .from('compatibility_reports')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}


/**
// lib/compatibility.js
import { supabase } from './database';

/**
 * Insert a new compatibility report and return the created row.
 */
export async function createCompatibilityReport(report) {
    const { data, error } = await supabase
      .from('compatibility_reports')
      .insert([report])
      .select()      // <- add this to tell Supabase to return rows
      .single();     // <- then grab the single inserted row
  
    if (error) throw error;
    return data;
  }
  