import { supabase } from '../src/services/supabase.js';

async function checkCafeOrders() {
  const { data, error } = await supabase.from('cafe_orders').select('*');
  console.log("CAFE ORDERS IN SUPABASE:", data ? data.length : 0);
  if (data && data.length > 0) {
    data.forEach(o => {
      console.log(`- Order ${o.order_id || o.id} | Date: ${o.created_at} | Prod: ${o.product_name} | Amt: ₹${o.total_amount}`);
    });
  }
}

checkCafeOrders();
