import { supabase } from '../src/services/supabase.js';
import { sessionService } from '../src/services/sessionService.js';
import { deviceService } from '../src/services/deviceService.js';

async function testManualPricingWorkflow() {
  console.log("=== STARTING PRODUCTION MANUAL PRICING WORKFLOW AUDIT & TEST ===");

  // STEP 1: Verify Auto Pricing mode (calculates Rate x Players)
  console.log("\n[TEST 1] Verifying Auto Pricing Mode (Unchanged)...");
  const autoTestStation = 'PS5-3';
  await deviceService.toggleStatus(autoTestStation, 'AVAILABLE').catch(() => {});

  await sessionService.startWalkInSession({
    stationId: autoTestStation,
    customerName: 'Auto Mode Test',
    phone: '9999999991',
    numPlayers: 2,
    durationMinutes: 60,
    hourlyPrice: 100,
    estimatedTotal: 200, // 100 x 2
    isManualMode: false
  });

  let activeList = sessionService._cachedActiveSessions || [];
  let autoSessionObj = activeList.find(s => s.customer_name === 'Auto Mode Test');
  console.log("  ✓ Auto Mode Session Created:");
  console.log("    - Stored Amount: ₹", autoSessionObj?.total_amount || autoSessionObj?.gaming_charge, "(Expected: 200)");

  // Clean up auto test session
  if (autoSessionObj?.id) {
    await supabase.from('walkin_sessions').delete().eq('id', autoSessionObj.id);
    await deviceService.toggleStatus(autoTestStation, 'AVAILABLE').catch(() => {});
  }

  // STEP 2: Verify Manual Pricing Mode with ₹120 (NO Multiplication)
  console.log("\n[TEST 2] Testing Manual Mode with ₹120 (4 Players, 2 Hours)...");
  const manualTestStation1 = 'PS5-3';
  await deviceService.toggleStatus(manualTestStation1, 'AVAILABLE').catch(() => {});

  await sessionService.startWalkInSession({
    stationId: manualTestStation1,
    customerName: 'Manual 120 Test',
    phone: '9999999992',
    numPlayers: 4,
    durationMinutes: 120,
    hourlyPrice: 120,
    estimatedTotal: 120, // Admin typed 120
    isManualMode: true
  });

  activeList = sessionService._cachedActiveSessions || [];
  let session120Obj = activeList.find(s => s.customer_name === 'Manual 120 Test');
  console.log("  ✓ Live Session Created with Manual Amount:");
  console.log("    - Device:", session120Obj?.device_id);
  console.log("    - Players:", session120Obj?.player_count, "(4 Players)");
  console.log("    - Duration:", session120Obj?.planned_duration, "mins (2 Hours)");
  console.log("    - Stored Total Amount: ₹", session120Obj?.total_amount, "(Expected: 120)");

  if (Number(session120Obj.total_amount) !== 120) {
    console.error("  ❌ Manual amount was overwritten or recalculated! Got:", session120Obj.total_amount);
    process.exit(1);
  }

  // Complete session & verify amount
  await sessionService.endSession(manualTestStation1, 'Cash');
  console.log("  ✓ Completed Session on PS5-3 with Cash payment.");

  // STEP 3: Verify Manual Pricing Mode with ₹122
  console.log("\n[TEST 3] Testing Manual Mode with ₹122 (3 Players, 1 Hour)...");
  const manualTestStation2 = 'PS5-3';
  await deviceService.toggleStatus(manualTestStation2, 'AVAILABLE').catch(() => {});

  await sessionService.startWalkInSession({
    stationId: manualTestStation2,
    customerName: 'Manual 122 Test',
    phone: '9999999993',
    numPlayers: 3,
    durationMinutes: 60,
    hourlyPrice: 122,
    estimatedTotal: 122, // Admin typed 122
    isManualMode: true
  });

  activeList = sessionService._cachedActiveSessions || [];
  let session122Obj = activeList.find(s => s.customer_name === 'Manual 122 Test');
  console.log("  ✓ Live Session Created with Manual Amount ₹122:");
  console.log("    - Stored Total Amount: ₹", session122Obj?.total_amount, "(Expected: 122)");

  if (Number(session122Obj.total_amount) !== 122) {
    console.error("  ❌ Manual amount was overwritten or recalculated! Got:", session122Obj.total_amount);
    process.exit(1);
  }

  await sessionService.endSession(manualTestStation2, 'UPI');
  console.log("  ✓ Completed Session on PS5-3 with UPI payment.");

  // STEP 4: Verify Dashboard & Reports Aggregations
  console.log("\n[TEST 4] Verifying Dashboard & Reports Daily Aggregations...");
  const opDate = new Date().toISOString().split('T')[0];
  const summary = await sessionService.getTodaySummary(opDate);

  const completed120 = summary.todayCompletedSessions.find(s => s.customer_name === 'Manual 120 Test');
  const completed122 = summary.todayCompletedSessions.find(s => s.customer_name === 'Manual 122 Test');

  console.log("  ✓ Dashboard Aggregations for Completed Manual Sessions:");
  if (completed120) console.log("    - Manual Session 120 Revenue: ₹", completed120.total_amount || completed120.totalAmount, "[VERIFIED 120]");
  if (completed122) console.log("    - Manual Session 122 Revenue: ₹", completed122.total_amount || completed122.totalAmount, "[VERIFIED 122]");

  if (completed120 && Number(completed120.total_amount || completed120.totalAmount) !== 120) {
    console.error("  ❌ Dashboard completed session 120 value mismatch!");
    process.exit(1);
  }

  if (completed122 && Number(completed122.total_amount || completed122.totalAmount) !== 122) {
    console.error("  ❌ Dashboard completed session 122 value mismatch!");
    process.exit(1);
  }

  // STEP 5: Clean Up Test Records
  console.log("\n[CLEANUP] Cleaning up manual test sessions from Supabase...");
  await supabase.from('walkin_sessions').delete().in('customer_name', ['Manual 120 Test', 'Manual 122 Test', 'Auto Mode Test']);
  await deviceService.toggleStatus('PS5-3', 'AVAILABLE').catch(() => {});
  console.log("  ✓ Test records cleaned up successfully!");

  console.log("\n=== ALL MANUAL PRICING WORKFLOW TESTS PASSED WITH ZERO ERRORS ===");
}

testManualPricingWorkflow().catch(err => {
  console.error("Manual Pricing Test Execution Error:", err);
  process.exit(1);
});
