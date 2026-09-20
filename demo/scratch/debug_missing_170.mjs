import { supabase } from '../src/services/supabase.js';
import { sessionService } from '../src/services/sessionService.js';

async function debugMissing170() {
  console.log("=================================================");
  console.log("DEBUGGING MISSING ₹170 RECONCILIATION FOR TODAY");
  console.log("=================================================");

  const { data: walkins } = await supabase.from('walkin_sessions').select('*');
  const { data: cafe } = await supabase.from('cafe_orders').select('*');

  const todayStr = '2026-08-20';

  console.log(`\n1. WALKIN_SESSIONS FOR TODAY (${todayStr}):`);
  let sessionSum = 0;
  walkins.forEach((w, i) => {
    const sDate = sessionService.getSessionBusinessDate(w);
    if (sDate === todayStr) {
      const pStatus = String(w.payment_status || '').toLowerCase();
      const sStatus = String(w.session_status || '').toLowerCase();
      const isPaid = pStatus === 'paid' || pStatus === 'prepaid' || sStatus === 'completed';
      const isPrepaid = w.pricing_snapshot?.isPrepaid === true || pStatus === 'prepaid' || (pStatus === 'paid' && sStatus !== 'completed');
      
      const gamingCharge = Number(w.gaming_charge ?? w.original_gaming_amount ?? (Number(w.total_amount || 0) - Number(w.food_total || 0)) ?? w.total_amount ?? 0);
      const recognized = (sStatus === 'completed' || isPrepaid) ? gamingCharge : 0;
      const method = sessionService.resolvePaymentMethod(w);

      console.log(`  [${i+1}] ID: ${w.id} | Code: ${w.session_code} | Customer: ${w.customer_name} | SessionStatus: ${w.session_status} | PayStatus: ${w.payment_status} | RecognizedRev: ₹${recognized} | Method: '${method}' | RawMethod: '${w.payment_method}' | PricingSnapMethod: '${w.pricing_snapshot?.paymentMethod}' | GamingCharge: ₹${w.gaming_charge} | TotalAmount: ₹${w.total_amount}`);
      sessionSum += recognized;
    }
  });
  console.log(`  SESSION REVENUE TOTAL FOR TODAY: ₹${sessionSum}`);

  console.log(`\n2. CAFE_ORDERS FOR TODAY (${todayStr}):`);
  let cafeSum = 0;
  cafe.forEach((c, i) => {
    const ts = c.created_at || c.timestamp || c.date;
    const cDate = sessionService.getBusinessDate(ts);
    if (cDate === todayStr) {
      const status = String(c.status || '').toLowerCase();
      const pStatus = String(c.payment_status || '').toLowerCase();
      const isPaid = pStatus === 'paid' || status === 'completed' || status === 'collected';
      const amt = Number(c.total_amount || c.total || 0);
      const method = sessionService.resolvePaymentMethod(c);

      console.log(`  [${i+1}] ID: ${c.id || c.order_id} | Product: ${c.product_name} | Status: ${c.status} | PayStatus: ${c.payment_status} | Amount: ₹${amt} | Method: '${method}' | RawMethod: '${c.payment_method}' | SessId: ${c.session_id}`);
      if (isPaid) cafeSum += amt;
    }
  });
  console.log(`  CAFE REVENUE TOTAL FOR TODAY: ₹${cafeSum}`);

  console.log(`\nTOTAL TODAY REVENUE: ₹${sessionSum + cafeSum}`);

  // Now let's check what Reports & Analytics UI component or getTodaySummary / getHistoricalReports computes for payment breakdown!
  const summary = await sessionService.getTodaySummary(todayStr);
  console.log("\ngetTodaySummary(2026-08-20) Summary Output:");
  console.log(`  Revenue: ₹${summary.totalRevenue}`);
  console.log(`  Payment Breakdown:`, summary.paymentBreakdown);

  const reports = await sessionService.getHistoricalReports();
  const todayReport = reports.find(r => r.rawDate === todayStr);
  console.log("\ngetHistoricalReports() Today Report Entry:");
  console.log(`  Revenue: ₹${todayReport?.revenue}`);
  console.log(`  Payment Breakdown:`, todayReport?.paymentBreakdown);
}

debugMissing170();
