import { sessionService } from '../src/services/sessionService.js';
import { supabase } from '../src/services/supabase.js';
import { deviceService } from '../src/services/deviceService.js';

async function testFinalReconciliation() {
  console.log("=================================================");
  console.log("RUNNING ALL SECTION 14 RECONCILIATION TEST CASES");
  console.log("=================================================");

  // Cleanup test records
  await supabase.from('walkin_sessions').delete().like('customer_name', 'ReconTest%');

  const baseSummary = await sessionService.getTodaySummary();
  const baseRevenue = baseSummary.totalRevenue;
  console.log(`Base Today Revenue: ₹${baseRevenue}`);

  // ------------------------------------------------------------------
  // TEST 1: Paid Checkout ₹100 Cash
  // ------------------------------------------------------------------
  console.log("\n--- TEST 1: Paid Checkout ₹100 Cash ---");
  await sessionService.startWalkInSession({
    stationId: 'PS5-3',
    customerName: 'ReconTest 1',
    phone: '9911111111',
    numPlayers: 1,
    durationMinutes: 60,
    hourlyPrice: 100,
    estimatedTotal: 100,
    paymentStatus: 'Pay at Checkout',
    paymentMethod: 'Cash'
  });
  await sessionService.endSession('PS5-3', { paymentMethod: 'Cash', confirmed: true });

  const sum1 = await sessionService.getTodaySummary();
  const diff1 = sum1.totalRevenue - baseRevenue;
  console.log(`  Revenue increase: +₹${diff1} (Expected ₹100)`);
  if (diff1 !== 100) throw new Error("TEST 1 Failed");
  console.log("✓ TEST 1 PASSED");

  // ------------------------------------------------------------------
  // TEST 2: Paid Checkout ₹100 UPI
  // ------------------------------------------------------------------
  console.log("\n--- TEST 2: Paid Checkout ₹100 UPI ---");
  const base2 = sum1.totalRevenue;
  await sessionService.startWalkInSession({
    stationId: 'PS5-3',
    customerName: 'ReconTest 2',
    phone: '9911111112',
    numPlayers: 1,
    durationMinutes: 60,
    hourlyPrice: 100,
    estimatedTotal: 100,
    paymentStatus: 'Pay at Checkout',
    paymentMethod: 'UPI'
  });
  await sessionService.endSession('PS5-3', { paymentMethod: 'UPI', confirmed: true });

  const sum2 = await sessionService.getTodaySummary();
  const diff2 = sum2.totalRevenue - base2;
  console.log(`  Revenue increase: +₹${diff2} (Expected ₹100)`);
  console.log(`  UPI Breakdown Total: ₹${sum2.paymentBreakdown.UPI}`);
  if (diff2 !== 100) throw new Error("TEST 2 Failed");
  console.log("✓ TEST 2 PASSED");

  // ------------------------------------------------------------------
  // TEST 3: Cash + UPI Reconciliation Sum Check
  // ------------------------------------------------------------------
  console.log("\n--- TEST 3: Payment Breakdown Reconciliation Sum Check ---");
  const pbSum = (sum2.paymentBreakdown.Cash || 0) + (sum2.paymentBreakdown.UPI || 0) + (sum2.paymentBreakdown['Debit Card'] || 0);
  console.log(`  Today Total Revenue: ₹${sum2.totalRevenue}`);
  console.log(`  Breakdown Sum: Cash ₹${sum2.paymentBreakdown.Cash} + UPI ₹${sum2.paymentBreakdown.UPI} + Debit Card ₹${sum2.paymentBreakdown['Debit Card'] || 0} = ₹${pbSum}`);
  if (pbSum !== sum2.totalRevenue) {
    throw new Error(`Breakdown sum ₹${pbSum} does not match Total Revenue ₹${sum2.totalRevenue}!`);
  }
  console.log("✓ TEST 3 PASSED");

  // ------------------------------------------------------------------
  // TEST 4: Prepaid Session No Double Counting
  // ------------------------------------------------------------------
  console.log("\n--- TEST 4: Prepaid Session No Double Counting ---");
  const base4 = sum2.totalRevenue;
  await sessionService.startWalkInSession({
    stationId: 'PS5-3',
    customerName: 'ReconTest 4',
    phone: '9911111114',
    numPlayers: 1,
    durationMinutes: 60,
    hourlyPrice: 100,
    estimatedTotal: 100,
    paymentStatus: 'Prepaid',
    paymentMethod: 'Cash'
  });
  const sum4_1 = await sessionService.getTodaySummary();
  console.log(`  Revenue after Prepaid Start: ₹${sum4_1.totalRevenue} (+₹${sum4_1.totalRevenue - base4})`);

  await sessionService.endSession('PS5-3', { paymentMethod: 'Cash', confirmed: true });
  const sum4_2 = await sessionService.getTodaySummary();
  console.log(`  Revenue after Prepaid End: ₹${sum4_2.totalRevenue} (Change from start: +₹${sum4_2.totalRevenue - sum4_1.totalRevenue})`);
  if (sum4_2.totalRevenue !== sum4_1.totalRevenue) {
    throw new Error("Ending Prepaid session created duplicate revenue!");
  }
  console.log("✓ TEST 4 PASSED");

  // ------------------------------------------------------------------
  // TEST 5: Idempotency (Repeat Calls / Dashboard / Reports)
  // ------------------------------------------------------------------
  console.log("\n--- TEST 5: Idempotency & Dashboard/Reports Sync ---");
  const dMetrics = await sessionService.getDashboardMetrics(true);
  const reports = await sessionService.getHistoricalReports();
  const todayReport = reports.find(r => r.rawDate === sum4_2.opDate);

  console.log(`  Dashboard Revenue: ₹${dMetrics.todayRevenue}`);
  console.log(`  Reports Revenue: ₹${todayReport.revenue}`);
  const repPbSum = (todayReport.paymentBreakdown.Cash || 0) + (todayReport.paymentBreakdown.UPI || 0) + (todayReport.paymentBreakdown['Debit Card'] || 0);
  console.log(`  Reports Breakdown Sum: ₹${repPbSum}`);

  if (dMetrics.todayRevenue !== todayReport.revenue || repPbSum !== todayReport.revenue) {
    throw new Error("Dashboard and Reports mismatch or breakdown sum mismatch!");
  }
  console.log("✓ TEST 5 PASSED");

  // Cleanup test records
  await supabase.from('walkin_sessions').delete().like('customer_name', 'ReconTest%');
  await deviceService.toggleStatus('PS5-3', 'AVAILABLE').catch(() => {});

  console.log("\n=================================================");
  console.log("ALL SECTION 14 RECONCILIATION TESTS PASSED 100%");
  console.log("=================================================");
}

testFinalReconciliation();
