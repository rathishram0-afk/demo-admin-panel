import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envFile = fs.readFileSync('.env', 'utf-8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_ANON_KEY);

async function clean() {
  const tables = ['bookings', 'cafe_orders', 'memberships', 'walkin_sessions', 'live_sessions', 'revenue', 'reports', 'analytics'];
  
  for (let t of tables) {
    // Delete all records greater than id 0 (or simply all)
    // Supabase JS doesn't allow a true truncate easily from client without an eq, but we can do neq('id', '00000000-0000-0000-0000-000000000000') or similar if uuid
    // Or we can just use the SQL editor. Wait, I can try delete with neq id 0. But wait, I can just do a select and delete in batches if needed.
    const { data, error } = await supabase.from(t).select('id');
    if (error) {
      console.log(t, "Error selecting:", error.message);
      continue;
    }
    
    if (data && data.length > 0) {
      console.log(`Table ${t} has ${data.length} records. Deleting...`);
      const ids = data.map(d => d.id);
      
      // Delete in chunks of 100
      for (let i = 0; i < ids.length; i += 100) {
         const chunk = ids.slice(i, i + 100);
         const { error: delErr } = await supabase.from(t).delete().in('id', chunk);
         if (delErr) {
             console.log("Error deleting from", t, delErr.message);
         }
      }
      console.log(`Deleted all from ${t}`);
    } else {
      console.log(`Table ${t} is empty or doesn't exist.`);
    }
  }
}
clean();
