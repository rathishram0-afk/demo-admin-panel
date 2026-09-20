import { supabase } from '../src/services/supabase.js';

async function checkDevices() {
  const { data, error } = await supabase.from('devices').select('*').order('display_order', { ascending: true });
  console.log("DEVICES IN SUPABASE:", data ? data.length : 0);
  if (data && data.length > 0) {
    data.forEach((d, index) => {
      console.log(`${index + 1}. Code: "${d.device_code}" | Name: "${d.device_name}" | Order: ${d.display_order} | Zone: "${d.zone}"`);
    });
  }
}

checkDevices();
