import { cafeOrderService } from '../src/services/cafeOrderService.js';
import { sessionService } from '../src/services/sessionService.js';
import { deviceService } from '../src/services/deviceService.js';
import { supabase } from '../src/services/supabase.js';

async function testCafeOrderDeletion() {
  console.log("=================================================");
  console.log("TESTING CAFE ORDER DELETION & LIVE SESSION RECALC");
  console.log("=================================================");

  const todayStr = sessionService.getBusinessDate(new Date());
  console.log(`Current Business Date: ${todayStr}`);

  await deviceService.toggleStatus('PS5-1', 'AVAILABLE').catch(() => {});
  await deviceService.toggleStatus('PS5-2', 'AVAILABLE').catch(() => {});

  const createdSessionIds = [];

  try {
    // ------------------------------------------------------------------
    // TEST 1: PREPAID SESSION (₹100 Prepaid + ₹10 Cafe Order -> Delete ₹10)
    // ------------------------------------------------------------------
    console.log("\n--- TEST 1: PREPAID SESSION DELETION ---");
    
    // 1. Start ₹100 Prepaid Session
    await sessionService.startWalkInSession({
      stationId: 'PS5-1',
      customerName: 'Prepaid Delete Tester',
      phone: '9998887771',
      numPlayers: 1,
      durationMinutes: 60,
      hourlyPrice: 100,
      estimatedTotal: 100,
      originalGamingAmount: 100,
      paymentStatus: 'Prepaid',
      paymentMethod: 'Cash'
    });

    let { data: sess1List } = await supabase.from('walkin_sessions').select('*').eq('customer_name', 'Prepaid Delete Tester');
    if (!sess1List || !sess1List.length) throw new Error("Test 1 session insert failed");
    const sess1 = sess1List[0];
    createdSessionIds.push(sess1.id);
    console.log("✓ Step 1-4: Prepaid PS5 session started (ID:", sess1.id, ")");

    // 2. Initial Dashboard Revenue
    const initialDash = await sessionService.getDashboardMetrics(true);
    console.log(`  Initial Dashboard Revenue: ₹${initialDash.todayRevenue}`);

    // 3. Attach ₹10 Cafe Order
    const ord1 = await cafeOrderService.attachOrderToSession({
      stationId: 'PS5-1',
      sessionId: sess1.session_code || sess1.id,
      productName: 'Pepsi 400ml',
      category: 'Drinks',
      price: 10,
      quantity: 1,
      customerName: 'Prepaid Delete Tester'
    });
    console.log("✓ Step 6: Attached ₹10 Cafe Order (Order ID:", ord1.orderId, ")");

    // 4. Verify Live Session mapped station totals
    let stations = await sessionService.getStations(true);
    let st1 = stations.find(s => s.id === 'PS5-1');
    console.log(`  Step 7: Live Session Cafe Bills = ₹${st1.snackTotal}`);
    console.log(`  Step 8: Live Session Grand Total = ₹${st1.currentAmount}`);
    if (st1.snackTotal !== 10) throw new Error(`Expected snackTotal ₹10, got ₹${st1.snackTotal}`);

    // 5. Delete ₹10 Cafe Order
    console.log("  Step 9: Deleting ₹10 Cafe Order...");
    await cafeOrderService.deleteOrder(ord1.orderId || ord1.id);

    // 6. Verify order is deleted from cafe_orders
    const { data: checkOrd1 } = await supabase.from('cafe_orders').select('*').eq('order_id', ord1.orderId);
    if (checkOrd1 && checkOrd1.length > 0) throw new Error("Order was not deleted from cafe_orders table!");
    console.log("✓ Step 10: Order successfully removed from cafe_orders table");

    // 7. Verify Live Session totals after deletion
    stations = await sessionService.getStations(true);
    st1 = stations.find(s => s.id === 'PS5-1');
    console.log(`✓ Step 11: Live Session Cafe Bills after delete = ₹${st1.snackTotal}`);
    console.log(`✓ Step 12: Live Session Total Amount after delete = ₹${st1.currentAmount}`);
    if (st1.snackTotal !== 0) throw new Error(`Expected snackTotal ₹0, got ₹${st1.snackTotal}`);

    // 8. Verify Dashboard Revenue remains ₹100
    const dashAfterDel = await sessionService.getDashboardMetrics(true);
    console.log(`✓ Step 13: Dashboard Revenue remains ₹${dashAfterDel.todayRevenue}`);
    if (dashAfterDel.todayRevenue !== initialDash.todayRevenue) {
      throw new Error(`Prepaid revenue was modified! Expected ₹${initialDash.todayRevenue}, got ₹${dashAfterDel.todayRevenue}`);
    }
    console.log("--> TEST 1 PASSED 100%");

    // ------------------------------------------------------------------
    // TEST 2: MULTIPLE CAFE ORDERS (₹10 + ₹20 + ₹30 -> Delete ₹20)
    // ------------------------------------------------------------------
    console.log("\n--- TEST 2: MULTIPLE CAFE ORDERS DELETION ---");
    const ordA = await cafeOrderService.attachOrderToSession({
      stationId: 'PS5-1',
      sessionId: sess1.session_code || sess1.id,
      productName: 'Item A',
      price: 10,
      quantity: 1,
      customerName: 'Prepaid Delete Tester'
    });
    const ordB = await cafeOrderService.attachOrderToSession({
      stationId: 'PS5-1',
      sessionId: sess1.session_code || sess1.id,
      productName: 'Item B',
      price: 20,
      quantity: 1,
      customerName: 'Prepaid Delete Tester'
    });
    const ordC = await cafeOrderService.attachOrderToSession({
      stationId: 'PS5-1',
      sessionId: sess1.session_code || sess1.id,
      productName: 'Item C',
      price: 30,
      quantity: 1,
      customerName: 'Prepaid Delete Tester'
    });

    stations = await sessionService.getStations(true);
    st1 = stations.find(s => s.id === 'PS5-1');
    console.log(`  Initial Cafe Bills (10+20+30): ₹${st1.snackTotal}`);
    if (st1.snackTotal !== 60) throw new Error(`Expected ₹60 cafe total, got ₹${st1.snackTotal}`);

    // Delete Order B (₹20)
    console.log("  Deleting Order B (₹20)...");
    await cafeOrderService.deleteOrder(ordB.orderId || ordB.id);

    stations = await sessionService.getStations(true);
    st1 = stations.find(s => s.id === 'PS5-1');
    console.log(`✓ Recalculated Cafe Bills (10+30 remaining): ₹${st1.snackTotal}`);
    if (st1.snackTotal !== 40) throw new Error(`Expected ₹40 cafe total, got ₹${st1.snackTotal}`);
    
    const remNames = (st1.snackOrders || []).map(o => o.productName || o.name);
    console.log(`✓ Remaining Orders: ${remNames.join(', ')}`);
    if (remNames.includes('Item B')) throw new Error("Deleted Item B still in snackOrders!");
    console.log("--> TEST 2 PASSED 100%");

    // Clean up remaining orders for sess1
    await cafeOrderService.deleteOrder(ordA.orderId || ordA.id);
    await cafeOrderService.deleteOrder(ordC.orderId || ordC.id);

    // ------------------------------------------------------------------
    // TEST 3 & 4: PAY AT CHECKOUT SESSION & NO CAFE ORDERS
    // ------------------------------------------------------------------
    console.log("\n--- TEST 3 & 4: PAY AT CHECKOUT SESSION ---");
    await sessionService.startWalkInSession({
      stationId: 'PS5-2',
      customerName: 'Checkout Delete Tester',
      phone: '9998887772',
      numPlayers: 1,
      durationMinutes: 60,
      hourlyPrice: 100,
      estimatedTotal: 100,
      originalGamingAmount: 100,
      paymentStatus: 'Pay at Checkout',
      paymentMethod: 'Cash'
    });

    let { data: sess2List } = await supabase.from('walkin_sessions').select('*').eq('customer_name', 'Checkout Delete Tester');
    if (!sess2List || !sess2List.length) throw new Error("Test 3 session insert failed");
    const sess2 = sess2List[0];
    createdSessionIds.push(sess2.id);

    // Attach ₹10 cafe order
    const ordCheckout = await cafeOrderService.attachOrderToSession({
      stationId: 'PS5-2',
      sessionId: sess2.session_code || sess2.id,
      productName: 'Snack Item',
      price: 10,
      quantity: 1,
      customerName: 'Checkout Delete Tester'
    });

    stations = await sessionService.getStations(true);
    let st2 = stations.find(s => s.id === 'PS5-2');
    console.log(`  Initial Grand Total (100 gaming + 10 cafe): ₹${st2.currentAmount}`);
    if (st2.currentAmount !== 110) throw new Error(`Expected ₹110 grand total, got ₹${st2.currentAmount}`);

    // Delete cafe order
    console.log("  Deleting Cafe Order...");
    await cafeOrderService.deleteOrder(ordCheckout.orderId || ordCheckout.id);

    stations = await sessionService.getStations(true);
    st2 = stations.find(s => s.id === 'PS5-2');
    console.log(`✓ Recalculated Cafe Bills: ₹${st2.snackTotal}`);
    console.log(`✓ Recalculated Grand Total (gaming charge only): ₹${st2.currentAmount}`);
    if (st2.snackTotal !== 0) throw new Error(`Expected ₹0 cafe total, got ₹${st2.snackTotal}`);
    if (st2.currentAmount !== 100) throw new Error(`Expected ₹100 grand total, got ₹${st2.currentAmount}`);

    console.log("--> TEST 3 & 4 PASSED 100%");

    console.log("\n=================================================");
    console.log("ALL CAFE ORDER DELETION TESTS PASSED 100%");
    console.log("=================================================");

  } catch (err) {
    console.error("Test execution failed:", err);
  } finally {
    if (createdSessionIds.length > 0) {
      await supabase.from('walkin_sessions').delete().in('id', createdSessionIds);
      console.log(`\nCleaned up ${createdSessionIds.length} test records from database.`);
    }
    await deviceService.toggleStatus('PS5-1', 'AVAILABLE').catch(() => {});
    await deviceService.toggleStatus('PS5-2', 'AVAILABLE').catch(() => {});
  }
}

testCafeOrderDeletion();
