import { supabase } from '../src/services/supabase.js';

const TARGET_DEVICES = [
  { device_code: 'PS5-1', device_name: 'PS5 - 1', zone: 'PlayStation 5', category: 'PlayStation 5', platform: 'PlayStation 5', status: 'AVAILABLE', is_active: true, display_order: 1, image_url: '/admin/ps5-admin.webp' },
  { device_code: 'PS5-2', device_name: 'PS5 - 2', zone: 'PlayStation 5', category: 'PlayStation 5', platform: 'PlayStation 5', status: 'AVAILABLE', is_active: true, display_order: 2, image_url: '/admin/ps5-admin.webp' },
  { device_code: 'PS5-3', device_name: 'PS5 - 3', zone: 'PlayStation 5', category: 'PlayStation 5', platform: 'PlayStation 5', status: 'AVAILABLE', is_active: true, display_order: 3, image_url: '/admin/ps5-admin.webp' },
  { device_code: 'PS5-4', device_name: 'PS5 - 4', zone: 'PlayStation 5', category: 'PlayStation 5', platform: 'PlayStation 5', status: 'AVAILABLE', is_active: true, display_order: 4, image_url: '/admin/ps5-admin.webp' },
  { device_code: 'PS5-1-EXTRA', device_name: 'PS5 - 1 EXTRA PERSON', zone: 'PlayStation 5', category: 'PlayStation 5', platform: 'PlayStation 5', status: 'AVAILABLE', is_active: true, display_order: 5, image_url: '/admin/ps5-admin.webp' },
  { device_code: 'PS5-2-EXTRA', device_name: 'PS5 - 2 EXTRA PERSON', zone: 'PlayStation 5', category: 'PlayStation 5', platform: 'PlayStation 5', status: 'AVAILABLE', is_active: true, display_order: 6, image_url: '/admin/ps5-admin.webp' },
  { device_code: 'PS5-3-EXTRA', device_name: 'PS5 - 3 EXTRA PERSON', zone: 'PlayStation 5', category: 'PlayStation 5', platform: 'PlayStation 5', status: 'AVAILABLE', is_active: true, display_order: 7, image_url: '/admin/ps5-admin.webp' },
  { device_code: 'PS5-4-EXTRA', device_name: 'PS5 - 4 EXTRA PERSON', zone: 'PlayStation 5', category: 'PlayStation 5', platform: 'PlayStation 5', status: 'AVAILABLE', is_active: true, display_order: 8, image_url: '/admin/ps5-admin.webp' },
  { device_code: 'PS4-1', device_name: 'PS4 - 1', zone: 'PlayStation 4', category: 'PlayStation 4', platform: 'PlayStation 4', status: 'AVAILABLE', is_active: true, display_order: 9, image_url: '/admin/ps4-admin.webp' },
  { device_code: 'PS4-2', device_name: 'PS4 - 2', zone: 'PlayStation 4', category: 'PlayStation 4', platform: 'PlayStation 4', status: 'AVAILABLE', is_active: true, display_order: 10, image_url: '/admin/ps4-admin.webp' },
  { device_code: 'PS4-3', device_name: 'PS4 - 3', zone: 'PlayStation 4', category: 'PlayStation 4', platform: 'PlayStation 4', status: 'AVAILABLE', is_active: true, display_order: 11, image_url: '/admin/ps4-admin.webp' },
  { device_code: 'PS4-4', device_name: 'PS4 - 4', zone: 'PlayStation 4', category: 'PlayStation 4', platform: 'PlayStation 4', status: 'AVAILABLE', is_active: true, display_order: 12, image_url: '/admin/ps4-admin.webp' },
  { device_code: 'PS2-1', device_name: 'PS2 - 1', zone: 'PlayStation 2', category: 'PlayStation 2', platform: 'PlayStation 2', status: 'AVAILABLE', is_active: true, display_order: 13, image_url: '/admin/ps2-admin.webp' },
  { device_code: 'SIM-1', device_name: 'SIM - 1', zone: 'Racing Simulator', category: 'Racing Simulator', platform: 'Racing Simulator', status: 'AVAILABLE', is_active: true, display_order: 14, image_url: '/admin/sim1-admin.webp' },
  { device_code: 'VR-1', device_name: 'VR - 1', zone: 'PS VR2', category: 'PS VR2', platform: 'PS VR2', status: 'AVAILABLE', is_active: true, display_order: 15, image_url: '/admin/vr-admin.webp' }
];

async function syncDevices() {
  console.log("Syncing centralized 15 devices into Supabase...");

  // Delete legacy weird devices e.g. PS5 --2, etc.
  const { error: delErr } = await supabase.from('devices').delete().not('id', 'is', null);
  if (delErr) {
    console.error("Error clearing old devices table:", delErr);
  }

  const { data, error } = await supabase.from('devices').insert(TARGET_DEVICES).select();
  if (error) {
    console.error("Error inserting target devices:", error);
  } else {
    console.log(`Successfully synced ${data.length} devices into Supabase:`);
    data.forEach((d, i) => {
      console.log(`  ${i + 1}. [${d.device_code}] "${d.device_name}" (Order: ${d.display_order})`);
    });
  }
}

syncDevices();
