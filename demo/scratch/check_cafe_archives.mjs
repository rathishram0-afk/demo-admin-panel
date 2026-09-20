import { supabase } from '../src/services/supabase.js';

async function checkArchives() {
  const { data, error } = await supabase.from('cafe_daily_archives').select('*');
  console.log("CAFE DAILY ARCHIVES IN SUPABASE:", data ? data.length : 0);
  if (data && data.length > 0) {
    data.forEach(a => {
      console.log(`- Date: ${a.raw_date} (${a.date_str}) | Revenue: ₹${a.total_revenue} | Orders: ${a.total_orders}`);
    });
  }
}

checkArchives();
