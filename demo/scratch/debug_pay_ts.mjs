import { sessionService } from '../src/services/sessionService.js';
import { supabase } from '../src/services/supabase.js';

async function testPayTs() {
  const now = new Date();
  const todayStr = sessionService.getBusinessDate(now);
  console.log("now:", now.toISOString());
  console.log("todayStr:", todayStr);

  const nowIso = now.toISOString();
  const code = 'TEST-DEBUG-' + Date.now();
  const { data, error } = await supabase.from('walkin_sessions').insert([{
    session_code: code,
    customer_name: 'Debug Player',
    device_id: 'PS5-1',
    device_name: 'PS5',
    device_type: 'PlayStation 5',
    player_count: 1,
    planned_duration: 60,
    hourly_price: 60,
    total_amount: 60,
    gaming_charge: 60,
    payment_status: 'Pending',
    session_status: 'Active',
    pricing_snapshot: { isPrepaid: false, paymentStatus: 'Pay at Checkout' },
    start_time: nowIso,
    created_at: nowIso
  }]).select();

  if (error) {
    console.error("Insert error:", error);
    return;
  }
  const id = data[0].id;
  console.log("✓ Successfully inserted session ID:", id);

  // Complete session via sessionService.endSession or clean update payload
  const endIso = new Date().toISOString();
  const { error: upErr } = await supabase.from('walkin_sessions').update({
    session_status: 'Completed',
    actual_end_time: endIso,
    payment_status: 'Paid',
    payment_method: 'UPI',
    total_amount: 60
  }).eq('id', id);

  if (upErr) {
    console.error("Update error:", upErr);
  }

  const { data: updated } = await supabase.from('walkin_sessions').select('*').eq('id', id).single();
  console.log("Updated row from DB:", updated);

  const pStatus = String(updated.payment_status || '').toLowerCase();
  const sStatus = String(updated.session_status || '').toLowerCase();
  const isPaid = pStatus === 'paid' || pStatus === 'prepaid' || sStatus === 'completed';
  const isPrepaid = updated.pricing_snapshot?.isPrepaid === true || pStatus === 'prepaid' || (pStatus === 'paid' && sStatus !== 'completed');
  const payTs = isPrepaid ? (updated.start_time || updated.created_at) : (updated.actual_end_time || updated.created_at);
  const busDate = sessionService.getBusinessDate(payTs);

  console.log(`pStatus: ${pStatus}, sStatus: ${sStatus}`);
  console.log(`isPaid: ${isPaid}, isPrepaid: ${isPrepaid}`);
  console.log(`payTs: ${payTs}`);
  console.log(`sessionService.getBusinessDate(payTs): ${busDate}`);
  console.log(`Matches todayStr (${todayStr})? ${busDate === todayStr}`);

  let summary = await sessionService.getTodaySummary(todayStr);
  let found = summary.todayCompletedSessions.find(w => w.id === id);
  console.log("Found in getTodaySummary?", Boolean(found));

  await supabase.from('walkin_sessions').delete().eq('id', id);
}

testPayTs();
