import { sessionService } from './src/services/sessionService.js';
import { deviceService } from './src/services/deviceService.js';
import { cafeOrderService } from './src/services/cafeOrderService.js';

function assert(condition, message) {
  if (!condition) {
    throw new Error(`[FAIL] ${message}`);
  }
}

async function runRegressionSuite() {
  console.log("=========================================================");
  console.log("STARTING FINAL PRODUCTION REGRESSION TEST SUITE");
  console.log("=========================================================\n");

  let passedTests = 0;

  // 0. Ensure environment is clean and load initial metrics
  console.log("--> Step 0: Clean up test devices & load dashboard metrics...");
  const dbDevices = await deviceService.getDevices();
  for (const dev of dbDevices) {
    if (dev.device_code === 'PS5-1' || dev.device_code === 'PS4-1' || dev.device_code === 'SIM-1' || dev.device_code === 'PS5-2' || dev.device_code === 'VR-1' || dev.device_code === 'PS5-3') {
      await deviceService.toggleStatus(dev.device_code, 'AVAILABLE');
    }
  }

  // Also clear cached active sessions for test devices
  const initialMetrics = await sessionService.getDashboardMetrics(true);
  if (sessionService._cachedActiveSessions) {
    sessionService._cachedActiveSessions = sessionService._cachedActiveSessions.filter(s => !['PS5-1', 'PS4-1', 'SIM-1', 'PS5-2', 'VR-1', 'PS5-3'].includes(s.device_id));
  }

  const cleanMetrics = await sessionService.getDashboardMetrics(false);
  console.log("Initial Clean Metrics Loaded:", {
    todayRevenue: cleanMetrics.todayRevenue,
    runningSessions: cleanMetrics.runningSessions,
    todaySessions: cleanMetrics.todaySessions,
    controllersInUse: cleanMetrics.controllersInUse
  });
  passedTests++;

  // 1. BUSINESS HOURS & DAILY RESET LOGIC VERIFICATION
  console.log("\n--- TEST 1: Business Hours & Daily Reset Verification ---");
  const now = new Date();
  const testWeekdayOpen = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 0, 0); // 2:00 PM today
  const testAfterClose = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 30, 0); // 11:30 PM today
  const testBeforeOpen = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 30, 0);  // 8:30 AM today
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 15, 0, 0);

  const isTodayValid = sessionService.isWithinCurrentBusinessDay(testWeekdayOpen, testWeekdayOpen);
  assert(isTodayValid === true, "Current business day time (2 PM) must be valid for Today's Revenue.");

  const isAfterCloseValid = sessionService.isWithinCurrentBusinessDay(testWeekdayOpen, testAfterClose);
  assert(isAfterCloseValid === false, "After business closing time (11:30 PM), Today's Revenue must reset to zero automatically.");

  const isBeforeOpenValid = sessionService.isWithinCurrentBusinessDay(testWeekdayOpen, testBeforeOpen);
  assert(isBeforeOpenValid === false, "Before business opening time (8:30 AM), Today's Revenue must reset to zero automatically.");

  const isYesterdayValid = sessionService.isWithinCurrentBusinessDay(yesterday, testWeekdayOpen);
  assert(isYesterdayValid === false, "Yesterday's session timestamp must not be counted in Today's Revenue.");

  console.log("✓ Daily revenue resets correctly according to business hours.");
  passedTests++;

  // 2. TEST SESSION 1: Start -> Cafe Order -> Pause -> Resume -> Extend -> End -> Confirm Payment (Cash)
  console.log("\n--- TEST 2: Walk-In Session 1 (PS5-1, Cash, with Cafe Order & Extend) ---");
  const s1Start = await sessionService.startWalkInSession({
    stationId: 'PS5-1',
    customerName: 'RegTest Player 1',
    phone: '9990000001',
    durationMinutes: 60,
    playerCount: 2,
    mode: 'COUNTER'
  });
  assert(s1Start && s1Start.length > 0, "Walk-in session 1 must start successfully.");

  let metricsAfterStart = await sessionService.getDashboardMetrics(false);
  assert(metricsAfterStart.runningSessions === cleanMetrics.runningSessions + 1, "Dashboard running sessions must increment by 1 immediately.");
  console.log("✓ Dashboard running sessions update immediately.");

  // Add Cafe Order to PS5-1
  const cafeOrder = {
    id: `ord_${Date.now()}`,
    productName: 'Cold Coffee',
    quantity: 2,
    price: 75,
    total: 150
  };
  await sessionService.addSnackOrderToStation('PS5-1', cafeOrder);
  const norm = (str) => String(str || '').toLowerCase().replace(/\s+/g, '');
  const activeS1 = sessionService._cachedActiveSessions.find(s => norm(s.device_id) === norm('PS5-1') || norm(s.device_name) === norm('PS5-1') || norm(s.stationId) === norm('PS5-1'));
  assert(Number(activeS1.food_total) === 150, "Cafe order total (₹150) must be attached to session.");

  // Pause -> Resume -> Extend
  await sessionService.togglePauseSession('PS5-1');
  await sessionService.togglePauseSession('PS5-1');
  await sessionService.extendSession('PS5-1', 30);

  // End -> Confirm Payment (Cash)
  const preEndRevenue = metricsAfterStart.todayRevenue;
  await sessionService.endSession('PS5-1', 'Cash');

  const metricsAfterS1End = await sessionService.getDashboardMetrics(false);
  assert(metricsAfterS1End.todayRevenue > preEndRevenue, "Dashboard revenue must increase immediately after Confirm Payment.");
  assert(metricsAfterS1End.todayRevenue > 0, "Dashboard revenue must NEVER remain 0 after completed paid sessions.");
  assert(metricsAfterS1End.runningSessions === cleanMetrics.runningSessions, "Dashboard running sessions must convert back immediately.");

  const historyAfterS1 = await sessionService.getWalkInHistory(false);
  assert(historyAfterS1.length > 0 && (historyAfterS1[0].stationId === 'PS5-1' || historyAfterS1[0].device === 'PS5-1'), "Completed report record must be generated immediately.");
  console.log("✓ Dashboard revenue increases immediately after Confirm Payment.");
  console.log("✓ Completed reports are immediately generated.");
  console.log("✓ Live session converts back to AVAILABLE immediately.");
  passedTests++;

  // 3. TEST SESSION 2: Start -> Pause -> Resume -> End -> Confirm Payment (UPI)
  console.log("\n--- TEST 3: Walk-In Session 2 (PS4-1, UPI) ---");
  const revBeforeS2 = (await sessionService.getDashboardMetrics(false)).todayRevenue;
  await sessionService.startWalkInSession({
    stationId: 'PS4-1',
    customerName: 'RegTest Player 2',
    phone: '9990000002',
    durationMinutes: 60,
    playerCount: 1,
    mode: 'COUNTER'
  });
  await sessionService.togglePauseSession('PS4-1');
  await sessionService.togglePauseSession('PS4-1');
  await sessionService.endSession('PS4-1', 'UPI');
  const revAfterS2 = (await sessionService.getDashboardMetrics(false)).todayRevenue;
  assert(revAfterS2 > revBeforeS2, "Session 2 UPI payment must increase Today's Revenue immediately.");
  console.log("✓ Walk-In Session 2 completed and verified.");
  passedTests++;

  // 4. TEST SESSION 3: Start -> Extend -> End -> Confirm Payment (Cash)
  console.log("\n--- TEST 4: Walk-In Session 3 (SIM-1, Cash, Extend) ---");
  const revBeforeS3 = (await sessionService.getDashboardMetrics(false)).todayRevenue;
  await sessionService.startWalkInSession({
    stationId: 'SIM-1',
    customerName: 'RegTest Player 3',
    phone: '9990000003',
    durationMinutes: 30,
    playerCount: 1,
    mode: 'COUNTER'
  });
  await sessionService.extendSession('SIM-1', 30);
  await sessionService.endSession('SIM-1', 'Cash');
  const revAfterS3 = (await sessionService.getDashboardMetrics(false)).todayRevenue;
  assert(revAfterS3 > revBeforeS3, "Session 3 Cash payment after extend must increase Today's Revenue immediately.");
  console.log("✓ Walk-In Session 3 completed and verified.");
  passedTests++;

  // 5. TEST SESSION 4: Start -> Cafe Order -> End -> Confirm Payment (UPI)
  console.log("\n--- TEST 5: Walk-In Session 4 (PS5-2, UPI, with Cafe Order) ---");
  const revBeforeS4 = (await sessionService.getDashboardMetrics(false)).todayRevenue;
  await sessionService.startWalkInSession({
    stationId: 'PS5-2',
    customerName: 'RegTest Player 4',
    phone: '9990000004',
    durationMinutes: 60,
    playerCount: 2,
    mode: 'COUNTER'
  });
  await sessionService.addSnackOrderToStation('PS5-2', {
    id: `ord_${Date.now()}_2`,
    productName: 'French Fries',
    quantity: 1,
    price: 120,
    total: 120
  });
  await sessionService.endSession('PS5-2', 'UPI');
  const revAfterS4 = (await sessionService.getDashboardMetrics(false)).todayRevenue;
  assert(revAfterS4 > revBeforeS4, "Session 4 UPI payment with Cafe Order must increase Today's Revenue immediately.");
  console.log("✓ Walk-In Session 4 completed and verified.");
  passedTests++;

  // 6. TEST SESSION 5: Start -> End -> Confirm Payment (Cash)
  console.log("\n--- TEST 6: Walk-In Session 5 (VR-1, Cash) ---");
  const revBeforeS5 = (await sessionService.getDashboardMetrics(false)).todayRevenue;
  await sessionService.startWalkInSession({
    stationId: 'VR-1',
    customerName: 'RegTest Player 5',
    phone: '9990000005',
    durationMinutes: 20,
    playerCount: 1,
    mode: 'COUNTER'
  });
  await sessionService.endSession('VR-1', 'Cash');
  const revAfterS5 = (await sessionService.getDashboardMetrics(false)).todayRevenue;
  assert(revAfterS5 > revBeforeS5, "Session 5 Cash payment must increase Today's Revenue immediately.");
  console.log("✓ Walk-In Session 5 completed and verified.");
  passedTests++;

  // 7. CONTROLLERS IN USE VERIFICATION
  console.log("\n--- TEST 7: Controller Metrics Real-Time Verification ---");
  const ctrlBefore = (await sessionService.getDashboardMetrics(false)).controllersInUse;
  await sessionService.startWalkInSession({
    stationId: 'PS5-3',
    customerName: 'Controller Test Player',
    phone: '9990000006',
    durationMinutes: 60,
    numPlayers: 3,
    mode: 'COUNTER'
  });
  const ctrlDuring = (await sessionService.getDashboardMetrics(false)).controllersInUse;
  assert(ctrlDuring === ctrlBefore + 3, "Controllers in use must increment immediately by player count (3).");
  await sessionService.endSession('PS5-3', 'Cash');
  const ctrlAfter = (await sessionService.getDashboardMetrics(false)).controllersInUse;
  assert(ctrlAfter === ctrlBefore, "Controllers in use must decrement immediately after session ends.");
  console.log("✓ Dashboard controllers in use update immediately.");
  passedTests++;

  console.log("\n=========================================================");
  console.log(`FINAL PRODUCTION TEST SUITE RESULTS: ${passedTests}/${passedTests} SUCCEEDED`);
  console.log("=========================================================");
  console.log("ALL 7 MANDATORY VERIFICATION ITEMS CONFIRMED:");
  console.log("  [✓] Dashboard revenue increases immediately after Confirm Payment");
  console.log("  [✓] Dashboard revenue never remains 0 after completed paid sessions");
  console.log("  [✓] Daily revenue resets correctly according to business hours");
  console.log("  [✓] Dashboard running sessions update immediately");
  console.log("  [✓] Dashboard controllers in use update immediately");
  console.log("  [✓] Completed reports are immediately generated");
  console.log("  [✓] Live session converts back to AVAILABLE immediately");
  console.log("=========================================================");
  process.exit(0);
}

runRegressionSuite().catch(err => {
  console.error("\n[REGRESSION SUITE FAILURE]:", err);
  process.exit(1);
});
