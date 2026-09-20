import { supabase } from '../src/services/supabase.js';

async function testAllowedPaymentMethods() {
  const candidates = ['Cash', 'UPI', 'Card', 'Debit Card', 'Credit Card', 'Debit/Credit Card'];
  
  for (const cand of candidates) {
    const code = 'TEST-METHOD-' + Date.now();
    const { data, error } = await supabase.from('walkin_sessions').insert([{
      session_code: code,
      customer_name: 'Test Method Constraint',
      device_id: 'PS5-1',
      device_name: 'PS5',
      device_type: 'PlayStation 5',
      player_count: 1,
      planned_duration: 60,
      hourly_price: 60,
      total_amount: 60,
      gaming_charge: 60,
      payment_status: 'Paid',
      payment_method: cand,
      session_status: 'Active',
      start_time: new Date().toISOString()
    }]).select();

    if (error) {
      console.log(`❌ Candidate '${cand}': REJECTED (${error.message})`);
    } else {
      console.log(`✅ Candidate '${cand}': ALLOWED`);
      await supabase.from('walkin_sessions').delete().eq('id', data[0].id);
    }
  }
}

testAllowedPaymentMethods();
