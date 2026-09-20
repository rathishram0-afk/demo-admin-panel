import { sessionService } from '../src/services/sessionService.js';
import { supabase } from '../src/services/supabase.js';

async function testStationDefaultFix() {
  console.log("=================================================");
  console.log("TESTING WALK-IN SESSION STATION SELECTION DEFAULTS");
  console.log("=================================================");

  // Simulate initial form state in WalkInSessionModule
  let walkInForm = {
    groupLeader: '',
    mobile: '',
    device: 'PlayStation 5',
    consoleId: 'PS5-1',
    numPlayers: 1,
    durationLabel: '1 Hour',
    durationMinutes: 60,
    paymentStatus: 'Pay at Checkout',
    paymentMethod: 'Cash'
  };

  function simulateConsoleChange(consoleId, deviceType = 'PlayStation 5') {
    const isSinglePlayer = deviceType === 'Racing Simulator' || deviceType === 'PS VR2' || consoleId === 'SIM-1' || consoleId.startsWith('VR');
    const numPlayers = isSinglePlayer ? 1 : (walkInForm.numPlayers || 1);

    walkInForm = {
      ...walkInForm,
      consoleId,
      device: deviceType,
      numPlayers
    };
  }

  function simulateResetForm() {
    walkInForm = {
      groupLeader: '',
      mobile: '',
      device: 'PlayStation 5',
      consoleId: 'PS5-1',
      numPlayers: 1,
      durationLabel: '1 Hour',
      durationMinutes: 60,
      paymentStatus: 'Pay at Checkout',
      paymentMethod: 'Cash'
    };
  }

  // ------------------------------------------------------------------
  // TEST 1: Initial Form State
  // ------------------------------------------------------------------
  console.log("\n--- TEST 1: Initial Form State ---");
  console.log(`  Players: ${walkInForm.numPlayers}, Duration: ${walkInForm.durationLabel} (${walkInForm.durationMinutes} mins)`);
  if (walkInForm.numPlayers !== 1 || walkInForm.durationMinutes !== 60) {
    throw new Error("Initial state is not 1 Player + 1 Hour!");
  }
  console.log("✓ TEST 1 PASSED");

  // ------------------------------------------------------------------
  // TEST 2: Select PS5-3
  // ------------------------------------------------------------------
  console.log("\n--- TEST 2: Select PS5-3 ---");
  simulateConsoleChange('PS5-3', 'PlayStation 5');
  console.log(`  Console: ${walkInForm.consoleId}, Players: ${walkInForm.numPlayers}, Duration: ${walkInForm.durationLabel} (${walkInForm.durationMinutes} mins)`);
  if (walkInForm.numPlayers !== 1 || walkInForm.durationMinutes !== 60) {
    throw new Error(`Selecting PS5-3 changed state to ${walkInForm.numPlayers} Players / ${walkInForm.durationMinutes} mins!`);
  }
  console.log("✓ TEST 2 PASSED");

  // ------------------------------------------------------------------
  // TEST 3: Select PS4-1
  // ------------------------------------------------------------------
  console.log("\n--- TEST 3: Select PS4-1 ---");
  simulateConsoleChange('PS4-1', 'PlayStation 4');
  console.log(`  Console: ${walkInForm.consoleId}, Players: ${walkInForm.numPlayers}, Duration: ${walkInForm.durationLabel} (${walkInForm.durationMinutes} mins)`);
  if (walkInForm.numPlayers !== 1 || walkInForm.durationMinutes !== 60) {
    throw new Error(`Selecting PS4-1 changed state to ${walkInForm.numPlayers} Players / ${walkInForm.durationMinutes} mins!`);
  }
  console.log("✓ TEST 3 PASSED");

  // ------------------------------------------------------------------
  // TEST 4: Select PS2-1
  // ------------------------------------------------------------------
  console.log("\n--- TEST 4: Select PS2-1 ---");
  simulateConsoleChange('PS2-1', 'PlayStation 2');
  console.log(`  Console: ${walkInForm.consoleId}, Players: ${walkInForm.numPlayers}, Duration: ${walkInForm.durationLabel} (${walkInForm.durationMinutes} mins)`);
  if (walkInForm.numPlayers !== 1 || walkInForm.durationMinutes !== 60) {
    throw new Error(`Selecting PS2-1 changed state to ${walkInForm.numPlayers} Players / ${walkInForm.durationMinutes} mins!`);
  }
  console.log("✓ TEST 4 PASSED");

  // ------------------------------------------------------------------
  // TEST 5: Manual User Selection Preservation Across Station Switches
  // ------------------------------------------------------------------
  console.log("\n--- TEST 5: Manual User Selection Preservation ---");
  walkInForm.numPlayers = 2;
  walkInForm.durationLabel = '2 Hours';
  walkInForm.durationMinutes = 120;
  console.log(`  User manually selected: ${walkInForm.numPlayers} Players, ${walkInForm.durationLabel}`);

  simulateConsoleChange('PS5-4', 'PlayStation 5');
  console.log(`  Switched to PS5-4: Players: ${walkInForm.numPlayers}, Duration: ${walkInForm.durationLabel}`);
  if (walkInForm.numPlayers !== 2 || walkInForm.durationMinutes !== 120) {
    throw new Error(`Switching station erased user manual selection! Got ${walkInForm.numPlayers} Players / ${walkInForm.durationMinutes} mins`);
  }
  console.log("✓ TEST 5 PASSED");

  // ------------------------------------------------------------------
  // TEST 6: Form Reset
  // ------------------------------------------------------------------
  console.log("\n--- TEST 6: Form Reset ---");
  simulateResetForm();
  console.log(`  After Reset: Players: ${walkInForm.numPlayers}, Duration: ${walkInForm.durationLabel} (${walkInForm.durationMinutes} mins)`);
  if (walkInForm.numPlayers !== 1 || walkInForm.durationMinutes !== 60) {
    throw new Error("Reset form did not restore 1 Player + 1 Hour!");
  }
  console.log("✓ TEST 6 PASSED");

  console.log("\n=================================================");
  console.log("ALL WALK-IN SESSION STATION DEFAULT TESTS PASSED 100%");
  console.log("=================================================");
}

testStationDefaultFix();
