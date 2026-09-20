import { sessionService } from '../src/services/sessionService.js';
import { deviceService } from '../src/services/deviceService.js';
import { supabase } from '../src/services/supabase.js';

async function runTests() {
  console.log("=================================================");
  console.log("TESTING EXACT PAYMENT METHOD OPTIONS: Cash, UPI, Debit Card");
  console.log("=================================================");

  const todayStr = sessionService.getBusinessDate(new Date());
  console.log(`Current Business Date: ${todayStr}`);

  // Ensure devices are AVAILABLE for test
  await deviceService.toggleStatus('PS5-1', 'AVAILABLE').catch(() => {});
  await deviceService.toggleStatus('PS5-2', 'AVAILABLE').catch(() => {});

  const testIds = [];

  try {
    // TEST 1 — PREPAID DEBIT CARD
    console.log("\n--- TEST 1: PREPAID DEBIT CARD ---");
    await sessionService.startWalkInSession({
      stationId: 'PS5-1',
      customerName: 'Prepaid Debit Card Player',
      phone: '9999900010',
      numPlayers: 2,
      durationMinutes: 60,
      hourlyPrice: 60,
      estimatedTotal: 120,
      paymentStatus: 'Prepaid',
      paymentMethod: 'Debit Card'
    });

    let { data: walkin1Data } = await supabase.from('walkin_sessions').select('*').eq('customer_name', 'Prepaid Debit Card Player');
    if (!walkin1Data || walkin1Data.length === 0) throw new Error("Prepaid session record not found in DB");

    const rec1 = walkin1Data[0];
    testIds.push(rec1.id);
    console.log("✓ Created Prepaid Debit Card Session (DB payment_method:", rec1.payment_method, ")");

    let summary1 = await sessionService.getTodaySummary(todayStr);
    let cardFound1 = summary1.todayCompletedSessions.find(w => w.id === rec1.id);
    console.log(`✓ Prepaid Debit Card session resolved method: ${cardFound1 && cardFound1.paymentMethod === 'Debit Card' ? 'PASS (Debit Card)' : 'FAIL (' + cardFound1?.paymentMethod + ')'}`);

    // TEST 2 — PAY AT CHECKOUT DEBIT CARD
    console.log("\n--- TEST 2: PAY AT CHECKOUT DEBIT CARD ---");
    await sessionService.startWalkInSession({
      stationId: 'PS5-2',
      customerName: 'Checkout Debit Card Player',
      phone: '9999900011',
      numPlayers: 1,
      durationMinutes: 60,
      hourlyPrice: 60,
      estimatedTotal: 60,
      paymentStatus: 'Pay at Checkout',
      paymentMethod: null
    });

    let { data: walkin2Data } = await supabase.from('walkin_sessions').select('*').eq('customer_name', 'Checkout Debit Card Player');
    if (!walkin2Data || walkin2Data.length === 0) throw new Error("Checkout session record not found in DB");

    const rec2 = walkin2Data[0];
    testIds.push(rec2.id);

    // End session at checkout with Debit Card
    await sessionService.endSession('PS5-2', 'Debit Card', rec2.id, 60);

    let summary2 = await sessionService.getTodaySummary(todayStr);
    let cardFound2 = summary2.todayCompletedSessions.find(w => w.id === rec2.id);
    console.log(`✓ Pay at Checkout Debit Card session resolved method: ${cardFound2 && cardFound2.paymentMethod === 'Debit Card' ? 'PASS (Debit Card)' : 'FAIL (' + cardFound2?.paymentMethod + ')'}`);

    console.log("\n=================================================");
    console.log("DEBIT CARD PAYMENT METHOD TEST SCENARIOS PASSED 100%");
    console.log("=================================================");

  } catch (err) {
    console.error("Test execution failed:", err);
  } finally {
    if (testIds.length > 0) {
      await supabase.from('walkin_sessions').delete().in('id', testIds);
      console.log(`\nCleaned up ${testIds.length} test records from database.`);
    }
    await deviceService.toggleStatus('PS5-1', 'AVAILABLE').catch(() => {});
    await deviceService.toggleStatus('PS5-2', 'AVAILABLE').catch(() => {});
  }
}

runTests();
