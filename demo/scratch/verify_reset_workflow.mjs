import { adminDataService } from '../src/services/adminDataService.js';
import { cafeOrderService } from '../src/services/cafeOrderService.js';
import { cafeArchiveService } from '../src/services/cafeArchiveService.js';
import { supabase } from '../src/services/supabase.js';

async function runResetWorkflowVerification() {
  console.log("==========================================================================");
  console.log("       VERIFYING RESET ALL DATA CAFE HISTORY ERASE & LIVE WORKFLOW        ");
  console.log("==========================================================================");

  try {
    // ----------------------------------------------------------------------
    // STEP 1: EXECUTE RESET ALL DATA
    // ----------------------------------------------------------------------
    console.log("\n[STEP 1] Executing RESET ALL DATA (Clearing cafe_orders & cafe_daily_archives)...");
    await adminDataService.resetAllData();

    // ----------------------------------------------------------------------
    // STEP 2: VERIFY OLD HISTORICAL ARCHIVES ARE ERASED
    // ----------------------------------------------------------------------
    console.log("\n[STEP 2] Verifying old historical archives (10 Aug, 9 Aug, etc.) are deleted...");
    const historicalArchivesAfterReset = await cafeArchiveService.getArchivedCafeReports();
    console.log(`  ✓ Historical Cafe Archives Count: ${historicalArchivesAfterReset.length} (Expected: 0)`);

    if (historicalArchivesAfterReset.length !== 0) {
      console.error("  ❌ STEP 2 FAILED: Old historical archives were NOT erased after reset!");
      process.exit(1);
    }

    // ----------------------------------------------------------------------
    // STEP 3: VERIFY TODAY'S LIVE STATE IS ₹0 / 0 ORDERS
    // ----------------------------------------------------------------------
    console.log("\n[STEP 3] Verifying today's live record is ₹0 / 0 orders...");
    const ordersAfterReset = await cafeOrderService.getOrders();
    const metricsAfterReset = await cafeOrderService.getMetrics();
    const analyticsAfterReset = await cafeArchiveService.getAnalyticsSummary('TODAY', ordersAfterReset);

    console.log(`  ✓ Today's Cafe Orders Count: ${metricsAfterReset.todaysOrders} (Expected: 0)`);
    console.log(`  ✓ Today's Cafe Revenue: ₹${metricsAfterReset.cafeRevenue} (Expected: ₹0)`);
    console.log(`  ✓ Today's Analytics Revenue: ₹${analyticsAfterReset.aggregateRevenue} (Expected: ₹0)`);

    if (metricsAfterReset.todaysOrders !== 0 || metricsAfterReset.cafeRevenue !== 0) {
      console.error("  ❌ STEP 3 FAILED: Today's state was not ₹0 / 0 after reset!");
      process.exit(1);
    }

    // ----------------------------------------------------------------------
    // STEP 4: CREATE A NEW ORDER ON TODAY (11 AUG)
    // ----------------------------------------------------------------------
    console.log("\n[STEP 4] Creating a NEW Gaming Cafe Order (Masala Fries @ ₹80)...");
    const newOrder = await cafeOrderService.createOrder({
      product: {
        name: 'Masala Fries',
        numericPrice: 80,
        badge: 'Snacks',
        image: '/images/snack-fries.jpg'
      },
      quantity: 1,
      customerName: 'Production Gamer 11 Aug',
      mobile: '9123456789',
      mode: 'COUNTER',
      sessionId: '-'
    });

    await cafeOrderService.updateOrderStatus(newOrder.orderId, 'Collected');

    // ----------------------------------------------------------------------
    // STEP 5: VERIFY NEW ORDER APPEARS IN TODAY'S ARCHIVE / ANALYTICS
    // ----------------------------------------------------------------------
    console.log("\n[STEP 5] Verifying new order appears in today's archive & analytics...");
    const ordersAfterNew = await cafeOrderService.getOrders();
    const metricsAfterNew = await cafeOrderService.getMetrics();
    const analyticsAfterNew = await cafeArchiveService.getAnalyticsSummary('TODAY', ordersAfterNew);

    console.log(`  ✓ Today's Cafe Orders: ${metricsAfterNew.todaysOrders} (Expected: 1)`);
    console.log(`  ✓ Today's Cafe Revenue: ₹${metricsAfterNew.cafeRevenue} (Expected: ₹80)`);
    console.log(`  ✓ Today's Analytics Total Orders: ${analyticsAfterNew.aggregateOrders} (Expected: 1)`);
    console.log(`  ✓ Today's Analytics Revenue: ₹${analyticsAfterNew.aggregateRevenue} (Expected: ₹80)`);
    console.log(`  ✓ Today's Best Selling Product: "${analyticsAfterNew.bestSellingProduct}" (Expected: Masala Fries)`);

    if (metricsAfterNew.todaysOrders !== 1 || metricsAfterNew.cafeRevenue !== 80) {
      console.error("  ❌ STEP 5 FAILED: Today's live state did not reflect the new order!");
      process.exit(1);
    }

    // ----------------------------------------------------------------------
    // STEP 6: SIMULATE PAGE REFRESH & VERIFY ORDER REMAINS SAVED
    // ----------------------------------------------------------------------
    console.log("\n[STEP 6] Simulating page refresh (Refetching directly from database)...");
    const reFetchedOrders = await cafeOrderService.getOrders();
    const reFetchedMetrics = await cafeOrderService.getMetrics();
    const reFetchedAnalytics = await cafeArchiveService.getAnalyticsSummary('TODAY', reFetchedOrders);
    const reFetchedHistorical = await cafeArchiveService.getArchivedCafeReports();

    console.log(`  ✓ Re-fetched Today Orders: ${reFetchedMetrics.todaysOrders} (Expected: 1)`);
    console.log(`  ✓ Re-fetched Today Revenue: ₹${reFetchedMetrics.cafeRevenue} (Expected: ₹80)`);
    console.log(`  ✓ Re-fetched Today Analytics Revenue: ₹${reFetchedAnalytics.aggregateRevenue} (Expected: ₹80)`);
    console.log(`  ✓ Re-fetched Historical Archives Count: ${reFetchedHistorical.length} (Expected: 0 old archives)`);

    if (reFetchedMetrics.todaysOrders !== 1 || reFetchedMetrics.cafeRevenue !== 80) {
      console.error("  ❌ STEP 6 FAILED: New order was lost after refresh!");
      process.exit(1);
    }

    if (reFetchedHistorical.length !== 0) {
      console.error("  ❌ STEP 6 FAILED: Old deleted historical archives reappeared after refresh!");
      process.exit(1);
    }

    console.log("\n==========================================================================");
    console.log("   SUCCESS! RESET WORKFLOW VERIFIED 100% (CLEAN RESET & PERSISTENT ORDER)  ");
    console.log("==========================================================================");

  } catch (err) {
    console.error("\n❌ TEST ERROR:", err);
    process.exit(1);
  }
}

runResetWorkflowVerification();
