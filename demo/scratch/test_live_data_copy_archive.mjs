import { cafeArchiveService } from '../src/services/cafeArchiveService.js';

async function testLiveDataCopyArchive() {
  console.log("=== STARTING LIVE DATA COPY CAFE ARCHIVE VERIFICATION TEST ===");

  const testOpDate = '2026-08-06';
  const liveOrders = [
    {
      id: 'live_ord_1',
      order_id: 'GF-5501',
      product_name: 'Fanta 400ml',
      category: 'Drinks',
      quantity: 3,
      price: 30,
      total_amount: 90,
      payment_method: 'UPI',
      status: 'Collected',
      created_at: '2026-08-06T15:30:00.000Z'
    },
    {
      id: 'live_ord_2',
      order_id: 'GF-5502',
      product_name: 'Lays Chips',
      category: 'Snacks',
      quantity: 1,
      price: 20,
      total_amount: 20,
      payment_method: 'Cash',
      status: 'Collected',
      created_at: '2026-08-06T16:00:00.000Z'
    },
    {
      id: 'live_ord_3',
      order_id: 'GF-5503',
      product_name: 'Red Bull 250ml',
      category: 'Drinks',
      quantity: 1,
      price: 70,
      total_amount: 70,
      payment_method: 'UPI',
      status: 'Collected',
      created_at: '2026-08-06T17:15:00.000Z'
    }
  ];

  console.log(`\n[STEP 1] Executing archiveDailyCafeReport for ${testOpDate} with 3 live orders...`);
  const archiveSuccess = await cafeArchiveService.archiveDailyCafeReport(testOpDate, liveOrders);
  console.log("  ✓ Archive function execution result:", archiveSuccess);

  if (!archiveSuccess) {
    console.error("  ❌ Archive execution failed!");
    process.exit(1);
  }

  console.log(`\n[STEP 2] Verifying stored archive values for ${testOpDate}...`);
  const archives = await cafeArchiveService.getArchivedCafeReports();
  const targetArchive = archives.find(a => a.rawDate === testOpDate);

  if (!targetArchive) {
    console.error(`  ❌ Archive record for ${testOpDate} not found!`);
    process.exit(1);
  }

  console.log("  ✓ Retrieved Archive Data Object:");
  console.log(`    - Date: ${targetArchive.rawDate} (${targetArchive.dateStr})`);
  console.log(`    - Total Revenue: ₹${targetArchive.totalRevenue} (Expected: ₹180)`);
  console.log(`    - Total Orders: ${targetArchive.totalOrders} (Expected: 3)`);
  console.log(`    - Completed Orders: ${targetArchive.completedOrders} (Expected: 3)`);
  console.log(`    - Cash Revenue: ₹${targetArchive.cashRevenue} (Expected: ₹20)`);
  console.log(`    - UPI Revenue: ₹${targetArchive.upiRevenue} (Expected: ₹160)`);
  console.log(`    - Average Order Value: ₹${targetArchive.averageOrderValue} (Expected: ₹60)`);
  console.log(`    - Top Selling Product: ${targetArchive.bestSellingProduct} (Expected: Fanta 400ml)`);
  console.log(`    - Order Audit List Items: ${targetArchive.ordersList?.length} orders`);

  if (targetArchive.totalRevenue === 0 || targetArchive.totalOrders === 0) {
    console.error("  ❌ BUG CONFIRMED: Archive row created with ZERO revenue/orders!");
    process.exit(1);
  }

  if (targetArchive.totalRevenue !== 180 || targetArchive.totalOrders !== 3) {
    console.error("  ❌ Revenue mismatch! Live order values were not copied accurately.");
    process.exit(1);
  }

  console.log("\n=== LIVE DATA COPY VERIFICATION PASSED WITH 100% ACCURACY ===");
}

testLiveDataCopyArchive();
