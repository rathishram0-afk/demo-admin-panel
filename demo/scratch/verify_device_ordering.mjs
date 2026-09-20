import { deviceService } from '../src/services/deviceService.js';
import { sessionService } from '../src/services/sessionService.js';
import { sortDevicesByCentralizedOrder, getDeviceSortRank } from '../src/utils/deviceOrder.js';

const REQUIRED_SEQUENCE = [
  'PS5 - 1',
  'PS5 - 2',
  'PS5 - 3',
  'PS5 - 4',
  'PS5 - 1 EXTRA PERSON',
  'PS5 - 2 EXTRA PERSON',
  'PS5 - 3 EXTRA PERSON',
  'PS5 - 4 EXTRA PERSON',
  'PS4 - 1',
  'PS4 - 2',
  'PS4 - 3',
  'PS4 - 4',
  'PS2 - 1',
  'SIM - 1',
  'VR - 1'
];

async function runDeviceOrderVerification() {
  console.log("==========================================================================");
  console.log("             VERIFYING CENTRALIZED DEVICE ORDERING (15 DEVICES)           ");
  console.log("==========================================================================");

  // 1. Fetch devices from deviceService
  const devicesFromDb = await deviceService.getDevices(true);
  console.log(`\n[1] Fetched ${devicesFromDb.length} devices from deviceService.getDevices():`);
  devicesFromDb.forEach((d, i) => {
    console.log(`  ${i + 1}. [Code: ${d.device_code}] Name: "${d.device_name}" | Rank: ${getDeviceSortRank(d)}`);
  });

  // 2. Map stations via sessionService
  const mappedStations = sessionService.mapStations(devicesFromDb, []);
  console.log(`\n[2] Mapped ${mappedStations.length} stations via sessionService.mapStations():`);
  mappedStations.forEach((s, i) => {
    console.log(`  ${i + 1}. [ID: ${s.id}] Name: "${s.name}" | Zone: "${s.zone}" | Rank: ${getDeviceSortRank(s)}`);
  });

  // 3. Verify exact 1-to-1 match with required sequence
  console.log("\n[3] Verifying exact match with required 15-device sequence...");
  let allMatched = true;

  REQUIRED_SEQUENCE.forEach((expectedName, idx) => {
    const actual = mappedStations[idx];
    const actualName = actual ? (actual.name || actual.id) : 'MISSING';
    const match = actualName.toUpperCase().replace(/\s+/g, ' ').trim() === expectedName.toUpperCase().replace(/\s+/g, ' ').trim();

    if (match) {
      console.log(`  ✓ Position ${idx + 1}: ${actualName} (Matches "${expectedName}")`);
    } else {
      console.error(`  ❌ Position ${idx + 1}: Expected "${expectedName}", but got "${actualName}"`);
      allMatched = false;
    }
  });

  if (!allMatched) {
    console.error("\n❌ DEVICE ORDER VERIFICATION FAILED: Device sequence does not match!");
    process.exit(1);
  }

  console.log("\n==========================================================================");
  console.log("    SUCCESS! ALL 15 DEVICES MATCH THE EXACT REQUIRED SEQUENCE 100%       ");
  console.log("==========================================================================");
}

runDeviceOrderVerification();
