import { sessionService } from '../src/services/sessionService.js';
import { offerService } from '../src/services/offerService.js';
import { cafeOrderService } from '../src/services/cafeOrderService.js';
import { deviceService } from '../src/services/deviceService.js';
import { supabase } from '../src/services/supabase.js';

async function testUserRequirements20() {
  console.log("=================================================");
  console.log("TESTING ALL SECTION 20 EDGE CASE TEST SCENARIOS");
  console.log("=================================================");

  await supabase.from('walkin_sessions').delete().in('device_id', ['PS5-1', 'PS5-2']);
  await deviceService.toggleStatus('PS5-1', 'AVAILABLE').catch(() => {});
  await deviceService.toggleStatus('PS5-2', 'AVAILABLE').catch(() => {});

  const createdSessionIds = [];

  try {
    // ------------------------------------------------------------------
    // TEST 1: Walk-In, Players = 1, Duration = 1 Hour, Payment = Paid Checkout, Gaming = ₹100, Cafe = ₹0
    // Expected: Checkout = ₹100 due
    // ------------------------------------------------------------------
    console.log("\n--- TEST 1: Paid Checkout Walk-in (Gaming ₹100, Cafe ₹0) ---");
    await sessionService.startWalkInSession({
      stationId: 'PS5-1',
      customerName: 'Sec20 Tester 1',
      phone: '9900000001',
      numPlayers: 1,
      durationMinutes: 60,
      hourlyPrice: 100,
      estimatedTotal: 100,
      originalGamingAmount: 100,
      paymentStatus: 'Pay at Checkout',
      paymentMethod: 'Cash'
    });

    let { data: s1List } = await supabase.from('walkin_sessions').select('*').eq('customer_name', 'Sec20 Tester 1').order('created_at', { ascending: false });
    if (!s1List || !s1List.length) throw new Error("Test 1 session creation failed");
    const s1 = s1List[0];
    createdSessionIds.push(s1.id);

    const st1 = (await sessionService.getStations(true)).find(s => s.id === 'PS5-1');
    console.log(`  Station 1 Payment Status: ${st1.paymentStatus}, Gaming: ₹${st1.price}, Grand Total: ₹${st1.currentAmount}`);
    if (st1.paymentStatus !== 'PAY_AT_CHECKOUT' && st1.paymentStatus !== 'Pay at Checkout') {
      throw new Error(`Expected Paid Checkout status, got ${st1.paymentStatus}`);
    }
    if (st1.currentAmount !== 100) {
      throw new Error(`Expected Amount Due ₹100, got ₹${st1.currentAmount}`);
    }
    console.log("✓ TEST 1 PASSED");

    await sessionService.endSession('PS5-1', 'Cash', s1.id, 100);

    // ------------------------------------------------------------------
    // TEST 2: Walk-In, Players = 1, Duration = 1 Hour, Payment = Paid Checkout, Gaming = ₹100, Cafe = ₹20
    // Expected: Grand Total = ₹120, Amount Due = ₹120
    // ------------------------------------------------------------------
    console.log("\n--- TEST 2: Paid Checkout Walk-in (Gaming ₹100, Cafe ₹20) ---");
    await sessionService.startWalkInSession({
      stationId: 'PS5-1',
      customerName: 'Sec20 Tester 2',
      phone: '9900000002',
      numPlayers: 1,
      durationMinutes: 60,
      hourlyPrice: 100,
      estimatedTotal: 100,
      originalGamingAmount: 100,
      paymentStatus: 'Pay at Checkout',
      paymentMethod: 'Cash'
    });

    let { data: s2List } = await supabase.from('walkin_sessions').select('*').eq('customer_name', 'Sec20 Tester 2');
    const s2 = s2List[0];
    createdSessionIds.push(s2.id);

    await cafeOrderService.attachOrderToSession({
      stationId: 'PS5-1',
      sessionId: s2.session_code || s2.id,
      productName: 'Pepsi',
      price: 20,
      quantity: 1,
      customerName: 'Sec20 Tester 2'
    });

    const st2 = (await sessionService.getStations(true)).find(s => s.id === 'PS5-1');
    console.log(`  Station 2 Gaming: ₹${st2.price}, Cafe: ₹${st2.snackTotal}, Grand Total: ₹${st2.currentAmount}`);
    if (st2.currentAmount !== 120) {
      throw new Error(`Expected Total Due ₹120, got ₹${st2.currentAmount}`);
    }
    console.log("✓ TEST 2 PASSED");

    await sessionService.endSession('PS5-1', 'Cash', s2.id, 120);

    // ------------------------------------------------------------------
    // TEST 3: Walk-In, Players = 1, Duration = 1 Hour, Payment = Prepaid, Gaming = ₹100, Cafe = ₹0
    // Expected: Gaming = ₹100 PREPAID, Amount Due = ₹0, No second ₹100 payment request
    // ------------------------------------------------------------------
    console.log("\n--- TEST 3: Prepaid Walk-in (Gaming ₹100, Cafe ₹0) ---");
    await sessionService.startWalkInSession({
      stationId: 'PS5-1',
      customerName: 'Sec20 Tester 3',
      phone: '9900000003',
      numPlayers: 1,
      durationMinutes: 60,
      hourlyPrice: 100,
      estimatedTotal: 100,
      originalGamingAmount: 100,
      paymentStatus: 'Prepaid',
      paymentMethod: 'UPI'
    });

    let { data: s3List } = await supabase.from('walkin_sessions').select('*').eq('customer_name', 'Sec20 Tester 3');
    const s3 = s3List[0];
    createdSessionIds.push(s3.id);

    const st3 = (await sessionService.getStations(true)).find(s => s.id === 'PS5-1');
    const amountDue3 = st3.isPrepaid ? st3.snackTotal : st3.currentAmount;
    console.log(`  Station 3 Prepaid: ${st3.isPrepaid}, Amount Due at Checkout: ₹${amountDue3}`);
    if (!st3.isPrepaid) throw new Error("Expected Prepaid session");
    if (amountDue3 !== 0) throw new Error(`Expected Amount Due ₹0, got ₹${amountDue3}`);
    console.log("✓ TEST 3 PASSED");

    await sessionService.endSession('PS5-1', 'UPI', s3.id, 0);

    // ------------------------------------------------------------------
    // TEST 4: Walk-In, Payment = Prepaid, Gaming = ₹100, Cafe = ₹20
    // Expected: Gaming ₹100 PREPAID, Cafe ₹20, Amount Due ₹20 (Checkout requests ONLY ₹20)
    // ------------------------------------------------------------------
    console.log("\n--- TEST 4: Prepaid Walk-in (Gaming ₹100, Cafe ₹20) ---");
    await sessionService.startWalkInSession({
      stationId: 'PS5-1',
      customerName: 'Sec20 Tester 4',
      phone: '9900000004',
      numPlayers: 1,
      durationMinutes: 60,
      hourlyPrice: 100,
      estimatedTotal: 100,
      originalGamingAmount: 100,
      paymentStatus: 'Prepaid',
      paymentMethod: 'Cash'
    });

    let { data: s4List } = await supabase.from('walkin_sessions').select('*').eq('customer_name', 'Sec20 Tester 4');
    const s4 = s4List[0];
    createdSessionIds.push(s4.id);

    await cafeOrderService.attachOrderToSession({
      stationId: 'PS5-1',
      sessionId: s4.session_code || s4.id,
      productName: 'Sprite',
      price: 20,
      quantity: 1,
      customerName: 'Sec20 Tester 4'
    });

    const st4 = (await sessionService.getStations(true)).find(s => s.id === 'PS5-1');
    const amountDue4 = st4.isPrepaid ? st4.snackTotal : st4.currentAmount;
    console.log(`  Station 4 Gaming: ₹${st4.price} (Prepaid), Cafe: ₹${st4.snackTotal}, Amount Due: ₹${amountDue4}`);
    if (amountDue4 !== 20) throw new Error(`Expected Amount Due ₹20, got ₹${amountDue4}`);
    console.log("✓ TEST 4 PASSED");

    await sessionService.endSession('PS5-1', 'Cash', s4.id, 20);

    // ------------------------------------------------------------------
    // TEST 5: Prepaid ₹100, Cafe order ₹10 accidentally added, then deleted
    // Expected: Gaming ₹100 PREPAID, Cafe ₹0, Amount Due ₹0, Deleted ₹10 not revenue
    // ------------------------------------------------------------------
    console.log("\n--- TEST 5: Prepaid Walk-in + Add Cafe ₹10 -> Delete Cafe ₹10 ---");
    await sessionService.startWalkInSession({
      stationId: 'PS5-1',
      customerName: 'Sec20 Tester 5',
      phone: '9900000005',
      numPlayers: 1,
      durationMinutes: 60,
      hourlyPrice: 100,
      estimatedTotal: 100,
      originalGamingAmount: 100,
      paymentStatus: 'Prepaid',
      paymentMethod: 'Cash'
    });

    let { data: s5List } = await supabase.from('walkin_sessions').select('*').eq('customer_name', 'Sec20 Tester 5');
    const s5 = s5List[0];
    createdSessionIds.push(s5.id);

    const ord5 = await cafeOrderService.attachOrderToSession({
      stationId: 'PS5-1',
      sessionId: s5.session_code || s5.id,
      productName: 'Coca-Cola',
      price: 10,
      quantity: 1,
      customerName: 'Sec20 Tester 5'
    });

    await cafeOrderService.deleteOrder(ord5.orderId || ord5.id);

    const st5 = (await sessionService.getStations(true)).find(s => s.id === 'PS5-1');
    const amountDue5 = st5.isPrepaid ? st5.snackTotal : st5.currentAmount;
    console.log(`  Station 5 after deleting cafe order: Cafe: ₹${st5.snackTotal}, Amount Due: ₹${amountDue5}`);
    if (st5.snackTotal !== 0 || amountDue5 !== 0) {
      throw new Error(`Expected Cafe ₹0 and Amount Due ₹0, got Cafe ₹${st5.snackTotal}, Amount Due ₹${amountDue5}`);
    }
    console.log("✓ TEST 5 PASSED");

    await sessionService.endSession('PS5-1', 'Cash', s5.id, 0);

    // ------------------------------------------------------------------
    // TEST 6: Offer: Pay 1 Hour Get 30 Mins Free (Players = 1, Paid Duration = 60m)
    // Expected: Paid = 60m, Bonus = 30m, Total Play Time = 90m (Charge strictly for 1 Hour)
    // ------------------------------------------------------------------
    console.log("\n--- TEST 6: Offer Bonus Time Calculation ---");
    const offResult = await offerService.startOfferSession({
      offerName: 'Play 1 Hour Get 30 Minutes Free',
      stationId: 'PS5-1',
      customerName: 'Offer Tester 6',
      phone: '9900000006',
      numPlayers: 1,
      paidDurationMinutes: 60,
      bonusDurationMinutes: 30,
      deviceType: 'PlayStation 5',
      paymentStatus: 'Pay at Checkout'
    });

    let { data: s6List } = await supabase.from('walkin_sessions').select('*').eq('customer_name', 'Offer Tester 6');
    const s6 = s6List[0];
    createdSessionIds.push(s6.id);

    console.log(`  Offer Session Duration: ${s6.planned_duration} mins, Gaming Charge: ₹${s6.gaming_charge || s6.total_amount}`);
    if (s6.planned_duration !== 90) {
      throw new Error(`Expected planned duration 90 mins (60 paid + 30 bonus), got ${s6.planned_duration}`);
    }
    console.log("✓ TEST 6 PASSED");

    await sessionService.endSession('PS5-1', 'Cash', s6.id, s6.gaming_charge || s6.total_amount);

    // ------------------------------------------------------------------
    // TEST 7: Prepaid Offer
    // Expected: Gaming = PREPAID, Session starts, No gaming payment at END
    // ------------------------------------------------------------------
    console.log("\n--- TEST 7: Prepaid Offer Session ---");
    await offerService.startOfferSession({
      offerName: 'Play 1 Hour Get 30 Minutes Free',
      stationId: 'PS5-1',
      customerName: 'Offer Tester 7',
      phone: '9900000007',
      numPlayers: 1,
      paidDurationMinutes: 60,
      bonusDurationMinutes: 30,
      deviceType: 'PlayStation 5',
      paymentStatus: 'Prepaid',
      paymentMethod: 'UPI'
    });

    let { data: s7List } = await supabase.from('walkin_sessions').select('*').eq('customer_name', 'Offer Tester 7');
    const s7 = s7List[0];
    createdSessionIds.push(s7.id);

    const st7 = (await sessionService.getStations(true)).find(s => s.id === 'PS5-1');
    const amountDue7 = st7.isPrepaid ? st7.snackTotal : st7.currentAmount;
    console.log(`  Prepaid Offer Session: isPrepaid: ${st7.isPrepaid}, Amount Due: ₹${amountDue7}`);
    if (!st7.isPrepaid) throw new Error("Expected Prepaid offer session");
    if (amountDue7 !== 0) throw new Error(`Expected Amount Due ₹0, got ₹${amountDue7}`);
    console.log("✓ TEST 7 PASSED");

    await sessionService.endSession('PS5-1', 'UPI', s7.id, 0);

    console.log("\n=================================================");
    console.log("ALL SECTION 20 EDGE CASE TESTS PASSED 100%");
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

testUserRequirements20();
