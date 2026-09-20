const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');

const envConfig = dotenv.parse(fs.readFileSync('.env'));
for (const k in envConfig) {
  process.env[k] = envConfig[k];
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const INITIAL_DEVICES = [
  { device_code: 'PS5-1', device_name: 'PS5 - 1', zone: 'PlayStation 5', category: 'PlayStation 5', status: 'AVAILABLE', display_order: 1, image_url: '/admin/ps5-admin.webp' },
  { device_code: 'PS5-2', device_name: 'PS5 - 2', zone: 'PlayStation 5', category: 'PlayStation 5', status: 'AVAILABLE', display_order: 2, image_url: '/admin/ps5-admin.webp' },
  { device_code: 'PS5-3', device_name: 'PS5 - 3', zone: 'PlayStation 5', category: 'PlayStation 5', status: 'AVAILABLE', display_order: 3, image_url: '/admin/ps5-admin.webp' },
  { device_code: 'PS5-4', device_name: 'PS5 - 4', zone: 'PlayStation 5', category: 'PlayStation 5', status: 'AVAILABLE', display_order: 4, image_url: '/admin/ps5-admin.webp' },
  { device_code: 'PS4-1', device_name: 'PS4 - 1', zone: 'PlayStation 4', category: 'PlayStation 4', status: 'AVAILABLE', display_order: 5, image_url: '/admin/ps4-admin.webp' },
  { device_code: 'PS2-1', device_name: 'PS2 - 1', zone: 'PlayStation 2', category: 'PlayStation 2', status: 'AVAILABLE', display_order: 6, image_url: '/admin/ps2-admin.webp' },
  { device_code: 'SIM-1', device_name: 'SIM - 1', zone: 'Racing Simulator', category: 'Racing Simulator', status: 'AVAILABLE', display_order: 7, image_url: '/admin/sim1-admin.webp' },
  { device_code: 'VR-1', device_name: 'VR - 1', zone: 'PS VR2', category: 'PS VR2', status: 'AVAILABLE', display_order: 8, image_url: '/admin/vr-admin.webp' },
  { device_code: 'VR-2', device_name: 'VR - 2', zone: 'PS VR2', category: 'PS VR2', status: 'AVAILABLE', display_order: 9, image_url: '/admin/vr-admin.webp' }
];

async function seed() {
  const { data, error } = await supabase.from('devices').select('id');
  console.log("Current devices count:", data ? data.length : 0);
  
  if (data && data.length === 0) {
    console.log("Seeding initial devices...");
    const { error: insertError } = await supabase.from('devices').insert(INITIAL_DEVICES);
    if (insertError) {
      console.error("Error inserting devices:", insertError);
    } else {
      console.log("Devices seeded successfully.");
    }
  } else if (error) {
    console.error("Error fetching devices:", error);
  } else {
    console.log("Devices already exist. No seeding needed.");
  }
}

seed();
