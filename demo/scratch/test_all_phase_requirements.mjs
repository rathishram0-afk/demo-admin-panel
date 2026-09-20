import { sessionService } from '../src/services/sessionService.js';
import { supabase } from '../src/services/supabase.js';
import { deviceService } from '../src/services/deviceService.js';

async function testAllPhaseRequirements() {
  console.log("=================================================");
  console.log("VERIFYING ALL PHASE 19 & PHASE 20 REQUIREMENTS");
  console.log("=================================================");

  // Cleanup test records
  await supabase.from('walkin_sessions').delete().like('customer_name', 'PhaseTest%');

  const initialSummary = await sessionService.getTodaySummary();
  const baseRevenue = initialSummary.totalRevenue;
  console.log(`Initial Base Revenue for Today (${initialSummary.opDate}): ₹${baseRevenue}`);

  // TEST 1: Paid Checkout + Cash
  console.log("\n--- TEST 1: Paid Checkout + Cash ---");
  await sessionService.startWalkInSession({
    stationId: 'PS5-2',
    customerName: 'PhaseTest 1',
    phone: '9900000001',
    numPlayers: 1,
    durationMinutes: 60,
    hourlyPrice: 100,
    estimatedTotal: 100,
    paymentStatus: 'Pay at Checkout',
    paymentMethod: 'Cash'
  });

  let s1List = (await supabase.from('walkin_sessions').select('*').eq('customer_name', 'PhaseTest 1')).data;
  let s1 = s1List[0];
  console.log(`  Session Started (Pay at Checkout): Status = ${s1.session_status}, PayStatus = ${s1.payment_status}`);
  let midSum1 = await sessionService.getTodaySummary();
  console.log(`  Revenue while session RUNNING: ₹${midSum1.totalRevenue} (Change: +₹${midSum1.totalRevenue - baseRevenue})`);
  if (midSum1.totalRevenue !== baseRevenue) {
    throw new Error("Pay at Checkout session increased revenue while RUNNING!");
  }

  // End session & pay cash
  await sessionService.endSession('PS5-2', { paymentMethod: 'Cash', confirmed: true });
  let endSum1 = await sessionService.getTodaySummary();
  console.log(`  Revenue after END SESSION (Cash Paid): ₹${endSum1.totalRevenue} (Change: +₹${endSum1.totalRevenue - baseRevenue})`);
  if (endSum1.totalRevenue !== baseRevenue + 100) {
    throw new Error(`Expected revenue to increase by ₹100, got +₹${endSum1.totalRevenue - baseRevenue}`);
  }
  console.log("✓ TEST 1 PASSED");

  // TEST 2: Paid Checkout + UPI
  console.log("\n--- TEST 2: Paid Checkout + UPI ---");
  const base2 = endSum1.totalRevenue;
  await sessionService.startWalkInSession({
    stationId: 'PS5-2',
    customerName: 'PhaseTest 2',
    phone: '9900000002',
    numPlayers: 1,
    durationMinutes: 60,
    hourlyPrice: 100,
    estimatedTotal: 100,
    paymentStatus: 'Pay at Checkout',
    paymentMethod: 'UPI'
  });
  await sessionService.endSession('PS5-2', { paymentMethod: 'UPI', confirmed: true });
  let endSum2 = await sessionService.getTodaySummary();
  console.log(`  Revenue after UPI Paid Checkout: ₹${endSum2.totalRevenue} (Change: +₹${endSum2.totalRevenue - base2})`);
  console.log(`  UPI Breakdown: ₹${endSum2.paymentBreakdown.UPI}`);
  if (endSum2.totalRevenue !== base2 + 100) {
    throw new Error("UPI Paid Checkout did not increase total revenue by ₹100!");
  }
  console.log("✓ TEST 2 PASSED");

  // TEST 3: Prepaid + Cash
  console.log("\n--- TEST 3: Prepaid + Cash ---");
  const base3 = endSum2.totalRevenue;
  await sessionService.startWalkInSession({
    stationId: 'PS5-2',
    customerName: 'PhaseTest 3',
    phone: '9900000003',
    numPlayers: 1,
    durationMinutes: 60,
    hourlyPrice: 100,
    estimatedTotal: 100,
    paymentStatus: 'Prepaid',
    paymentMethod: 'Cash'
  });
  let endSum3 = await sessionService.getTodaySummary();
  console.log(`  Revenue immediately after Prepaid Session Start: ₹${endSum3.totalRevenue} (Change: +₹${endSum3.totalRevenue - base3})`);
  if (endSum3.totalRevenue !== base3 + 100) {
    throw new Error("Prepaid session start did not immediately record revenue!");
  }

  // End Prepaid Session (must NOT add revenue again)
  await sessionService.endSession('PS5-2', { paymentMethod: 'Cash', confirmed: true });
  let endSum3_2 = await sessionService.getTodaySummary();
  console.log(`  Revenue after Ending Prepaid Session: ₹${endSum3_2.totalRevenue} (Change from start: +₹${endSum3_2.totalRevenue - endSum3.totalRevenue})`);
  if (endSum3_2.totalRevenue !== endSum3.totalRevenue) {
    throw new Error("Ending Prepaid session double counted revenue!");
  }
  console.log("✓ TEST 3 PASSED");

  // TEST 4: Idempotency Verification (Repeat Calls / Dashboard / Reports)
  console.log("\n--- TEST 4: Idempotency (Dashboard / Reports / Repeat Fetch) ---");
  const dashMetrics1 = await sessionService.getDashboardMetrics(true);
  const dashMetrics2 = await sessionService.getDashboardMetrics(true);
  const reports1 = await sessionService.getHistoricalReports();
  const reports2 = await sessionService.getHistoricalReports();

  const todayRep = reports2.find(r => r.rawDate === endSum3_2.opDate);
  console.log(`  Dashboard Today Revenue: ₹${dashMetrics2.todayRevenue}`);
  console.log(`  Reports Today Revenue: ₹${todayRep.revenue}`);
  console.log(`  Dashboard Matches Reports: ${dashMetrics2.todayRevenue === todayRep.revenue}`);

  if (dashMetrics1.todayRevenue !== dashMetrics2.todayRevenue || dashMetrics2.todayRevenue !== todayRep.revenue) {
    throw new Error("Dashboard and Reports revenue mismatch or non-idempotent!");
  }
  console.log("✓ TEST 4 PASSED");

  // Cleanup test records
  await supabase.from('walkin_sessions').delete().like('customer_name', 'PhaseTest%');
  await deviceService.toggleStatus('PS5-2', 'AVAILABLE').catch(() => {});

  console.log("\n=================================================");
  console.log("ALL PHASE REQUIREMENTS VERIFIED & PASSED 100%");
  console.log("=================================================");
}

testAllPhaseRequirements();
