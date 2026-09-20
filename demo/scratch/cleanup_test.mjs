import { adminDataService } from '../src/services/adminDataService.js';

async function finalCleanup() {
  await adminDataService.resetAllData();
  console.log("FINAL RESET CLEANUP COMPLETE: 11 Aug 2026 is LIVE with ZERO orders and ZERO revenue!");
}

finalCleanup();
