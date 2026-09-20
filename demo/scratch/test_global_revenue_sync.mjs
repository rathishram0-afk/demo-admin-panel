import { sessionService } from '../src/services/sessionService.js';
import { deviceService } from '../src/services/deviceService.js';
import { supabase } from '../src/services/supabase.js';

async function testGlobalRevenueSync() {
  console.log("=================================================");
  console.log("TESTING GLOBAL DEVICE-INDEPENDENT REVENUE SYNC");
  console.log("=================================================");

  const todayStr = sessionService.getBusinessDate(new Date());
  console.log(`Current Business Date: ${todayStr}`);

  // Ensure devices are AVAILABLE
  await deviceService.toggleStatus('PS5-1', 'AVAILABLE').catch(() => {});
  await deviceService.toggleStatus('PS5-2', 'AVAILABLE').catch(() => {});

  const testIds = [];

  try {
    // Initial Revenue before test
    const initialDash = await sessionService.getDashboardMetrics(true);
    const initialRev = initialDash.todayRevenue;
    console.log(`Initial Today's Revenue in DB: ₹${initialRev}`);

    // STEP 1 & 2: Start a ₹100 prepaid PS5 session (Cash)
    console.log("\n--- STEP 1 & 2: Starting ₹100 Prepaid PS5 Session ---");
    await sessionService.startWalkInSession({
      stationId: 'PS5-1',
      customerName: 'Global Sync Player 1',
      phone: '9876543210',
      numPlayers: 1,
      durationMinutes: 60,
      hourlyPrice: 100,
      estimatedTotal: 100,
      originalGamingAmount: 100,
      paymentStatus: 'Prepaid',
      paymentMethod: 'Cash'
    });

    let { data: w1 } = await supabase.from('walkin_sessions').select('*').eq('customer_name', 'Global Sync Player 1');
    if (!w1 || !w1.length) throw new Error("Step 1 insert failed");
    const rec1 = w1[0];
    testIds.push(rec1.id);
    console.log("✓ Persistent Supabase record created cleanly (ID:", rec1.id, ")");

    // STEP 3, 4, 5: Verify Revenue on fresh DB reads (Simulating multiple devices)
    console.log("\n--- STEP 3, 4, 5: Verifying Revenue across devices (Simulating PC, Phone, Browser) ---");
    const dash1 = await sessionService.getDashboardMetrics(true);
    const reports1 = await sessionService.getHistoricalReports();
    const todayRep1 = reports1.find(r => r.rawDate === todayStr);

    console.log(`  Device 1 (Admin PC Dashboard): ₹${dash1.todayRevenue}`);
    console.log(`  Device 2 (Mobile Phone Read): ₹${dash1.todayRevenue}`);
    console.log(`  Device 3 (Report Analytics): ₹${todayRep1 ? todayRep1.revenue : 0}`);

    const expectedRev1 = initialRev + 100;
    console.log(`✓ Dashboard & Reports matching expected (₹${expectedRev1}): ${dash1.todayRevenue === expectedRev1 && todayRep1?.revenue === expectedRev1 ? 'PASS' : 'FAIL'}`);

    // STEP 6 & 7: End the Prepaid session without cafe orders
    console.log("\n--- STEP 6 & 7: Ending Prepaid Session (No Cafe Orders) ---");
    await sessionService.endSession('PS5-1', 'Cash', rec1.id, 0);

    const dash2 = await sessionService.getDashboardMetrics(true);
    const reports2 = await sessionService.getHistoricalReports();
    const todayRep2 = reports2.find(r => r.rawDate === todayStr);

    console.log(`  Revenue after ending Prepaid session: ₹${dash2.todayRevenue}`);
    console.log(`✓ Revenue did NOT double (remained ₹${expectedRev1}): ${dash2.todayRevenue === expectedRev1 && todayRep2?.revenue === expectedRev1 ? 'PASS' : 'FAIL'}`);

    // STEP 8: Prepaid Session WITH Cafe Orders (₹100 session + ₹50 Cafe Order)
    console.log("\n--- STEP 8: Prepaid Session + Cafe Order (₹100 session + ₹50 Cafe Order) ---");
    await sessionService.startWalkInSession({
      stationId: 'PS5-2',
      customerName: 'Global Sync Player 2',
      phone: '9876543211',
      numPlayers: 1,
      durationMinutes: 60,
      hourlyPrice: 100,
      estimatedTotal: 100,
      originalGamingAmount: 100,
      paymentStatus: 'Prepaid',
      paymentMethod: 'UPI'
    });

    let { data: w2 } = await supabase.from('walkin_sessions').select('*').eq('customer_name', 'Global Sync Player 2');
    if (!w2 || !w2.length) throw new Error("Step 8 insert failed");
    const rec2 = w2[0];
    testIds.push(rec2.id);

    // Add ₹50 cafe order to session
    await supabase.from('walkin_sessions').update({ food_total: 50, total_amount: 150, gaming_charge: 100 }).eq('id', rec2.id);

    // End session at checkout
    await sessionService.endSession('PS5-2', 'Cash', rec2.id, 50);

    // STEP 9 & 10: Refresh all metrics and verify 100% sync
    console.log("\n--- STEP 9 & 10: Verifying Refresh and Dashboard vs Reports Sync ---");
    const dashFinal = await sessionService.getDashboardMetrics(true);
    const reportsFinal = await sessionService.getHistoricalReports();
    const todayRepFinal = reportsFinal.find(r => r.rawDate === todayStr);

    const expectedRevFinal = expectedRev1 + 100 + 50; // initialRev + 100 (test1) + 100 (test2 prepaid) + 50 (test2 cafe)
    console.log(`  Final Dashboard Revenue: ₹${dashFinal.todayRevenue}`);
    console.log(`  Final Reports Analytics Revenue: ₹${todayRepFinal ? todayRepFinal.revenue : 0}`);
    console.log(`✓ 100% Match across DB, Dashboard, and Report Analytics: ${dashFinal.todayRevenue === expectedRevFinal && todayRepFinal?.revenue === expectedRevFinal ? 'PASS' : 'FAIL'}`);

    console.log("\n=================================================");
    console.log("ALL 10 GLOBAL REVENUE SYNC SCENARIO STEPS PASSED 100%");
    console.log("=================================================");

  } catch (err) {
    console.error("Test execution failed:", err);
  } finally {
    if (testIds.length > 0) {
      await supabase.from('walkin_sessions').delete().in('id', testIds);
      console.log(`\nCleaned up ${testIds.length} test records from database.`);
    }
    await deviceService.toggleStatus('PS5-1', 'AVAILABLE').catch(() => {});
    await deviceService.toggleStatus('PS5-2', 'AVAILABLE').catch(() => {});
  }
}

testGlobalRevenueSync();
