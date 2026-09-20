import { cafeArchiveService } from '../src/services/cafeArchiveService.js';

async function testAppendOnlyArchiveWorkflow() {
  console.log("=== STARTING APPEND-ONLY CAFE ARCHIVE VERIFICATION TEST ===");

  // Day 1: 05 Aug 2026
  const day1Date = '2026-08-05';
  const day1Orders = [
    { id: 'd1_1', orderId: 'GF-101', productName: 'Fanta 400ml', category: 'Drinks', quantity: 3, total: 90, paymentMethod: 'UPI', status: 'Collected', timestamp: `${day1Date}T14:00:00.000Z` },
    { id: 'd1_2', orderId: 'GF-102', productName: 'Lays', category: 'Snacks', quantity: 1, total: 20, paymentMethod: 'Cash', status: 'Collected', timestamp: `${day1Date}T15:00:00.000Z` },
    { id: 'd1_3', orderId: 'GF-103', productName: 'Coca-Cola', category: 'Drinks', quantity: 1, total: 30, paymentMethod: 'UPI', status: 'Collected', timestamp: `${day1Date}T16:00:00.000Z` }
  ];

  console.log(`\n[DAY 1 - 05 Aug 2026] Archiving Day 1 (Revenue ₹140, Orders 3)...`);
  const res1 = await cafeArchiveService.archiveDailyCafeReport(day1Date, day1Orders);
  console.log("  ✓ Day 1 Archive Result:", res1);

  // Day 2: 06 Aug 2026
  const day2Date = '2026-08-06';
  const day2Orders = [
    { id: 'd2_1', orderId: 'GF-201', productName: 'Monster Energy', category: 'Drinks', quantity: 4, total: 440, paymentMethod: 'UPI', status: 'Collected', timestamp: `${day2Date}T14:00:00.000Z` },
    { id: 'd2_2', orderId: 'GF-202', productName: 'Red Bull', category: 'Drinks', quantity: 1, total: 70, paymentMethod: 'Cash', status: 'Collected', timestamp: `${day2Date}T15:00:00.000Z` }
  ];

  console.log(`\n[DAY 2 - 06 Aug 2026] Archiving Day 2 (Revenue ₹510, Orders 2)...`);
  const res2 = await cafeArchiveService.archiveDailyCafeReport(day2Date, day2Orders);
  console.log("  ✓ Day 2 Archive Result:", res2);

  // Day 3: 07 Aug 2026
  const day3Date = '2026-08-07';
  const day3Orders = [
    { id: 'd3_1', orderId: 'GF-301', productName: 'Cold Coffee', category: 'Drinks', quantity: 5, total: 500, paymentMethod: 'UPI', status: 'Collected', timestamp: `${day3Date}T14:00:00.000Z` }
  ];

  console.log(`\n[DAY 3 - 07 Aug 2026] Archiving Day 3 (Revenue ₹500, Orders 1)...`);
  const res3 = await cafeArchiveService.archiveDailyCafeReport(day3Date, day3Orders);
  console.log("  ✓ Day 3 Archive Result:", res3);

  // VERIFY ALL 3 DAYS SIMULTANEOUSLY EXIST IN HISTORICAL ARCHIVES
  console.log("\n[VERIFICATION] Querying permanent historical archives list...");
  const archives = await cafeArchiveService.getArchivedCafeReports();

  console.log(`  ✓ Total Permanent Historical Rows Saved: ${archives.length}`);
  archives.forEach(a => {
    console.log(`    - Date: ${a.rawDate} (${a.dateStr}) | Revenue: ₹${a.totalRevenue} | Orders: ${a.totalOrders}`);
  });

  const hasDay1 = archives.some(a => a.rawDate === day1Date && a.totalRevenue === 140);
  const hasDay2 = archives.some(a => a.rawDate === day2Date && a.totalRevenue === 510);
  const hasDay3 = archives.some(a => a.rawDate === day3Date && a.totalRevenue === 500);

  if (!hasDay1 || !hasDay2 || !hasDay3) {
    console.error("  ❌ Multi-day archive verification failed! One or more historical days missing!");
    process.exit(1);
  }

  console.log("\n=== APPEND-ONLY CAFE ARCHIVE VERIFICATION PASSED WITH ZERO ERRORS ===");
}

testAppendOnlyArchiveWorkflow();
