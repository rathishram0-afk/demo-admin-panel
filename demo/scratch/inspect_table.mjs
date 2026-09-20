import { supabase } from '../src/services/supabase.js';

async function inspectTable() {
  const { data, error } = await supabase.from('cafe_daily_archives').select('*');
  console.log("DATA IN CAFE DAILY ARCHIVES:", JSON.stringify(data, null, 2));

  if (data && data.length > 0) {
    const ids = data.map(r => r.id).filter(Boolean);
    console.log("TRYING TO DELETE BY IDS:", ids);
    const { data: delData, error: delErr } = await supabase.from('cafe_daily_archives').delete().in('id', ids).select();
    console.log("DEL BY IDS RESULT - Error:", delErr);
    console.log("DEL BY IDS RESULT - Deleted:", delData);
  }
}

inspectTable();
