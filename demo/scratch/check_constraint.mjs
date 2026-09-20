import { supabase } from '../src/services/supabase.js';

async function testPricingSnapshot() {
  const { data, error } = await supabase
    .from('walkin_sessions')
    .update({ 
      payment_method: 'Card',
      pricing_snapshot: { paymentMethod: 'Debit Card', isDebitCard: true }
    })
    .eq('customer_name', 'Debit Card Test Gamer')
    .select();

  console.log("Update with pricing_snapshot result:", error || data);
}

testPricingSnapshot();
