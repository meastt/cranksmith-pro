// lib/database.js
// Import the V2 database from your original file
export { componentDatabaseV2 as componentDatabase } from './components.js';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('supabaseUrl:', supabaseUrl);
console.log('supabaseKey:', supabaseKey);

export const supabase = createClient(supabaseUrl, supabaseKey);

// Add Pro-specific enhancements
export const proFeatures = {
  // Real-world compatibility data
  compatibility: new Map(),
  
  // Performance cache
  performanceCache: new Map(),
  
  // User preferences
  preferences: {
    units: 'metric',
    wheelSize: 700,
    defaultCadence: 90
  }
};