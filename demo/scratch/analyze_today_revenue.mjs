import { supabase } from '../src/services/supabase.js';

async function analyzeTodayRevenue() {
  console.log("=================================================");
  console.log("PHASE 2 — INVESTIGATE TODAY'S REVENUE RECORDS");
  console.log("=================================================");

  // Get current operational date / business date logic from application
  const now = new Date();
  console.log(`Current ISO Time: ${now.toISOString()}`);
  console.log(`Current Local Time String: ${now.toString()}`);

  const { data: walkins } = await supabase.from('walkin_sessions').select('*');
  const { data: cafe } = await supabase.from('cafe_orders').select('*');

  console.log(`\n================ ALL WALKIN_SESSIONS (${walkins.length}) ================`);
  walkins.forEach((w, i) => {
    const createdAt = w.created_at || w.start_time;
    const dateObj = new Date(createdAt);
    const dateStr = dateObj.toISOString().split('T')[0];
    console.log(`[${i+1}] ID: ${w.id} | SessionCode: ${w.session_code || '-'} | CreatedAt: ${createdAt} | DateISO: ${dateStr} | Customer: ${w.customer_name} | SessionStatus: ${w.session_status} | PaymentStatus: ${w.payment_status} | PaymentMethod: ${w.payment_method} | GamingCharge: ${w.gaming_charge} | OriginalGaming: ${w.original_gaming_amount} | FoodTotal: ${w.food_total} | TotalAmount: ${w.total_amount} | SnapshotPrepaid: ${w.pricing_snapshot?.isPrepaid}`);
  });

  console.log(`\n================ ALL CAFE_ORDERS (${cafe.length}) ================`);
  cafe.forEach((c, i) => {
    const createdAt = c.created_at || c.timestamp || c.date;
    const dateObj = new Date(createdAt);
    const dateStr = dateObj.toISOString().split('T')[0];
    console.log(`[${i+1}] ID: ${c.id || c.order_id} | CreatedAt: ${createdAt} | DateISO: ${dateStr} | Product: ${c.product_name} | Mode: ${c.mode} | SessId: ${c.session_id} | Status: ${c.status} | PaymentStatus: ${c.payment_status} | PaymentMethod: ${c.payment_method} | Total: ${c.total_amount || c.total}`);
  });

  // Group walkins by date
  const walkinsByDate = {};
  walkins.forEach(w => {
    const ts = w.start_time || w.created_at;
    if (!ts) return;
    const d = new Date(ts).toISOString().split('T')[0];
    if (!walkinsByDate[d]) walkinsByDate[d] = [];
    walkinsByDate[d].push(w);
  });

  // Group cafe orders by date
  const cafeByDate = {};
  cafe.forEach(c => {
    const ts = c.created_at || c.timestamp || c.date;
    if (!ts) return;
    const d = new Date(ts).toISOString().split('T')[0];
    if (!cafeByDate[d]) cafeByDate[d] = [];
    cafeByDate[d].push(c);
  });

  const allDates = Array.from(new Set([...Object.keys(walkinsByDate), ...Object.keys(cafeByDate)])).sort().reverse();

  console.log(`\n================ DAILY AGGREGATION ANALYSIS ================`);
  allDates.forEach(d => {
    const dayWalkins = walkinsByDate[d] || [];
    const dayCafe = cafeByDate[d] || [];

    const paidWalkins = dayWalkins.filter(w => {
      const pStatus = String(w.payment_status || '').toLowerCase();
      const sStatus = String(w.session_status || '').toLowerCase();
      return pStatus === 'paid' || pStatus === 'prepaid' || sStatus === 'completed';
    });

    const paidCafe = dayCafe.filter(c => {
      const pStatus = String(c.payment_status || '').toLowerCase();
      const status = String(c.status || '').toLowerCase();
      return pStatus === 'paid' || status === 'completed' || status === 'collected';
    });

    const sumTotalAmountWalkins = paidWalkins.reduce((s, w) => s + (Number(w.total_amount || w.gaming_charge) || 0), 0);
    const sumGamingChargeOnly = paidWalkins.reduce((s, w) => s + (Number(w.gaming_charge || w.original_gaming_amount || (Number(w.total_amount || 0) - Number(w.food_total || 0))) || 0), 0);
    const sumCafeOrders = paidCafe.reduce((s, c) => s + (Number(c.total_amount || c.total) || 0), 0);

    // Filter cafe orders by standalone vs session
    const standaloneCafe = paidCafe.filter(c => String(c.mode || '').toUpperCase() !== 'SESSION' && String(c.session_id || '-').trim() === '-');
    const sessionCafe = paidCafe.filter(c => String(c.mode || '').toUpperCase() === 'SESSION' || String(c.session_id || '-').trim() !== '-');

    const sumStandaloneCafe = standaloneCafe.reduce((s, c) => s + (Number(c.total_amount || c.total) || 0), 0);
    const sumSessionCafe = sessionCafe.reduce((s, c) => s + (Number(c.total_amount || c.total) || 0), 0);

    console.log(`\nDATE: ${d}`);
    console.log(`  Walk-in Sessions Count: ${dayWalkins.length} (Paid: ${paidWalkins.length})`);
    console.log(`  Walk-in Total Amount Sum: ₹${sumTotalAmountWalkins}`);
    console.log(`  Walk-in Gaming Charge Only Sum: ₹${sumGamingChargeOnly}`);
    console.log(`  Cafe Orders Count: ${dayCafe.length} (Paid: ${paidCafe.length} -> Standalone: ${standaloneCafe.length}, Session: ${sessionCafe.length})`);
    console.log(`  Standalone Cafe Sum: ₹${sumStandaloneCafe}`);
    console.log(`  Session Cafe Sum: ₹${sumSessionCafe}`);
    console.log(`  All Paid Cafe Sum: ₹${sumCafeOrders}`);
    console.log(`  TOTAL (Gaming Charge Only + ALL Paid Cafe): ₹${sumGamingChargeOnly + sumCafeOrders}`);
    console.log(`  TOTAL (Walk-in Total Amount + Standalone Cafe): ₹${sumTotalAmountWalkins + sumStandaloneCafe}`);
  });
}

analyzeTodayRevenue();
