import { supabase } from '../src/services/supabase.js';

async function checkPaymentStatuses() {
  const { data, error } = await supabase.from('walkin_sessions').select('payment_status').limit(50);
  if (error) {
    console.error("Error fetching payment_status:", error);
    return;
  }
  const statuses = Array.from(new Set(data.map(d => d.payment_status)));
  console.log("Existing payment_status values in DB:", statuses);
}

checkPaymentStatuses();
