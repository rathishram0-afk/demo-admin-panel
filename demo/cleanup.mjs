import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Starting deletion of transactional records...");
  
  const dummyId = '00000000-0000-0000-0000-000000000000';
  
  // 1. Walk-in Sessions
  const { data: walkins, error: err1 } = await supabase.from('walkin_sessions').delete().neq('id', dummyId).select();
  console.log("Walkin Sessions deleted:", err1 ? err1.message : walkins?.length || 0);

  // 2. Cafe Orders
  const { data: orders, error: err2 } = await supabase.from('cafe_orders').delete().neq('id', dummyId).select();
  console.log("Cafe Orders deleted:", err2 ? err2.message : orders?.length || 0);

  // 3. Bookings
  const { data: bookings, error: err3 } = await supabase.from('bookings').delete().neq('id', dummyId).select();
  console.log("Bookings deleted:", err3 ? err3.message : bookings?.length || 0);
  
  try {
    const { data: payments, error: err4 } = await supabase.from('payments').delete().neq('id', dummyId).select();
    console.log("Payments deleted:", err4 ? err4.message : payments?.length || 0);
  } catch (e) { console.log("Payments deleted: Table does not exist"); }
  
  // 5. Activity Logs (if exists)
  try {
    const { data: activity, error: err5 } = await supabase.from('activity_logs').delete().neq('id', dummyId).select();
    console.log("Activity Logs deleted:", err5 ? err5.message : activity?.length || 0);
  } catch (e) { console.log("Activity Logs deleted: Table does not exist"); }

  // 6. Report Analytics (if exists)
  try {
    const { data: reports, error: err6 } = await supabase.from('report_analytics').delete().neq('id', dummyId).select();
    console.log("Report Analytics deleted:", err6 ? err6.message : reports?.length || 0);
  } catch (e) { console.log("Report Analytics deleted: Table does not exist"); }

  // 7. Make sure devices are all available
  try {
    const { data: devices, error: err7 } = await supabase.from('devices').update({ status: 'AVAILABLE' }).neq('id', dummyId).select();
    console.log("Devices reset to AVAILABLE:", err7 ? err7.message : devices?.length || 0);
  } catch (e) { console.log("Devices reset error"); }

  console.log("Done.");
}

run();
