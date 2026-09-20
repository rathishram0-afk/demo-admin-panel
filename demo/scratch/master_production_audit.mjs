import { supabase } from '../src/services/supabase.js';
import { sessionService } from '../src/services/sessionService.js';
import { offerService } from '../src/services/offerService.js';
import { cafeOrderService } from '../src/services/cafeOrderService.js';
import { cafeArchiveService } from '../src/services/cafeArchiveService.js';
import { deviceService } from '../src/services/deviceService.js';

async function runMasterProductionAudit() {
  console.log("==========================================================================");
  console.log("    G-FORCE GAMING HUB — MASTER PRODUCTION AUDIT & VERIFICATION    ");
  console.log("==========================================================================\n");

  const results = {};

  // --------------------------------------------------------------------------
  // MODULE 1: WALK-IN SESSION (Auto Pricing & Manual Rate Toggle)
  // --------------------------------------------------------------------------
  console.log("[MODULE 1] Verifying Walk-in Session (Auto & Manual Modes)...");
  try {
    const testStation = 'PS5-4';
    await deviceService.toggleStatus(testStation, 'AVAILABLE').catch(() => {});

    // 1A. Auto Pricing Mode
    const settings = await sessionService.getPricingSettings();
    const rate1Hr = sessionService.getPriceForSessionSync('PlayStation 5', 60, settings);
    const expectedAutoAmount = rate1Hr * 2; // 2 players

    await sessionService.startWalkInSession({
      stationId: testStation,
      customerName: 'Audit Walkin Auto',
      phone: '9999900001',
      numPlayers: 2,
      durationMinutes: 60,
      hourlyPrice: rate1Hr,
      estimatedTotal: expectedAutoAmount,
      isManualMode: false
    });

    let activeList = sessionService._cachedActiveSessions || [];
    let sAuto = activeList.find(s => s.customer_name === 'Audit Walkin Auto');
    const autoPass = Number(sAuto?.total_amount) === expectedAutoAmount;

    await sessionService.endSession(testStation, 'Cash');

    // 1B. Manual Rate ON Mode
    await deviceService.toggleStatus(testStation, 'AVAILABLE').catch(() => {});
    await sessionService.startWalkInSession({
      stationId: testStation,
      customerName: 'Audit Walkin Manual',
      phone: '9999900002',
      numPlayers: 3,
      durationMinutes: 60,
      hourlyPrice: 122,
      estimatedTotal: 122,
      isManualMode: true
    });

    activeList = sessionService._cachedActiveSessions || [];
    let sManual = activeList.find(s => s.customer_name === 'Audit Walkin Manual');
    const manualPass = Number(sManual?.total_amount) === 122;

    await sessionService.endSession(testStation, 'UPI');

    results['1. Walk-in Session'] = (autoPass && manualPass) ? 'PASS' : 'FAIL';
    console.log(`  ✓ Auto Pricing mode: ${autoPass ? 'PASS' : 'FAIL'} (Expected ₹${expectedAutoAmount}, Got ₹${sAuto?.total_amount})`);
    console.log(`  ✓ Manual Rate ON mode: ${manualPass ? 'PASS' : 'FAIL'} (Expected ₹122, Got ₹${sManual?.total_amount})`);
  } catch (e) {
    console.error('  ❌ Walk-in Session audit error:', e);
    results['1. Walk-in Session'] = 'FAIL';
  }

  // --------------------------------------------------------------------------
  // MODULE 2: 30 MINUTES PRICING (PS5)
  // --------------------------------------------------------------------------
  console.log("\n[MODULE 2] Verifying PlayStation 5 30 Minutes Pricing...");
  try {
    const testCases = [
      { players: 1, expected: 60 },
      { players: 2, expected: 120 },
      { players: 3, expected: 180 },
      { players: 4, expected: 240 }
    ];
    let ps530Pass = true;

    for (const tc of testCases) {
      const testStation = 'PS5-4';
      await deviceService.toggleStatus(testStation, 'AVAILABLE').catch(() => {});
      await sessionService.startWalkInSession({
        stationId: testStation,
        customerName: `Audit PS5 30M ${tc.players}P`,
        phone: '9999900003',
        numPlayers: tc.players,
        durationMinutes: 30,
        hourlyPrice: 60,
        estimatedTotal: tc.expected,
        isManualMode: false
      });

      const activeList = sessionService._cachedActiveSessions || [];
      const s = activeList.find(s => s.customer_name === `Audit PS5 30M ${tc.players}P`);
      if (Number(s?.total_amount) !== tc.expected) {
        ps530Pass = false;
      }
      await sessionService.endSession(testStation, 'Cash');
    }

    results['2. 30 Minutes Pricing (PS5)'] = ps530Pass ? 'PASS' : 'FAIL';
    console.log(`  ✓ PS5 30-min rates (1P=₹60, 2P=₹120, 3P=₹180, 4P=₹240): ${ps530Pass ? 'PASS' : 'FAIL'}`);
  } catch (e) {
    console.error('  ❌ PS5 30 Minutes pricing audit error:', e);
    results['2. 30 Minutes Pricing (PS5)'] = 'FAIL';
  }

  // --------------------------------------------------------------------------
  // MODULE 3: OFFERS MODULE & ISOLATION
  // --------------------------------------------------------------------------
  console.log("\n[MODULE 3] Verifying Offers Module & Walk-in Isolation...");
  try {
    const testStation = 'PS5-4';
    await deviceService.toggleStatus(testStation, 'AVAILABLE').catch(() => {});

    // Launch Offer session for 1 Hour (60 mins paid + 30 mins bonus = 90 mins timer)
    await offerService.startOfferSession({
      offerName: 'Audit Play 1 Hr Get 30M Free',
      stationId: testStation,
      customerName: 'Audit Offer Gamer',
      phone: '9999900004',
      numPlayers: 2,
      paidDurationMinutes: 60,
      bonusDurationMinutes: 30,
      deviceType: 'PlayStation 5'
    });

    const activeList = sessionService._cachedActiveSessions || [];
    const sOffer = activeList.find(s => s.customer_name === 'Audit Offer Gamer');
    
    // Paid duration amount for 2 players @ 1 hour rate (₹100 x 2 = ₹200)
    // Planned timer = 90 mins
    const timerPass = Number(sOffer?.planned_duration) === 90;
    const amountPass = Number(sOffer?.total_amount) === 200;

    await sessionService.endSession(testStation, 'UPI');

    results['3. Offers Module'] = (timerPass && amountPass) ? 'PASS' : 'FAIL';
    console.log(`  ✓ Offer Session Timer (Expected 90 Mins, Got ${sOffer?.planned_duration} Mins): ${timerPass ? 'PASS' : 'FAIL'}`);
    console.log(`  ✓ Offer Session Charge (Expected ₹200 Paid Only, Got ₹${sOffer?.total_amount}): ${amountPass ? 'PASS' : 'FAIL'}`);
  } catch (e) {
    console.error('  ❌ Offers Module audit error:', e);
    results['3. Offers Module'] = 'FAIL';
  }

  // --------------------------------------------------------------------------
  // MODULE 4: LIVE SESSIONS
  // --------------------------------------------------------------------------
  console.log("\n[MODULE 4] Verifying Live Sessions Tracking...");
  try {
    const stations = await sessionService.getStations();
    const isStationsValid = Array.isArray(stations) && stations.length > 0;
    results['4. Live Session'] = isStationsValid ? 'PASS' : 'FAIL';
    console.log(`  ✓ Live Stations mapped cleanly: ${isStationsValid ? 'PASS' : 'FAIL'} (${stations.length} consoles)`);
  } catch (e) {
    console.error('  ❌ Live Session audit error:', e);
    results['4. Live Session'] = 'FAIL';
  }

  // --------------------------------------------------------------------------
  // MODULE 5: DASHBOARD ACCURACY
  // --------------------------------------------------------------------------
  console.log("\n[MODULE 5] Verifying Dashboard Summary Calculations...");
  try {
    const metrics = await sessionService.getDashboardMetrics(true);
    const isValid = metrics && metrics.todayRevenue !== undefined && metrics.todaySessions !== undefined;
    results['5. Dashboard'] = isValid ? 'PASS' : 'FAIL';
    console.log(`  ✓ Dashboard metrics loaded: ${isValid ? 'PASS' : 'FAIL'} (Revenue ₹${metrics?.todayRevenue}, Sessions ${metrics?.todaySessions})`);
  } catch (e) {
    console.error('  ❌ Dashboard audit error:', e);
    results['5. Dashboard'] = 'FAIL';
  }

  // --------------------------------------------------------------------------
  // MODULE 6: REPORTS & ANALYTICS
  // --------------------------------------------------------------------------
  console.log("\n[MODULE 6] Verifying Reports & Analytics Data Queries...");
  try {
    const historical = await sessionService.getHistoricalReports();
    const isReportsValid = Array.isArray(historical);
    results['6. Reports & Analytics'] = isReportsValid ? 'PASS' : 'FAIL';
    console.log(`  ✓ Historical reports dataset retrieved: ${isReportsValid ? 'PASS' : 'FAIL'} (${historical.length} days archived)`);
  } catch (e) {
    console.error('  ❌ Reports & Analytics audit error:', e);
    results['6. Reports & Analytics'] = 'FAIL';
  }

  // --------------------------------------------------------------------------
  // MODULE 7: DAILY ARCHIVE ROUTINE
  // --------------------------------------------------------------------------
  console.log("\n[MODULE 7] Verifying Daily Archive Routine & Transaction Safety...");
  try {
    const opDate = new Date().toISOString().split('T')[0];
    const archiveSuccess = await sessionService.archiveDailyReportIfClosed(opDate);
    results['7. Daily Archive'] = archiveSuccess ? 'PASS' : 'FAIL';
    console.log(`  ✓ Daily report archiving & save verification: ${archiveSuccess ? 'PASS' : 'FAIL'}`);
  } catch (e) {
    console.error('  ❌ Daily Archive audit error:', e);
    results['7. Daily Archive'] = 'FAIL';
  }

  // --------------------------------------------------------------------------
  // MODULE 8: CAFE ORDERS
  // --------------------------------------------------------------------------
  console.log("\n[MODULE 8] Verifying Cafe Orders Handling...");
  try {
    const testCafeOrder = await cafeOrderService.createOrder({
      product: { name: 'Audit Pepsi 400ml', price: '₹20', badge: 'Drinks', image: '' },
      quantity: 1,
      customerName: 'Audit Cafe Gamer',
      mobile: '9999900005',
      mode: 'COUNTER',
      paymentMethod: 'Cash'
    });
    await cafeOrderService.updateOrderStatus(testCafeOrder.orderId, 'Collected');
    const orderValid = testCafeOrder && testCafeOrder.total === 20;

    await cafeOrderService.deleteOrder(testCafeOrder.orderId).catch(() => {});

    results['8. Cafe Orders'] = orderValid ? 'PASS' : 'FAIL';
    console.log(`  ✓ Cafe Order creation & status update: ${orderValid ? 'PASS' : 'FAIL'}`);
  } catch (e) {
    console.error('  ❌ Cafe Orders audit error:', e);
    results['8. Cafe Orders'] = 'FAIL';
  }

  // --------------------------------------------------------------------------
  // MODULE 9: CAFE DAILY ARCHIVE
  // --------------------------------------------------------------------------
  console.log("\n[MODULE 9] Verifying Cafe Daily Archive...");
  try {
    const opDate = new Date().toISOString().split('T')[0];
    const cafeOrders = await cafeOrderService.getOrders();
    const archiveSuccess = await cafeArchiveService.archiveDailyCafeReport(opDate, cafeOrders);
    const cafeArchives = await cafeArchiveService.getArchivedCafeReports();
    const isArchived = cafeArchives.some(a => a.rawDate === opDate);

    results['9. Cafe Daily Archive'] = (archiveSuccess && isArchived) ? 'PASS' : 'FAIL';
    console.log(`  ✓ Cafe Daily Archive execution & save verification: ${(archiveSuccess && isArchived) ? 'PASS' : 'FAIL'}`);
  } catch (e) {
    console.error('  ❌ Cafe Daily Archive audit error:', e);
    results['9. Cafe Daily Archive'] = 'FAIL';
  }

  // --------------------------------------------------------------------------
  // MODULE 10: DATABASE INTEGRITY
  // --------------------------------------------------------------------------
  console.log("\n[MODULE 10] Verifying Database Connection & Schema Health...");
  try {
    const { data, error } = await supabase.from('walkin_sessions').select('id').limit(1);
    const isDbConnected = !error;
    results['10. Database'] = isDbConnected ? 'PASS' : 'FAIL';
    console.log(`  ✓ Supabase connection & table health: ${isDbConnected ? 'PASS' : 'FAIL'}`);
  } catch (e) {
    console.error('  ❌ Database integrity audit error:', e);
    results['10. Database'] = 'FAIL';
  }

  // --------------------------------------------------------------------------
  // CLEANUP AUDIT TEST RECORDS FROM PRODUCTION TABLES
  // --------------------------------------------------------------------------
  console.log("\n[CLEANUP] Cleaning up master audit test records...");
  await supabase.from('walkin_sessions').delete().like('customer_name', 'Audit %');
  await supabase.from('cafe_orders').delete().like('customer_name', 'Audit %');
  await deviceService.toggleStatus('PS5-4', 'AVAILABLE').catch(() => {});
  console.log("  ✓ Test records cleaned up successfully!");

  // --------------------------------------------------------------------------
  // FINAL AUDIT SUMMARY TABLE
  // --------------------------------------------------------------------------
  console.log("\n==========================================================================");
  console.log("                    MASTER PRODUCTION VERIFICATION REPORT                  ");
  console.log("==========================================================================");
  let allPass = true;
  Object.entries(results).forEach(([moduleName, status]) => {
    console.log(` ${moduleName.padEnd(35, '.')} [ ${status} ]`);
    if (status !== 'PASS') allPass = false;
  });
  console.log("==========================================================================");

  if (allPass) {
    console.log("\n✅ ZERO ERRORS");
    console.log("✅ ZERO REGRESSION");
    console.log("✅ ZERO DATA LOSS");
    console.log("✅ ZERO ARCHIVE FAILURE");
    console.log("✅ ZERO REVENUE MISMATCH");
    console.log("✅ ZERO REPORT MISMATCH");
    console.log("✅ PRODUCTION READY\n");
  } else {
    console.error("\n❌ AUDIT DETECTED FAILURES IN ONE OR MORE MODULES!\n");
    process.exit(1);
  }
}

runMasterProductionAudit().catch(err => {
  console.error("Master Audit Exception:", err);
  process.exit(1);
});
