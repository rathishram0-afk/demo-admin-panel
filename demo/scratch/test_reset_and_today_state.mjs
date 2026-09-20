import { cafeOrderService } from '../src/services/cafeOrderService.js';
import { cafeArchiveService } from '../src/services/cafeArchiveService.js';
import { adminDataService } from '../src/services/adminDataService.js';
import { supabase } from '../src/services/supabase.js';

async function runResetAndTodayStateTest() {
  console.log("==========================================================================");
  console.log("   TESTING CAFE ORDERS + CAFE ANALYTICS RESET & 11 AUG LIVE STATE       ");
  console.log("==========================================================================");

  try {
    // ----------------------------------------------------------------------
    // STEP 1: EXECUTE RESET ALL DATA
    // ----------------------------------------------------------------------
    console.log("\n[STEP 1] Executing RESET ALL DATA...");
    await adminDataService.resetAllData();

    // ----------------------------------------------------------------------
    // STEP 2: VERIFY TODAY'S LIVE CAFE STATE IS 0
    // ----------------------------------------------------------------------
    console.log("\n[STEP 2] Verifying Today's (11 Aug 2026) Live State is 0...");
    const ordersAfterReset = await cafeOrderService.getOrders();
    const metricsAfterReset = await cafeOrderService.getMetrics();
    const analyticsAfterReset = await cafeArchiveService.getAnalyticsSummary('TODAY', ordersAfterReset);

    console.log(`  ✓ Today's Cafe Orders: ${metricsAfterReset.todaysOrders} (Expected: 0)`);
    console.log(`  ✓ Today's Cafe Revenue: ₹${metricsAfterReset.cafeRevenue} (Expected: ₹0)`);
    console.log(`  ✓ Today's Analytics Total Orders: ${analyticsAfterReset.aggregateOrders} (Expected: 0)`);
    console.log(`  ✓ Today's Analytics Total Revenue: ₹${analyticsAfterReset.aggregateRevenue} (Expected: ₹0)`);

    if (metricsAfterReset.todaysOrders !== 0 || metricsAfterReset.cafeRevenue !== 0) {
      console.error("  ❌ STEP 2 FAILED: Today's orders or revenue were not 0 after reset!");
      process.exit(1);
    }

    if (analyticsAfterReset.aggregateOrders !== 0 || analyticsAfterReset.aggregateRevenue !== 0) {
      console.error("  ❌ STEP 2 FAILED: Today's analytics were not 0 after reset!");
      process.exit(1);
    }

    // ----------------------------------------------------------------------
    // STEP 3: SIMULATE REFRESH & RE-CHECK
    // ----------------------------------------------------------------------
    console.log("\n[STEP 3] Simulating Page Refresh (Re-fetching from database)...");
    const reFetchedOrders = await cafeOrderService.getOrders();
    const reFetchedMetrics = await cafeOrderService.getMetrics();
    const reFetchedAnalytics = await cafeArchiveService.getAnalyticsSummary('TODAY', reFetchedOrders);

    console.log(`  ✓ Re-fetched Cafe Orders: ${reFetchedMetrics.todaysOrders} (Expected: 0)`);
    console.log(`  ✓ Re-fetched Cafe Revenue: ₹${reFetchedMetrics.cafeRevenue} (Expected: ₹0)`);
    console.log(`  ✓ Re-fetched Analytics Total Revenue: ₹${reFetchedAnalytics.aggregateRevenue} (Expected: ₹0)`);

    if (reFetchedMetrics.todaysOrders !== 0 || reFetchedMetrics.cafeRevenue !== 0) {
      console.error("  ❌ STEP 3 FAILED: Old data reappeared after simulated refresh!");
      process.exit(1);
    }

    // ----------------------------------------------------------------------
    // STEP 4: HISTORICAL CAFE ARCHIVES PRESERVATION CHECK
    // ----------------------------------------------------------------------
    console.log("\n[STEP 4] Verifying Historical Daily Archives for 10 Aug, 9 Aug, etc. are INTACT...");
    const historicalArchives = await cafeArchiveService.getArchivedCafeReports();
    console.log(`  ✓ Retrieved ${historicalArchives.length} historical daily archives from cafe_daily_archives table:`);
    historicalArchives.forEach(a => {
      console.log(`    - Date: ${a.rawDate} (${a.dateStr}) | Revenue: ₹${a.totalRevenue} | Orders: ${a.totalOrders}`);
    });

    if (historicalArchives.length === 0) {
      console.error("  ❌ STEP 4 FAILED: Historical daily archives were erased!");
      process.exit(1);
    }

    // ----------------------------------------------------------------------
    // STEP 5: CREATE ONE NEW ORDER ON 11 AUG & VERIFY LIVE UPDATE
    // ----------------------------------------------------------------------
    console.log("\n[STEP 5] Creating ONE NEW Cafe Order on 11 Aug 2026 (Pepsi 400ml @ ₹20)...");
    const newOrder = await cafeOrderService.createOrder({
      product: {
        name: 'Pepsi 400ml',
        numericPrice: 20,
        badge: 'Drinks',
        image: '/images/menu/drinks/pepsi-400ml.png'
      },
      quantity: 1,
      customerName: 'Test Gamer 11 Aug',
      mobile: '9876543210',
      mode: 'COUNTER',
      paymentMethod: 'Cash'
    });

    // Collect order to mark paid
    await cafeOrderService.updateOrderStatus(newOrder.orderId, 'Collected');

    // ----------------------------------------------------------------------
    // STEP 6: VERIFY EXACTLY 1 ORDER APPEARS & ANALYTICS UPDATE
    // ----------------------------------------------------------------------
    console.log("\n[STEP 6] Verifying Live Orders & Today's Analytics after 1 New Order...");
    const ordersAfterNew = await cafeOrderService.getOrders();
    const metricsAfterNew = await cafeOrderService.getMetrics();
    const analyticsAfterNew = await cafeArchiveService.getAnalyticsSummary('TODAY', ordersAfterNew);

    console.log(`  ✓ Today's Cafe Orders: ${metricsAfterNew.todaysOrders} (Expected: 1)`);
    console.log(`  ✓ Today's Cafe Revenue: ₹${metricsAfterNew.cafeRevenue} (Expected: ₹20)`);
    console.log(`  ✓ Today's Analytics Total Orders: ${analyticsAfterNew.aggregateOrders} (Expected: 1)`);
    console.log(`  ✓ Today's Analytics Total Revenue: ₹${analyticsAfterNew.aggregateRevenue} (Expected: ₹20)`);
    console.log(`  ✓ Today's Best Selling Product: "${analyticsAfterNew.bestSellingProduct}" (Expected: Pepsi 400ml)`);

    if (metricsAfterNew.todaysOrders !== 1 || metricsAfterNew.cafeRevenue !== 20) {
      console.error("  ❌ STEP 6 FAILED: New order did not update live metrics correctly!");
      process.exit(1);
    }

    if (analyticsAfterNew.aggregateOrders !== 1 || analyticsAfterNew.aggregateRevenue !== 20) {
      console.error("  ❌ STEP 6 FAILED: New order did not update today's analytics!");
      process.exit(1);
    }

    console.log("\n==========================================================================");
    console.log("   SUCCESS! RESET ALL DATA AND 11 AUG LIVE STATE WORKFLOW PASSED 100%    ");
    console.log("==========================================================================");

  } catch (err) {
    console.error("\n❌ TEST ERROR:", err);
    process.exit(1);
  }
}

runResetAndTodayStateTest();
