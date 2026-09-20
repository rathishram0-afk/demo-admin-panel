import { sessionService } from '../src/services/sessionService.js';

// Polyfill localStorage for Node test environment
const storage = new Map();
global.localStorage = {
  getItem: (key) => storage.get(key) || null,
  setItem: (key, val) => storage.set(key, String(val)),
  removeItem: (key) => storage.delete(key),
  clear: () => storage.clear()
};

async function runRegressionSuite() {
  console.log('==============================================');
  console.log('   G-FORCE GAMING HUB - REGRESSION SUITE      ');
  console.log('==============================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  // 1. Test Pricing Engine (Synchronous & Async)
  console.log('--- 1. Testing Pricing Engine ---');
  const p1 = sessionService.getPriceForSessionSync('PlayStation 5', 60);
  assert(p1 === 100, 'PS5 60 min default rate is 100');

  const p2 = sessionService.getPriceForSessionSync('PlayStation 4', 60);
  assert(p2 === 80 || p2 === 90, 'PS4 60 min rate resolves correctly based on weekday/weekend');

  const p3 = await sessionService.getPriceForSession('PlayStation 5', 120);
  assert(p3.pricePerPlayer > 0 && typeof p3.isWeekend === 'boolean', 'Async getPriceForSession returns structure with pricePerPlayer & isWeekend');

  // 2. Test Controller Metrics Mapping
  console.log('\n--- 2. Testing Controller Metrics Mapping ---');
  const mockStations = [
    { id: 'PS5-01', category: 'PlayStation 5', status: 'RUNNING', controllersUsed: 2 },
    { id: 'PS5-02', category: 'PlayStation 5', status: 'AVAILABLE', controllersUsed: 0 },
    { id: 'PS4-01', category: 'PlayStation 4', status: 'ACTIVE', controllersUsed: 4 },
    { id: 'SIM-01', category: 'Racing Simulator', status: 'RUNNING', controllersUsed: 1 } // Non-PlayStation, should not count towards PlayStation controllers
  ];

  const metrics = sessionService.mapControllerMetrics(mockStations);
  assert(metrics.totalControllers === 20, 'Default total controllers is 20');
  assert(metrics.controllersInUse === 6, `Controllers in use for PlayStation stations is 6 (got ${metrics.controllersInUse})`);
  assert(metrics.availableControllers === 14, `Available controllers is 14 (got ${metrics.availableControllers})`);
  assert(metrics.usableControllers === 20, 'Usable controllers calculation is correct');

  // 3. Test mapStations lifecycle mapping
  console.log('\n--- 3. Testing Station Mapping ---');
  const mockDevices = [
    { id: 'dev-1', device_code: 'PS5-01', device_name: 'PS5 Station 1', category: 'PlayStation 5', status: 'AVAILABLE' }
  ];
  const mockSessions = [
    { id: 'ses-101', session_code: 'SES-101', device_id: 'PS5-01', customer_name: 'John Doe', player_count: 2, planned_duration: 60, start_time: new Date(Date.now() - 30 * 60000).toISOString(), session_status: 'Active' }
  ];

  const mapped = sessionService.mapStations(mockDevices, mockSessions);
  assert(mapped.length === 1, 'Mapped stations array has length 1');
  assert(mapped[0].status === 'RUNNING', 'Station with active session has RUNNING status');
  assert(mapped[0].customerName === 'John Doe', 'Customer name is mapped correctly');
  assert(mapped[0].remainingSeconds > 0, 'Remaining seconds calculated correctly');

  // 4. Test Live Supabase Connectivity & Table Integrity
  console.log('\n--- 4. Testing Live Supabase Database Connectivity ---');
  const liveStations = await sessionService.getStations();
  assert(Array.isArray(liveStations), `sessionService.getStations() returns array from live DB (got ${liveStations.length} devices)`);
  
  if (liveStations.length > 0) {
    const s = liveStations[0];
    assert(typeof s.id === 'string' && typeof s.zone === 'string', 'Live station has valid id and zone properties');
    assert(['AVAILABLE', 'RUNNING', 'BUSY', 'MAINTENANCE', 'RESERVED'].includes(s.status), `Live station status (${s.status}) is a valid ERP status`);
  }

  // 5. Test Walk-in History & Order Integration
  console.log('\n--- 5. Testing Walk-in History & Cafe Orders DB ---');
  const history = await sessionService.getWalkInHistory();
  assert(Array.isArray(history), `getWalkInHistory() returns array (got ${history.length} sessions)`);

  const notifs = await sessionService.getNotifications();
  assert(Array.isArray(notifs), `getNotifications() returns array (got ${notifs.length} notifications)`);

  console.log('\n==============================================');
  console.log(`Summary: ${passed} PASSED, ${failed} FAILED`);
  console.log('==============================================');

  if (failed > 0) process.exit(1);
}

runRegressionSuite().catch(err => {
  console.error('Fatal regression suite error:', err);
  process.exit(1);
});
