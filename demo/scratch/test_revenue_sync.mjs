import { sessionService } from '../src/services/sessionService.js';
import { cafeOrderService } from '../src/services/cafeOrderService.js';
import { supabase } from '../src/services/supabase.js';

async function runRevenueSyncTests() {
  console.log("==========================================================================");
  console.log("       VERIFYING REVENUE DASHBOARD SINGLE SOURCE OF TRUTH & SYNC         ");
  console.log("==========================================================================");

  let testOrderId = null;
  let testSessionId = null;

  try {
    const currentBizDate = sessionService.getBusinessDate(new Date());
    console.log(`Current Business Date: ${currentBizDate}`);

    // TEST 1: Baseline Check (Today's existing ₹100 transaction)
    console.log("\n[TEST 1] Verifying baseline today revenue from Supabase DB...");
    const baseMetrics = await sessionService.getDashboardMetrics(true);
    const baseReports = await sessionService.getHistoricalReports();
    const todayReport = baseReports.find(r => r.rawDate === currentBizDate);

    console.log(`  ✓ Dashboard Today's Revenue: ₹${baseMetrics.todayRevenue} (Expected: ₹100)`);
    console.log(`  ✓ Reports & Analytics Today's Revenue: ₹${todayReport ? todayReport.revenue : 0} (Expected: ₹100)`);

    if (baseMetrics.todayRevenue !== 100 || (todayReport && todayReport.revenue !== 100)) {
      console.error("  ❌ TEST 1 FAILED: Baseline revenue does not match ₹100!");
      process.exit(1);
    }

    // TEST 2: Stale Local Storage Resiliency Check
    console.log("\n[TEST 2] Testing resiliency against stale localStorage (CLOSED / Old Date)...");
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('gforce_business_day_state', 'CLOSED');
      localStorage.setItem('gforce_operational_date', '2026-08-10');
    }

    const staleMetrics = await sessionService.getDashboardMetrics(true);
    console.log(`  ✓ Dashboard Today's Revenue with Stale LocalStorage: ₹${staleMetrics.todayRevenue} (Expected: ₹100)`);

    if (staleMetrics.todayRevenue !== 100) {
      console.error("  ❌ TEST 2 FAILED: Stale localStorage caused Dashboard revenue to drop!");
      process.exit(1);
    }

    // TEST 3: Add ₹50 Cafe Order & Verify Dashboard & Reports Match Exactly
    console.log("\n[TEST 3] Creating a completed ₹50 Cafe Order for today...");
    const cafeOrder = await cafeOrderService.createOrder({
      product: {
        name: 'Test Cold Coffee',
        numericPrice: 50,
        badge: 'Drinks',
        image: ''
      },
      quantity: 1,
      customerName: 'Test Gamer 15 Aug',
      mobile: '9999999999',
      mode: 'COUNTER',
      sessionId: '-'
    });

    testOrderId = cafeOrder.id || cafeOrder.orderId;
    await cafeOrderService.updateOrderStatus(testOrderId, 'Collected');

    const metricsAfterCafe = await sessionService.getDashboardMetrics(true);
    const reportsAfterCafe = await sessionService.getHistoricalReports();
    const todayReportAfterCafe = reportsAfterCafe.find(r => r.rawDate === currentBizDate);

    console.log(`  ✓ Dashboard Revenue after +₹50 Cafe Order: ₹${metricsAfterCafe.todayRevenue} (Expected: ₹150)`);
    console.log(`  ✓ Reports & Analytics Revenue: ₹${todayReportAfterCafe ? todayReportAfterCafe.revenue : 0} (Expected: ₹150)`);

    if (metricsAfterCafe.todayRevenue !== 150 || (todayReportAfterCafe && todayReportAfterCafe.revenue !== 150)) {
      console.error("  ❌ TEST 3 FAILED: Revenue after cafe order did not equal ₹150!");
      process.exit(1);
    }

    // TEST 4: Complete another ₹100 Session & Verify Dashboard & Reports Match Exactly
    console.log("\n[TEST 4] Completing another ₹100 Gaming Session for today...");
    const { data: newSession, error: sErr } = await supabase.from('walkin_sessions').insert([{
      session_code: 'TEST-346',
      customer_name: 'Test Gamer 2',
      mobile_number: '9888888888',
      device_id: 'PS5-1',
      device_name: 'PS5 - 1',
      device_type: 'PlayStation 5',
      player_count: 1,
      planned_duration: 60,
      hourly_price: 100,
      total_amount: 100,
      gaming_charge: 100,
      payment_method: 'Cash',
      payment_status: 'Paid',
      session_status: 'Completed',
      start_time: new Date().toISOString(),
      actual_end_time: new Date().toISOString(),
      created_at: new Date().toISOString()
    }]).select();

    if (sErr) throw sErr;
    testSessionId = newSession[0].id;

    const finalMetrics = await sessionService.getDashboardMetrics(true);
    const finalReports = await sessionService.getHistoricalReports();
    const finalTodayReport = finalReports.find(r => r.rawDate === currentBizDate);

    console.log(`  ✓ Dashboard Final Revenue (+₹100 session): ₹${finalMetrics.todayRevenue} (Expected: ₹250)`);
    console.log(`  ✓ Reports & Analytics Final Revenue: ₹${finalTodayReport ? finalTodayReport.revenue : 0} (Expected: ₹250)`);

    if (finalMetrics.todayRevenue !== 250 || (finalTodayReport && finalTodayReport.revenue !== 250)) {
      console.error("  ❌ TEST 4 FAILED: Revenue after session completion did not equal ₹250!");
      process.exit(1);
    }

    console.log("\n==========================================================================");
    console.log("   SUCCESS! REVENUE DASHBOARD SINGLE SOURCE OF TRUTH VERIFIED 100%       ");
    console.log("==========================================================================");

  } catch (err) {
    console.error("\n❌ TEST ERROR:", err);
    process.exit(1);
  } finally {
    // Cleanup test records
    console.log("\n[CLEANUP] Cleaning up test records from database...");
    if (testOrderId) {
      await supabase.from('cafe_orders').delete().eq('id', testOrderId);
    }
    if (testSessionId) {
      await supabase.from('walkin_sessions').delete().eq('id', testSessionId);
    }
    console.log("  ✓ Cleanup complete.");
  }
}

runRevenueSyncTests();
