import { supabase } from '../src/services/supabase.js';

async function testDelete() {
  const { data, error } = await supabase.from('cafe_daily_archives').delete().neq('raw_date', '1970-01-01').select();
  console.log("DELETE RESULT - Error:", error);
  console.log("DELETE RESULT - Deleted Rows:", data ? data.length : 0);

  const { data: remaining } = await supabase.from('cafe_daily_archives').select('*');
  console.log("REMAINING IN DB:", remaining ? remaining.length : 0);
}

testDelete();
