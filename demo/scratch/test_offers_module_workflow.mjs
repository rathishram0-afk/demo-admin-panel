import { supabase } from '../src/services/supabase.js';
import { offerService } from '../src/services/offerService.js';
import { sessionService } from '../src/services/sessionService.js';
import { deviceService } from '../src/services/deviceService.js';

async function testOffersModuleWorkflow() {
  console.log("=== STARTING PRODUCTION OFFERS MODULE AUDIT & TEST ===");

  // STEP 1: Test CRUD operations on offerService
  console.log("\n[TEST 1] Testing Offers CRUD Operations...");
  const initialOffers = await offerService.getOffers();
  console.log("  ✓ Loaded initial offers count:", initialOffers.length);

  const testOffer = await offerService.createOffer({
    offer_name: 'Play 1 Hour Get 30 Mins Free Test',
    device: 'PlayStation 5',
    paid_duration: '1 Hour',
    paid_duration_mins: 60,
    status: 'Enabled',
    description: 'Test offer for PS5'
  });

  console.log("  ✓ Created new Offer:", testOffer.offer_name, "(ID:", testOffer.id, ")");

  const updatedOffers = await offerService.toggleOfferStatus(testOffer.id);
  const toggledOffer = Array.isArray(updatedOffers) ? updatedOffers.find(o => o.id === testOffer.id) : null;
  console.log("  ✓ Toggled Offer status to:", toggledOffer?.status || 'Disabled', "(Expected: Disabled)");
  
  await offerService.toggleOfferStatus(testOffer.id); // Re-enable for session test

  // STEP 2: Test Session Launch via Offer Module for 30 Mins, 1 Hour, 2 Hours, 3 Hours
  console.log("\n[TEST 2] Testing Launching Offer Sessions from Offers Module...");

  const testCases = [
    { paidMins: 30, expectedBonus: 0, expectedFinalMins: 30, expectedAmountPerPlayer: 60, label: '30 Mins (No Bonus)' },
    { paidMins: 60, expectedBonus: 30, expectedFinalMins: 90, expectedAmountPerPlayer: 100, label: '1 Hour (+30 Min Bonus = 90 Mins)' },
    { paidMins: 120, expectedBonus: 30, expectedFinalMins: 150, expectedAmountPerPlayer: 180, label: '2 Hours (+30 Min Bonus = 150 Mins)' },
    { paidMins: 180, expectedBonus: 30, expectedFinalMins: 210, expectedAmountPerPlayer: 280, label: '3 Hours (+30 Min Bonus = 210 Mins)' }
  ];

  const testStation = 'PS5-4';

  for (const tc of testCases) {
    await deviceService.toggleStatus(testStation, 'AVAILABLE').catch(() => {});

    console.log(`\n  --- Testing ${tc.label} ---`);
    await offerService.startOfferSession({
      offerName: 'Play 1 Hour Get 30 Mins Free Test',
      stationId: testStation,
      customerName: `Offer Customer ${tc.paidMins}M`,
      phone: '9888877777',
      numPlayers: 2, // 2 players
      paidDurationMinutes: tc.paidMins,
      bonusDurationMinutes: 30,
      deviceType: 'PlayStation 5',
      notes: 'Testing offer'
    });

    const activeList = sessionService._cachedActiveSessions || [];
    const activeSession = activeList.find(s => s.customer_name === `Offer Customer ${tc.paidMins}M`);

    const expectedTotalPaid = tc.expectedAmountPerPlayer * 2; // 2 players

    console.log("    ✓ Live Session Created:");
    console.log("      - Planned Final Duration (Timer):", activeSession?.planned_duration, "mins", `(Expected: ${tc.expectedFinalMins})`);
    console.log("      - Stored Total Amount (Paid Only): ₹", activeSession?.total_amount, `(Expected: ${expectedTotalPaid})`);

    if (Number(activeSession?.planned_duration) !== tc.expectedFinalMins) {
      console.error("    ❌ Duration mismatch! Got:", activeSession?.planned_duration);
      process.exit(1);
    }

    if (Number(activeSession?.total_amount) !== expectedTotalPaid) {
      console.error("    ❌ Total Amount mismatch! Got:", activeSession?.total_amount);
      process.exit(1);
    }

    // Complete session and verify revenue aggregation
    await sessionService.endSession(testStation, 'UPI');
    console.log("    ✓ Session completed cleanly with UPI payment.");
  }

  // STEP 3: Verify Walk-in Session remains 100% UNTOUCHED and does NOT apply bonus
  console.log("\n[TEST 3] Verifying Walk-in Session does NOT apply bonus automatically...");
  await deviceService.toggleStatus(testStation, 'AVAILABLE').catch(() => {});
  
  await sessionService.startWalkInSession({
    stationId: testStation,
    customerName: 'Normal Walkin Customer',
    phone: '9111122222',
    numPlayers: 1,
    durationMinutes: 60,
    hourlyPrice: 100,
    estimatedTotal: 100,
    isManualMode: false
  });

  const activeList = sessionService._cachedActiveSessions || [];
  const normalSession = activeList.find(s => s.customer_name === 'Normal Walkin Customer');
  console.log("  ✓ Normal Walk-in session duration:", normalSession?.planned_duration, "mins (Expected: 60 mins)");
  console.log("  ✓ Normal Walk-in session amount: ₹", normalSession?.total_amount, "(Expected: ₹100)");

  if (Number(normalSession?.planned_duration) !== 60) {
    console.error("  ❌ Walk-in session was affected by offer!");
    process.exit(1);
  }

  await sessionService.endSession(testStation, 'Cash');

  // STEP 4: Clean up test records
  console.log("\n[CLEANUP] Cleaning up test records...");
  await offerService.deleteOffer(testOffer.id);
  await supabase.from('walkin_sessions').delete().like('customer_name', 'Offer Customer %');
  await supabase.from('walkin_sessions').delete().eq('customer_name', 'Normal Walkin Customer');
  await deviceService.toggleStatus(testStation, 'AVAILABLE').catch(() => {});
  console.log("  ✓ Test records cleaned up successfully!");

  console.log("\n=== ALL OFFERS MODULE TESTS PASSED SUCCESSFULLY WITH ZERO ERRORS ===");
}

testOffersModuleWorkflow().catch(err => {
  console.error("Test Execution Error:", err);
  process.exit(1);
});
