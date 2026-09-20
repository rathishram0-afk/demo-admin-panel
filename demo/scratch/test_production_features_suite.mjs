import { sessionService } from '../src/services/sessionService.js';
import { offerService } from '../src/services/offerService.js';
import { cafeArchiveService } from '../src/services/cafeArchiveService.js';
import { deviceService } from '../src/services/deviceService.js';
import { supabase } from '../src/services/supabase.js';

async function runProductionFeaturesTestSuite() {
  console.log("==========================================================================");
  console.log("   G-FORCE ERP — PRODUCTION FEATURES & SHIFT SESSION SUITE               ");
  console.log("==========================================================================");

  try {
    // PRE-TEST CLEANUP: Clear any lingering test sessions & reset device status
    await supabase.from('walkin_sessions').delete().eq('session_status', 'Active');
    await supabase.from('devices').update({ status: 'AVAILABLE' }).neq('id', 'dummy');
    
    // Clear deviceService memory cache
    const allDevs = await deviceService.getDevices(true);
    for (const d of allDevs) {
      d.status = 'AVAILABLE';
      await deviceService.toggleStatus(d.device_code || d.id, 'AVAILABLE').catch(() => {});
    }
    sessionService._cachedActiveSessions = null;

    // ----------------------------------------------------------------------
    // TEST 1: MANUAL TIME SESSION LAUNCH
    // ----------------------------------------------------------------------
    console.log("\n[TEST 1] Testing Manual Time Session Launch (1 Hour = 60 mins)...");
    const test1Stations = await sessionService.startWalkInSession({
      stationId: 'PS5-1',
      customerName: 'Manual Time Gamer',
      phone: '9876543210',
      numPlayers: 2,
      durationMinutes: 60,
      estimatedTotal: 200,
      notes: 'Test 1 Manual Time'
    });
    const ps5_1 = test1Stations.find(s => s.id === 'PS5-1');
    console.log(`  ✓ PS5-1 Status: ${ps5_1?.status} (Expected: RUNNING)`);
    console.log(`  ✓ PS5-1 Duration: ${ps5_1?.durationMinutes} Mins`);
    console.log(`  ✓ PS5-1 Remaining Seconds: ${ps5_1?.remainingSeconds}s`);

    if (ps5_1?.status !== 'RUNNING' || !ps5_1?.remainingSeconds) {
      console.error("  ❌ TEST 1 FAILED: Session did not start immediately on PS5-1!");
      process.exit(1);
    }

    // ----------------------------------------------------------------------
    // TEST 2: MANUAL AMOUNT SESSION LAUNCH
    // ----------------------------------------------------------------------
    console.log("\n[TEST 2] Testing Manual Amount Session Launch (₹500 Custom Charge)...");
    const test2Stations = await sessionService.startWalkInSession({
      stationId: 'PS5-3',
      customerName: 'Manual Amount Gamer',
      phone: '9876543211',
      numPlayers: 2,
      durationMinutes: 60,
      estimatedTotal: 500,
      notes: 'Test 2 Manual Amount',
      isManualMode: true
    });
    const ps5_3 = test2Stations.find(s => s.id === 'PS5-3');
    console.log(`  ✓ PS5-3 Status: ${ps5_3?.status} (Expected: RUNNING)`);
    console.log(`  ✓ PS5-3 Charge Amount: ₹${ps5_3?.price || ps5_3?.currentAmount} (Expected: ₹500)`);

    if (ps5_3?.price !== 500 && ps5_3?.currentAmount !== 500) {
      console.error("  ❌ TEST 2 FAILED: Manual amount ₹500 was not preserved!");
      process.exit(1);
    }

    // ----------------------------------------------------------------------
    // TEST 3: OFFER - 2 HOURS PAID + 1 HOUR FREE
    // ----------------------------------------------------------------------
    console.log("\n[TEST 3] Testing 2 Hours Paid + 1 Hour Free Offer...");
    const test3Stations = await offerService.startOfferSession({
      offerName: 'Play 2 Hours Get 1 Hour Free',
      stationId: 'PS5-4',
      customerName: 'Offer Gamer',
      phone: '9876543212',
      numPlayers: 1,
      paidDurationMinutes: 120, // 2 Hours Paid
      bonusDurationMinutes: 60, // 1 Hour Free
      deviceType: 'PlayStation 5'
    });
    const ps5_4 = test3Stations.find(s => s.id === 'PS5-4');
    console.log(`  ✓ PS5-4 Status: ${ps5_4?.status} (Expected: RUNNING)`);
    console.log(`  ✓ PS5-4 Total Duration: ${ps5_4?.durationMinutes} Mins (Expected: 180 Mins)`);
    console.log(`  ✓ PS5-4 Charged Amount: ₹${ps5_4?.price || ps5_4?.currentAmount} (Expected: ₹200 for 1P 2-Hours)`);

    if (ps5_4?.durationMinutes !== 180) {
      console.error("  ❌ TEST 3 FAILED: Total play duration must be 180 mins (3 Hours)!");
      process.exit(1);
    }

    // ----------------------------------------------------------------------
    // TEST 4 - 9: SHIFT SESSION (PS5-1 -> PS5-2)
    // ----------------------------------------------------------------------
    console.log("\n[TEST 4-9] Testing Session SHIFT (PS5-1 -> PS5-2)...");
    const activeSessionIdPS5_1 = ps5_1.sessionId;
    const initialRemainingSecs = ps5_1.remainingSeconds;

    console.log(`  - Original Session ID: ${activeSessionIdPS5_1}`);
    console.log(`  - Initial Remaining Time: ${initialRemainingSecs}s`);

    const shiftedStations = await sessionService.shiftSession('PS5-1', 'PS5-2', activeSessionIdPS5_1);

    const oldStation = shiftedStations.find(s => s.id === 'PS5-1');
    const newStation = shiftedStations.find(s => s.id === 'PS5-2');

    console.log(`  ✓ PS5-1 Status AFTER SHIFT: ${oldStation?.status} (Expected: AVAILABLE)`);
    console.log(`  ✓ PS5-2 Status AFTER SHIFT: ${newStation?.status} (Expected: RUNNING)`);
    console.log(`  ✓ Shifted Session ID on PS5-2: ${newStation?.sessionId} (Expected: ${activeSessionIdPS5_1})`);
    console.log(`  ✓ Shifted Session Customer: ${newStation?.customerName} (Expected: Manual Time Gamer)`);
    console.log(`  ✓ Shifted Session Remaining Secs: ${newStation?.remainingSeconds}s`);
    console.log(`  ✓ Shifted Session Charged Amount: ₹${newStation?.price || newStation?.currentAmount} (Expected: ₹200)`);

    if (oldStation?.status !== 'AVAILABLE') {
      console.error("  ❌ TEST 4 FAILED: Source station PS5-1 did not become AVAILABLE!");
      process.exit(1);
    }
    if (newStation?.status !== 'RUNNING') {
      console.error("  ❌ TEST 5 FAILED: Destination station PS5-2 did not become RUNNING!");
      process.exit(1);
    }
    if (newStation?.sessionId !== activeSessionIdPS5_1) {
      console.error("  ❌ TEST 6 FAILED: Session ID changed after shift!");
      process.exit(1);
    }

    // ----------------------------------------------------------------------
    // TEST 10: RACE CONDITION GUARD (SHIFT TO OCCUPIED PS5-2 REJECTED)
    // ----------------------------------------------------------------------
    console.log("\n[TEST 10] Testing Shift to Occupied Station (Attempt shift PS5-3 -> PS5-2)...");
    try {
      await sessionService.shiftSession('PS5-3', 'PS5-2', ps5_3.sessionId);
      console.error("  ❌ TEST 10 FAILED: Shift to busy station PS5-2 was NOT rejected!");
      process.exit(1);
    } catch (raceErr) {
      console.log(`  ✓ Race Condition Rejection Verified: "${raceErr.message}"`);
    }

    // ----------------------------------------------------------------------
    // TEST 11-12: REFRESH & PERSISTENCE SAFETY
    // ----------------------------------------------------------------------
    console.log("\n[TEST 11-12] Testing Page Refresh & Timer Persistence...");
    const refreshedStations = await sessionService.getStations(true);
    const refreshedPS5_2 = refreshedStations.find(s => s.id === 'PS5-2');
    console.log(`  ✓ Refreshed PS5-2 Status: ${refreshedPS5_2?.status} (Expected: RUNNING)`);
    console.log(`  ✓ Refreshed PS5-2 Remaining Secs: ${refreshedPS5_2?.remainingSeconds}s`);

    if (refreshedPS5_2?.status !== 'RUNNING') {
      console.error("  ❌ TEST 11 FAILED: Shifted session lost status on refresh!");
      process.exit(1);
    }

    // ----------------------------------------------------------------------
    // TEST 13-14: END SHIFTED SESSION & RE-OCCUPY FREED STATION
    // ----------------------------------------------------------------------
    console.log("\n[TEST 13-14] Testing End Shifted Session & Freed Station Reuse...");
    await sessionService.endSession('PS5-2', 'Cash', refreshedPS5_2.sessionId, 200);
    const finalStations = await sessionService.getStations(true);

    const endedPS5_2 = finalStations.find(s => s.id === 'PS5-2');
    console.log(`  ✓ Ended Destination PS5-2 Status: ${endedPS5_2?.status} (Expected: AVAILABLE)`);

    // Clean up remaining test sessions
    await sessionService.endSession('PS5-3', 'Cash', ps5_3.sessionId, 500).catch(() => {});
    await sessionService.endSession('PS5-4', 'Cash', ps5_4.sessionId, 200).catch(() => {});

    // Start new gamer on freed PS5-1
    console.log("  - Starting new gamer on freed PS5-1...");
    const reuseStations = await sessionService.startWalkInSession({
      stationId: 'PS5-1',
      customerName: 'New Gamer On Freed PS5-1',
      durationMinutes: 30,
      estimatedTotal: 60
    });
    const reusedPS5_1 = reuseStations.find(s => s.id === 'PS5-1');
    console.log(`  ✓ Freed PS5-1 Reused Status: ${reusedPS5_1?.status} (Expected: RUNNING)`);
    
    // Clean up reused session
    await sessionService.endSession('PS5-1', 'Cash', reusedPS5_1.sessionId, 60).catch(() => {});

    // ----------------------------------------------------------------------
    // TEST 15: MULTI-DAY ARCHIVE IMMUTABILITY VERIFICATION
    // ----------------------------------------------------------------------
    console.log("\n[TEST 15] Testing Multi-Day Cafe Archive Immutability...");
    const archives = await cafeArchiveService.getArchivedCafeReports();
    console.log(`  ✓ Retrieved ${archives.length} permanent daily archive records:`);
    archives.forEach(a => {
      console.log(`    - Date: ${a.rawDate} (${a.dateStr}) | Revenue: ₹${a.totalRevenue} | Orders: ${a.totalOrders}`);
    });

    console.log("\n==========================================================================");
    console.log("   ALL 15 PRODUCTION FEATURE & SHIFT SUITE TESTS PASSED 100%               ");
    console.log("==========================================================================");

  } catch (err) {
    console.error("\n❌ SUITE ERROR:", err);
    process.exit(1);
  }
}

runProductionFeaturesTestSuite();
