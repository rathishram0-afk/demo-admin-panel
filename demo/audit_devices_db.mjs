import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Load .env
const envText = fs.readFileSync('.env', 'utf8');
const env = {};
envText.split('\n').forEach(line => {
  const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
});

console.log("Supabase URL:", env.VITE_SUPABASE_URL ? env.VITE_SUPABASE_URL : "MISSING");
console.log("Supabase Key:", env.VITE_SUPABASE_ANON_KEY ? "Found key (len " + env.VITE_SUPABASE_ANON_KEY.length + ")" : "MISSING");

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function runAudit() {
  console.log("\n--- STEP 1: Querying Supabase 'devices' table ---");
  const { data, error, status, statusText } = await supabase.from('devices').select('*');
  
  console.log("HTTP Status:", status, statusText);
  console.log("Supabase Error:", error);
  console.log("Data Array:", data);
  console.log("Count:", data ? data.length : 0);

  if (error) {
    console.log("\n[DIAGNOSIS]: Query to 'devices' table failed with error!");
    console.log("Code:", error.code);
    console.log("Message:", error.message);
    console.log("Details:", error.details);
    console.log("Hint:", error.hint);
  } else if (!data || data.length === 0) {
    console.log("\n[DIAGNOSIS]: Query succeeded (status 200), BUT 'devices' table has 0 rows in Supabase!");
  } else {
    console.log(`\n[DIAGNOSIS]: Query succeeded! Found ${data.length} devices in Supabase DB.`);
    data.forEach((d, idx) => {
      console.log(`  [${idx+1}] Code: ${d.device_code | d.id}, Name: ${d.device_name || d.name}, Status: ${d.status}, Zone: ${d.zone || d.category}`);
    });
  }

  console.log("\n--- STEP 2: Querying 'walkin_sessions' table ---");
  const { data: wData, error: wError } = await supabase.from('walkin_sessions').select('*');
  console.log("Walkin sessions count:", wData ? wData.length : 0, "Error:", wError ? wError.message : "None");

  console.log("\n--- STEP 3: Testing Seed function manually if empty ---");
  if (!data || data.length === 0) {
    console.log("Attempting to insert 9 initial devices...");
    const INITIAL_DEVICES = [
      { device_code: 'PS5-1', device_name: 'PS5 - 1', zone: 'PlayStation 5', category: 'PlayStation 5', platform: 'PlayStation 5', status: 'AVAILABLE', is_active: true, display_order: 1, image_url: '/admin/ps5-admin.webp' },
      { device_code: 'PS5-2', device_name: 'PS5 - 2', zone: 'PlayStation 5', category: 'PlayStation 5', platform: 'PlayStation 5', status: 'AVAILABLE', is_active: true, display_order: 2, image_url: '/admin/ps5-admin.webp' },
      { device_code: 'PS5-3', device_name: 'PS5 - 3', zone: 'PlayStation 5', category: 'PlayStation 5', platform: 'PlayStation 5', status: 'AVAILABLE', is_active: true, display_order: 3, image_url: '/admin/ps5-admin.webp' },
      { device_code: 'PS5-4', device_name: 'PS5 - 4', zone: 'PlayStation 5', category: 'PlayStation 5', platform: 'PlayStation 5', status: 'AVAILABLE', is_active: true, display_order: 4, image_url: '/admin/ps5-admin.webp' },
      { device_code: 'PS4-1', device_name: 'PS4 - 1', zone: 'PlayStation 4', category: 'PlayStation 4', platform: 'PlayStation 4', status: 'AVAILABLE', is_active: true, display_order: 5, image_url: '/admin/ps4-admin.webp' },
      { device_code: 'PS2-1', device_name: 'PS2 - 1', zone: 'PlayStation 2', category: 'PlayStation 2', platform: 'PlayStation 2', status: 'AVAILABLE', is_active: true, display_order: 6, image_url: '/admin/ps2-admin.webp' },
      { device_code: 'SIM-1', device_name: 'SIM - 1', zone: 'Racing Simulator', category: 'Racing Simulator', platform: 'Racing Simulator', status: 'AVAILABLE', is_active: true, display_order: 7, image_url: '/admin/sim1-admin.webp' },
      { device_code: 'VR-1', device_name: 'VR - 1', zone: 'PS VR2', category: 'PS VR2', platform: 'PS VR2', status: 'AVAILABLE', is_active: true, display_order: 8, image_url: '/admin/vr-admin.webp' },
      { device_code: 'VR-2', device_name: 'VR - 2', zone: 'PS VR2', category: 'PS VR2', platform: 'PS VR2', status: 'AVAILABLE', is_active: true, display_order: 9, image_url: '/admin/vr-admin.webp' }
    ];

    const { data: seedRes, error: seedErr } = await supabase.from('devices').insert(INITIAL_DEVICES).select();
    if (seedErr) {
      console.error("Seed Insert Error:", seedErr);
    } else {
      console.log("Successfully inserted seed devices into Supabase! Inserted count:", seedRes ? seedRes.length : 0);
    }
  }
}

runAudit().catch(err => console.error("Audit script failed:", err));
