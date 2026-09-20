import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envText = fs.readFileSync('.env', 'utf8');
const env = {};
envText.split('\n').forEach(line => {
  const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function checkSchemas() {
  const tables = ['devices', 'walkin_sessions', 'cafe_orders', 'bookings', 'memberships', 'reports'];
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    console.log(`\nTable: ${table}`);
    if (error) {
       console.log(`Error: ${error.message}`);
    } else {
       console.log(`Success: Found ${data.length} records. Sample:`, data[0] ? Object.keys(data[0]) : 'Empty');
    }
  }
}

checkSchemas().catch(console.error);
