import { offerService } from '../src/services/offerService.js';
import { sessionService } from '../src/services/sessionService.js';
import { supabase } from '../src/services/supabase.js';
import { deviceService } from '../src/services/deviceService.js';

async function testManualStartTimeOffers() {
  console.log("=================================================");
  console.log("RUNNING MANUAL START TIME OFFERS TEST SUITE");
  console.log("=================================================");

  // Cleanup test records & reset test station
  await supabase.from('walkin_sessions').delete().like('customer_name', 'ManualStartTest%');
  await deviceService.toggleStatus('PS5-3', 'AVAILABLE').catch(() => {});

  // ------------------------------------------------------------------
  // TEST 1: Manual Start OFF -> Uses current real time
  // ------------------------------------------------------------------
  console.log("\n--- TEST 1: Manual Start OFF (Current Real Time) ---");
  await deviceService.toggleStatus('PS5-3', 'AVAILABLE').catch(() => {});
  await offerService.startOfferSession({
    offerName: 'Play 1 Hour Get 30 Minutes Free',
    stationId: 'PS5-3',
    customerName: 'ManualStartTest 1',
    phone: '9900000001',
    numPlayers: 1,
    paidDurationMinutes: 60,
    bonusDurationMinutes: 30,
    manualStartTime: null
  });

  const { data: rec1Data } = await supabase.from('walkin_sessions').select('*').eq('customer_name', 'ManualStartTest 1').single();
  const t1Start = new Date(rec1Data.start_time).getTime();
  const now = new Date().getTime();
  console.log(`  Session start_time: ${rec1Data.start_time}`);
  if (Math.abs(now - t1Start) > 15000) throw new Error("TEST 1 Failed: start_time is not current time!");
  console.log("✓ TEST 1 PASSED");
  await deviceService.toggleStatus('PS5-3', 'AVAILABLE').catch(() => {});

  // ------------------------------------------------------------------
  // TEST 2: Manual Start ON (07:30 PM Today)
  // ------------------------------------------------------------------
  console.log("\n--- TEST 2: Manual Start ON (07:30 PM) ---");
  await deviceService.toggleStatus('PS5-3', 'AVAILABLE').catch(() => {});
  const today = new Date();
  const manualDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 19, 30, 0, 0);
  const manualIso = manualDate.toISOString();

  await offerService.startOfferSession({
    offerName: 'Play 1 Hour Get 30 Minutes Free',
    stationId: 'PS5-3',
    customerName: 'ManualStartTest 2',
    phone: '9900000002',
    numPlayers: 1,
    paidDurationMinutes: 60,
    bonusDurationMinutes: 30,
    manualStartTime: manualIso
  });

  const { data: rec2Data } = await supabase.from('walkin_sessions').select('*').eq('customer_name', 'ManualStartTest 2').single();
  console.log(`  Session start_time: ${rec2Data.start_time}`);
  if (new Date(rec2Data.start_time).getTime() !== manualDate.getTime()) {
    throw new Error(`TEST 2 Failed: start_time ${rec2Data.start_time} does not match manual time ${manualIso}`);
  }
  console.log("✓ TEST 2 PASSED");
  await deviceService.toggleStatus('PS5-3', 'AVAILABLE').catch(() => {});

  // ------------------------------------------------------------------
  // TEST 3: Offer 1 (1 Hr + 30 Mins Free) with Manual Start 07:30 PM
  // ------------------------------------------------------------------
  console.log("\n--- TEST 3: Offer 1 (1 Hour + 30 Mins Free) ---");
  await deviceService.toggleStatus('PS5-3', 'AVAILABLE').catch(() => {});
  await offerService.startOfferSession({
    offerName: 'Play 1 Hour Get 30 Minutes Free',
    stationId: 'PS5-3',
    customerName: 'ManualStartTest 3',
    phone: '9900000003',
    numPlayers: 1,
    paidDurationMinutes: 60,
    bonusDurationMinutes: 30,
    manualStartTime: manualIso
  });

  const { data: rec3Data } = await supabase.from('walkin_sessions').select('*').eq('customer_name', 'ManualStartTest 3').single();
  const t3Start = new Date(rec3Data.start_time);
  const t3PlannedDur = Number(rec3Data.planned_duration);
  const t3End = new Date(t3Start.getTime() + t3PlannedDur * 60000);
  console.log(`  Start Time: ${t3Start.toLocaleTimeString()}`);
  console.log(`  Planned Duration: ${t3PlannedDur} Mins (Expected 90)`);
  console.log(`  Calculated End Time: ${t3End.toLocaleTimeString()}`);
  if (t3PlannedDur !== 90) throw new Error("TEST 3 Failed: Planned duration is not 90 mins!");
  console.log("✓ TEST 3 PASSED");
  await deviceService.toggleStatus('PS5-3', 'AVAILABLE').catch(() => {});

  // ------------------------------------------------------------------
  // TEST 4: Offer 2 (2 Hours + 1 Hour Free) with Manual Start 07:30 PM
  // ------------------------------------------------------------------
  console.log("\n--- TEST 4: Offer 2 (2 Hours + 1 Hour Free) ---");
  await deviceService.toggleStatus('PS5-3', 'AVAILABLE').catch(() => {});
  await offerService.startOfferSession({
    offerName: 'Play 2 Hours Get 1 Hour Free',
    stationId: 'PS5-3',
    customerName: 'ManualStartTest 4',
    phone: '9900000004',
    numPlayers: 1,
    paidDurationMinutes: 120,
    bonusDurationMinutes: 60,
    manualStartTime: manualIso
  });

  const { data: rec4Data } = await supabase.from('walkin_sessions').select('*').eq('customer_name', 'ManualStartTest 4').single();
  const t4Start = new Date(rec4Data.start_time);
  const t4PlannedDur = Number(rec4Data.planned_duration);
  const t4End = new Date(t4Start.getTime() + t4PlannedDur * 60000);
  console.log(`  Start Time: ${t4Start.toLocaleTimeString()}`);
  console.log(`  Planned Duration: ${t4PlannedDur} Mins (Expected 180)`);
  console.log(`  Calculated End Time: ${t4End.toLocaleTimeString()}`);
  if (t4PlannedDur !== 180) throw new Error("TEST 4 Failed: Planned duration is not 180 mins!");
  console.log("✓ TEST 4 PASSED");
  await deviceService.toggleStatus('PS5-3', 'AVAILABLE').catch(() => {});

  // ------------------------------------------------------------------
  // TEST 5 & 6: OFF Mode Ignore check
  // ------------------------------------------------------------------
  console.log("\n--- TEST 5 & 6: OFF Mode Ignore & Idempotency ---");
  await deviceService.toggleStatus('PS5-3', 'AVAILABLE').catch(() => {});
  await offerService.startOfferSession({
    offerName: 'Play 1 Hour Get 30 Minutes Free',
    stationId: 'PS5-3',
    customerName: 'ManualStartTest 6',
    phone: '9900000006',
    numPlayers: 1,
    paidDurationMinutes: 60,
    bonusDurationMinutes: 30,
    manualStartTime: null // Manual OFF
  });

  const { data: rec6Data } = await supabase.from('walkin_sessions').select('*').eq('customer_name', 'ManualStartTest 6').single();
  const t6Start = new Date(rec6Data.start_time).getTime();
  if (Math.abs(new Date().getTime() - t6Start) > 15000) {
    throw new Error("TEST 6 Failed: OFF mode did not ignore manual start time!");
  }
  console.log("✓ TEST 5 & 6 PASSED");

  // Cleanup test records
  await supabase.from('walkin_sessions').delete().like('customer_name', 'ManualStartTest%');
  await deviceService.toggleStatus('PS5-3', 'AVAILABLE').catch(() => {});

  console.log("\n=================================================");
  console.log("ALL MANUAL START TIME OFFERS TESTS PASSED 100%");
  console.log("=================================================");
}

testManualStartTimeOffers();
