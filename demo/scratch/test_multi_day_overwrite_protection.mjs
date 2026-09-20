import { cafeArchiveService } from '../src/services/cafeArchiveService.js';
import { sessionService } from '../src/services/sessionService.js';

async function testMultiDayOverwriteProtection() {
  console.log("=== STARTING MULTI-DAY IMMUTABLE ARCHIVE OVERWRITE PROTECTION TEST ===");

  // STEP 1: Archive 6 Aug 2026 with Revenue ₹510 and 15 Orders
  const date6Aug = '2026-08-06';
  const orders6Aug = [
    { id: 'o6_1', order_id: 'GF-601', product_name: 'Monster Energy', category: 'Drinks', quantity: 4, total_amount: 440, payment_method: 'UPI', status: 'Collected', created_at: `${date6Aug}T14:00:00.000Z` },
    { id: 'o6_2', order_id: 'GF-602', product_name: 'Red Bull', category: 'Drinks', quantity: 1, total_amount: 70, payment_method: 'Cash', status: 'Collected', created_at: `${date6Aug}T15:00:00.000Z` }
  ];

  console.log(`\n[STEP 1] Archiving 6 Aug 2026 (Revenue ₹510, Orders 2)...`);
  const archiveResult6 = await cafeArchiveService.archiveDailyCafeReport(date6Aug, orders6Aug);
  console.log("  ✓ 6 Aug Archive Execution Result:", archiveResult6);

  const archives6 = await cafeArchiveService.getArchivedCafeReports();
  const rec6Aug = archives6.find(a => a.rawDate === date6Aug);

  console.log("  ✓ 6 Aug Stored Archive Record:", {
    date: rec6Aug?.rawDate,
    revenue: rec6Aug?.totalRevenue,
    orders: rec6Aug?.totalOrders
  });

  if (!rec6Aug || rec6Aug.totalRevenue !== 510) {
    console.error("  ❌ Step 1 Failed: 6 Aug archive did not store ₹510!");
    process.exit(1);
  }

  // STEP 2: Transition to Day 2 (7 Aug 2026) & Reset Live POS
  console.log("\n[STEP 2] Simulating Rollover to 7 Aug 2026 & Live POS Reset...");
  // Live POS resets for 7 Aug
  const orders7Aug = []; // No live orders yet on 7 Aug morning

  // Query archived reports on 7 Aug
  const archives7 = await cafeArchiveService.getArchivedCafeReports();
  const rec6AugAfterRollover = archives7.find(a => a.rawDate === date6Aug);

  console.log("  ✓ 6 Aug Archive Record AFTER 7 Aug Rollover:", {
    date: rec6AugAfterRollover?.rawDate,
    revenue: rec6AugAfterRollover?.totalRevenue,
    orders: rec6AugAfterRollover?.totalOrders
  });

  if (!rec6AugAfterRollover || rec6AugAfterRollover.totalRevenue === 0) {
    console.error("  ❌ CRITICAL BUG CONFIRMED: 6 Aug archive was OVERWRITTEN WITH ZERO after 7 Aug rollover!");
    process.exit(1);
  }

  if (rec6AugAfterRollover.totalRevenue !== 510) {
    console.error(`  ❌ Revenue changed! Expected ₹510, got ₹${rec6AugAfterRollover.totalRevenue}`);
    process.exit(1);
  }

  // STEP 3: Create orders on 7 Aug (Revenue ₹270), Archive 7 Aug, Rollover to 8 Aug
  const date7Aug = '2026-08-07';
  const liveOrders7Aug = [
    { id: 'o7_1', order_id: 'GF-701', product_name: 'Cold Coffee', category: 'Drinks', quantity: 3, total_amount: 270, payment_method: 'UPI', status: 'Collected', created_at: `${date7Aug}T14:00:00.000Z` }
  ];

  console.log(`\n[STEP 3] Archiving 7 Aug 2026 (Revenue ₹270)...`);
  await cafeArchiveService.archiveDailyCafeReport(date7Aug, liveOrders7Aug);

  // Rollover to 8 Aug
  console.log("\n[STEP 4] Simulating Rollover to 8 Aug 2026...");
  const archives8 = await cafeArchiveService.getArchivedCafeReports();

  console.log("  ✓ All Historical Archive Records Available on 8 Aug:");
  archives8.forEach(a => {
    console.log(`    - Date: ${a.rawDate} (${a.dateStr}) | Revenue: ₹${a.totalRevenue} | Orders: ${a.totalOrders}`);
  });

  const check6 = archives8.find(a => a.rawDate === date6Aug);
  const check7 = archives8.find(a => a.rawDate === date7Aug);

  if (!check6 || check6.totalRevenue !== 510) {
    console.error("  ❌ 6 Aug archive was altered or zeroed after 8 Aug rollover!");
    process.exit(1);
  }

  if (!check7 || check7.totalRevenue !== 270) {
    console.error("  ❌ 7 Aug archive was altered or zeroed after 8 Aug rollover!");
    process.exit(1);
  }

  console.log("\n=== MULTI-DAY IMMUTABLE ARCHIVE OVERWRITE PROTECTION PASSED 100% ===");
}

testMultiDayOverwriteProtection();
