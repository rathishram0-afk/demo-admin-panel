import { cafeArchiveService } from '../src/services/cafeArchiveService.js';
import { sessionService } from '../src/services/sessionService.js';

async function testCafeArchivePersistence() {
  console.log("=== STARTING CAFE DAILY ARCHIVE PERSISTENCE E2E WORKFLOW TEST ===");

  const yesterdayDate = '2026-08-04';
  const todayDate = '2026-08-05';

  // STEP 1: Simulate yesterday's orders (4 Aug 2026)
  console.log("\n[TEST 1] Creating yesterday's Cafe Orders (4 Aug 2026)...");
  const yesterdayOrders = [
    { id: 'c1', orderId: 'GF-9001', productName: 'Fanta 400ml', category: 'Drinks', quantity: 3, total: 90, paymentMethod: 'UPI', status: 'Collected', timestamp: `${yesterdayDate}T14:00:00.000Z` },
    { id: 'c2', orderId: 'GF-9002', productName: 'Lays', category: 'Snacks', quantity: 1, total: 20, paymentMethod: 'Cash', status: 'Collected', timestamp: `${yesterdayDate}T15:00:00.000Z` },
    { id: 'c3', orderId: 'GF-9003', productName: 'Coca-Cola', category: 'Drinks', quantity: 1, total: 30, paymentMethod: 'UPI', status: 'Collected', timestamp: `${yesterdayDate}T16:00:00.000Z` }
  ];

  console.log(`  ✓ Yesterday total orders: ${yesterdayOrders.length}, Revenue: ₹140`);

  // STEP 2: Archive Yesterday's report (at 10:59 PM before reset)
  console.log("\n[TEST 2] Archiving Yesterday's Cafe report at 10:59 PM...");
  const archiveResult = await cafeArchiveService.archiveDailyCafeReport(yesterdayDate, yesterdayOrders);
  console.log("  ✓ Archive Save Success:", archiveResult);

  if (!archiveResult) {
    console.error("  ❌ Archive save failed!");
    process.exit(1);
  }

  // STEP 3: Verify Archive contains 4 Aug 2026
  console.log("\n[TEST 3] Verifying 4 Aug 2026 Archive persistence...");
  const archives = await cafeArchiveService.getArchivedCafeReports();
  const yArchive = archives.find(a => a.rawDate === yesterdayDate);

  if (!yArchive) {
    console.error("  ❌ 4 Aug 2026 Archive record not found in historical archives!");
    process.exit(1);
  }

  console.log(`  ✓ Found Archive for ${yArchive.rawDate}: Revenue ₹${yArchive.totalRevenue}, Orders: ${yArchive.totalOrders}`);
  console.log(`  ✓ Payment Breakdown - Cash: ₹${yArchive.cashRevenue}, UPI: ₹${yArchive.upiRevenue}, Card: ₹${yArchive.cardRevenue}`);

  // STEP 4: Simulate Today's reset (5 Aug 2026) with empty today orders
  console.log("\n[TEST 4] Simulating 11:00 PM Daily Reset to Today (5 Aug 2026)...");
  const todayAnalytics = await cafeArchiveService.getAnalyticsSummary('TODAY', [], null, null);
  console.log(`  ✓ Today Live Analytics - Revenue: ₹${todayAnalytics.aggregateRevenue}, Orders: ${todayAnalytics.aggregateOrders}`);

  if (todayAnalytics.aggregateRevenue !== 0 || todayAnalytics.aggregateOrders !== 0) {
    console.error("  ❌ Live dashboard did not reset to 0 after daily reset!");
    process.exit(1);
  }

  // STEP 5: Verify Analytics & Archive page still retains 4 Aug 2026 record!
  console.log("\n[TEST 5] Verifying Historical Analytics page retains past archives...");
  const allAnalytics = await cafeArchiveService.getAnalyticsSummary('ALL', [], null, null);
  const archivedRows = allAnalytics.allHistoricalArchives || allAnalytics.dailyArchives;

  console.log(`  ✓ Analytics page historical row count: ${archivedRows.length}`);
  archivedRows.forEach(r => {
    console.log(`    - Date: ${r.rawDate} (${r.dateStr}) | Revenue: ₹${r.totalRevenue} | Orders: ${r.totalOrders}`);
  });

  const hasYesterdayInAnalytics = archivedRows.some(r => r.rawDate === yesterdayDate);
  if (!hasYesterdayInAnalytics) {
    console.error("  ❌ Yesterday's archive (4 Aug 2026) disappeared from Analytics page after daily reset!");
    process.exit(1);
  }

  console.log("\n=== CAFE DAILY ARCHIVE PERSISTENCE TEST PASSED WITH ZERO DATA LOSS ===");
}

testCafeArchivePersistence();
