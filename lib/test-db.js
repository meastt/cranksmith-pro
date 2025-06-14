import { config } from 'dotenv';
config({ path: '.env.local' }); // Explicitly load .env.local

import { supabase } from './database.js';
// ...rest of your code...

async function testConnection() {
  try {
    const { data, error } = await supabase.from('your_table_name').select('*').limit(1);
    
    if (error) {
      console.error('Error connecting to Supabase:', error.message);
      return;
    }
    
    console.log('Successfully connected to Supabase!');
    console.log('Data:', data);
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testConnection(); 