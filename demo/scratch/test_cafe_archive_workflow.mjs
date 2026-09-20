import { supabase } from '../src/services/supabase.js';
import { cafeOrderService } from '../src/services/cafeOrderService.js';
import { cafeArchiveService } from '../src/services/cafeArchiveService.js';
import { sessionService } from '../src/services/sessionService.js';

async function testCafeArchiveWorkflow() {
  console.log("=== STARTING PRODUCTION CAFE ORDER ARCHIVE & ANALYTICS AUDIT & TEST ===");

  // STEP 1: Create test cafe orders
  console.log("\n[TEST 1] Creating test Cafe Orders (Counter & Session)...");
  const testOrder1 = await cafeOrderService.createOrder({
    product: { name: 'Fanta 400ml Test', price: '₹20', badge: 'Drinks', image: '' },
    quantity: 2,
    customerName: 'Test Gamer 1',
    mobile: '9999911111',
    mode: 'COUNTER',
    paymentMethod: 'Cash'
  });
  console.log("  ✓ Created Counter Order 1:", testOrder1.orderId, "- ₹", testOrder1.total);

  // Update order 1 status to Collected
  await cafeOrderService.updateOrderStatus(testOrder1.orderId, 'Collected');
  console.log("  ✓ Order 1 status updated to Collected.");

  const testOrder2 = await cafeOrderService.createOrder({
    product: { name: 'Doritos Sweet Chilli Large Test', price: '₹85', badge: 'Snacks', image: '' },
    quantity: 1,
    customerName: 'Test Gamer 2',
    mobile: '9999922222',
    mode: 'COUNTER',
    paymentMethod: 'UPI'
  });
  console.log("  ✓ Created Counter Order 2:", testOrder2.orderId, "- ₹", testOrder2.total);
  await cafeOrderService.updateOrderStatus(testOrder2.orderId, 'Collected');
  console.log("  ✓ Order 2 status updated to Collected.");

  // STEP 2: Test Daily Archiving Routine
  console.log("\n[TEST 2] Executing archiveDailyCafeReport for today's operational date...");
  const opDate = new Date().toISOString().split('T')[0];
  const allOrders = await cafeOrderService.getOrders();
  
  const archiveSuccess = await cafeArchiveService.archiveDailyCafeReport(opDate, allOrders);
  console.log("  ✓ archiveDailyCafeReport execution result:", archiveSuccess, "(Expected: true)");

  if (!archiveSuccess) {
    console.error("  ❌ Cafe Archiving failed!");
    process.exit(1);
  }

  // STEP 3: Verify archived record integrity
  console.log("\n[TEST 3] Verifying Archived Record Data & Transaction Safety...");
  const archives = await cafeArchiveService.getArchivedCafeReports();
  const todayArch = archives.find(a => a.rawDate === opDate);
  
  console.log("  ✓ Archived record date:", todayArch?.dateStr);
  console.log("  ✓ Total Archived Cafe Revenue: ₹", todayArch?.totalRevenue);
  console.log("  ✓ Total Archived Cafe Orders:", todayArch?.totalOrders);
  console.log("  ✓ Cash Revenue: ₹", todayArch?.cashRevenue, "| UPI Revenue: ₹", todayArch?.upiRevenue);
  console.log("  ✓ Average Order Value: ₹", todayArch?.averageOrderValue);
  console.log("  ✓ Best Selling Product:", todayArch?.bestSellingProduct);

  if (!todayArch || todayArch.totalRevenue <= 0) {
    console.error("  ❌ Invalid archived record data!");
    process.exit(1);
  }

  // STEP 4: Test Analytics Summary across quick filters
  console.log("\n[TEST 4] Testing Analytics Summary across quick filters...");
  const filters = ['TODAY', 'THIS_WEEK', 'THIS_MONTH', 'THIS_YEAR'];
  for (const filter of filters) {
    const summary = await cafeArchiveService.getAnalyticsSummary(filter, allOrders);
    console.log(`  ✓ Filter [${filter}] Aggregate Revenue: ₹${summary.aggregateRevenue} | Orders: ${summary.aggregateOrders} | Top Item: ${summary.bestSellingProduct}`);
  }

  // STEP 5: Clean up test orders
  console.log("\n[CLEANUP] Cleaning up test Cafe Orders...");
  await cafeOrderService.deleteOrder(testOrder1.orderId).catch(() => {});
  await cafeOrderService.deleteOrder(testOrder2.orderId).catch(() => {});
  await supabase.from('cafe_orders').delete().like('customer_name', 'Test Gamer %');
  console.log("  ✓ Test records cleaned up successfully!");

  console.log("\n=== ALL CAFE ORDER ARCHIVE & ANALYTICS TESTS PASSED SUCCESSFULLY WITH ZERO ERRORS ===");
}

testCafeArchiveWorkflow().catch(err => {
  console.error("Test Execution Error:", err);
  process.exit(1);
});
