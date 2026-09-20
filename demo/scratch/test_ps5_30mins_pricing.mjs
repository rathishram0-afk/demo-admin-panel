import { supabase } from '../src/services/supabase.js';
import { sessionService } from '../src/services/sessionService.js';
import { deviceService } from '../src/services/deviceService.js';

async function testPS530MinsPricing() {
  console.log("=== STARTING PRODUCTION PS5 30-MINUTE DURATION PRICING AUDIT & TEST ===");

  // STEP 1: Verify getPricingSettings merges default PS5 30-min rate dynamically
  console.log("\n[TEST 1] Verifying getPricingSettings merges PS5 30-min rate...");
  const settings = await sessionService.getPricingSettings();
  const weekdayPS5 = settings.weekday['PlayStation 5'];
  const weekendPS5 = settings.weekend['PlayStation 5'];

  console.log("  ✓ Weekday PS5 30 Mins price:", weekdayPS5[30], "(Expected: 60)");
  console.log("  ✓ Weekend PS5 30 Mins price:", weekendPS5[30], "(Expected: 60)");

  if (Number(weekdayPS5[30]) !== 60 || Number(weekendPS5[30]) !== 60) {
    console.error("  ❌ PS5 30 Mins default price mismatch!");
    process.exit(1);
  }

  // STEP 2: Verify getPriceForSessionSync fallback
  console.log("\n[TEST 2] Verifying getPriceForSessionSync fallback for PlayStation 5 30 mins...");
  const rawPrice = sessionService.getPriceForSessionSync('PlayStation 5', 30, settings);
  console.log("  ✓ Fallback calculated price for 30 mins:", rawPrice, "(Expected: 60)");
  if (Number(rawPrice) !== 60) {
    console.error("  ❌ Fallback calculation returned wrong value:", rawPrice);
    process.exit(1);
  }

  // STEP 3: Auto Pricing checks for 1-4 players
  console.log("\n[TEST 3] Testing Auto Pricing for 30 mins (1, 2, 3, 4 Players)...");
  const testCases = [
    { players: 1, expected: 60 },
    { players: 2, expected: 120 },
    { players: 3, expected: 180 },
    { players: 4, expected: 240 }
  ];

  const testStation = 'PS5-4';
  
  for (const tc of testCases) {
    await deviceService.toggleStatus(testStation, 'AVAILABLE').catch(() => {});
    
    // Start session
    await sessionService.startWalkInSession({
      stationId: testStation,
      customerName: `PS5 30Min ${tc.players}P Test`,
      phone: '9999999000',
      numPlayers: tc.players,
      durationMinutes: 30,
      hourlyPrice: 60,
      estimatedTotal: tc.expected,
      isManualMode: false
    });

    const activeList = sessionService._cachedActiveSessions || [];
    const activeSession = activeList.find(s => s.customer_name === `PS5 30Min ${tc.players}P Test`);
    console.log(`  ✓ ${tc.players} Player(s) session started:`);
    console.log("    - Stored Total Amount: ₹", activeSession?.total_amount, `(Expected: ${tc.expected})`);

    if (Number(activeSession?.total_amount) !== tc.expected) {
      console.error(`  ❌ Mismatch for ${tc.players} Player(s)! Got:`, activeSession?.total_amount);
      process.exit(1);
    }

    // Complete session
    await sessionService.endSession(testStation, 'Cash');
    console.log("    - Completed session successfully.");
  }

  // STEP 4: Clean up test records
  console.log("\n[CLEANUP] Cleaning up test session records...");
  await supabase.from('walkin_sessions').delete().like('customer_name', 'PS5 30Min %Test');
  await deviceService.toggleStatus(testStation, 'AVAILABLE').catch(() => {});
  console.log("  ✓ Test records cleaned up successfully!");

  console.log("\n=== ALL PS5 30-MINUTE DURATION PRICING TESTS PASSED SUCCESSFULLY WITH ZERO ERRORS ===");
}

testPS530MinsPricing().catch(err => {
  console.error("Test Execution Error:", err);
  process.exit(1);
});
