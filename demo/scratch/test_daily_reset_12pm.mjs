import { sessionService } from '../src/services/sessionService.js';
import { supabase } from '../src/services/supabase.js';
import { cafeArchiveService } from '../src/services/cafeArchiveService.js';

// Polyfill minimal localStorage in Node for testing if needed
if (typeof localStorage === 'undefined') {
  const store = {};
  global.localStorage = {
    getItem: (k) => store[k] || null,
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); }
  };
}

async function runTests() {
  console.log("=================================================");
  console.log("RUNNING ALL 8 TESTS FOR 12:00 PM NOON DAILY RESET");
  console.log("=================================================");

  // Helper to construct Date in IST
  // 12:00:00 PM IST is 06:30:00 UTC
  // 11:59:00 AM IST is 06:29:00 UTC
  // 12:01:00 PM IST is 06:31:00 UTC
  // 23:59:00 PM IST is 18:29:00 UTC
  // 01:00:00 AM IST is 19:30:00 UTC previous day

  // -------------------------------------------------------------
  // TEST 1: At 11:59 AM IST -> Previous day's business date is active
  // -------------------------------------------------------------
  console.log("\n--- TEST 1: 11:59 AM IST Cutoff Check ---");
  // August 25, 2026 11:59:00 AM IST = 2026-08-25T06:29:00Z
  const time1159AM = new Date("2026-08-25T06:29:00Z");
  const bDate1159 = sessionService.getBusinessDate(time1159AM);
  console.log(`  Timestamp: Aug 25 11:59 AM IST -> Business Date: ${bDate1159}`);
  if (bDate1159 !== '2026-08-24') {
    throw new Error(`TEST 1 Failed: Expected 2026-08-24, got ${bDate1159}`);
  }
  console.log("✓ TEST 1 PASSED (11:59 AM IST belongs to previous business day 2026-08-24)");

  // -------------------------------------------------------------
  // TEST 2: At exactly 12:00 PM NOON IST -> New business day starts
  // -------------------------------------------------------------
  console.log("\n--- TEST 2: Exactly 12:00:00 PM NOON IST ---");
  // August 25, 2026 12:00:00 PM IST = 2026-08-25T06:30:00Z
  const time1200PM = new Date("2026-08-25T06:30:00Z");
  const bDate1200 = sessionService.getBusinessDate(time1200PM);
  console.log(`  Timestamp: Aug 25 12:00 PM IST -> Business Date: ${bDate1200}`);
  if (bDate1200 !== '2026-08-25') {
    throw new Error(`TEST 2 Failed: Expected 2026-08-25, got ${bDate1200}`);
  }
  console.log("✓ TEST 2 PASSED (12:00 PM IST starts new business day 2026-08-25)");

  // -------------------------------------------------------------
  // TEST 3: At 12:01 PM IST -> Remains on new business day
  // -------------------------------------------------------------
  console.log("\n--- TEST 3: 12:01 PM IST Check ---");
  // August 25, 2026 12:01:00 PM IST = 2026-08-25T06:31:00Z
  const time1201PM = new Date("2026-08-25T06:31:00Z");
  const bDate1201 = sessionService.getBusinessDate(time1201PM);
  console.log(`  Timestamp: Aug 25 12:01 PM IST -> Business Date: ${bDate1201}`);
  if (bDate1201 !== '2026-08-25') {
    throw new Error(`TEST 3 Failed: Expected 2026-08-25, got ${bDate1201}`);
  }
  console.log("✓ TEST 3 PASSED (12:01 PM IST remains on 2026-08-25)");

  // -------------------------------------------------------------
  // TEST 4: Evening 11:59 PM & Night 01:00 AM IST belong to current business day
  // -------------------------------------------------------------
  console.log("\n--- TEST 4: Evening & Late Night IST Timestamps ---");
  // August 25, 2026 11:59 PM IST = 2026-08-25T18:29:00Z
  const time1159PM = new Date("2026-08-25T18:29:00Z");
  const bDate1159PM = sessionService.getBusinessDate(time1159PM);
  console.log(`  Aug 25 11:59 PM IST -> Business Date: ${bDate1159PM}`);
  if (bDate1159PM !== '2026-08-25') throw new Error(`Expected 2026-08-25, got ${bDate1159PM}`);

  // August 26, 2026 01:00 AM IST = 2026-08-25T19:30:00Z
  const time0100AM = new Date("2026-08-25T19:30:00Z");
  const bDate0100AM = sessionService.getBusinessDate(time0100AM);
  console.log(`  Aug 26 01:00 AM IST -> Business Date: ${bDate0100AM}`);
  if (bDate0100AM !== '2026-08-25') throw new Error(`Expected 2026-08-25, got ${bDate0100AM}`);
  console.log("✓ TEST 4 PASSED (Late night gaming session belongs to the 2026-08-25 business cycle)");

  // -------------------------------------------------------------
  // TEST 5 & 6: Report Archiving & Payment Reconciliation (CASH + UPI = Total)
  // -------------------------------------------------------------
  console.log("\n--- TEST 5 & 6: Archive Previous Business Day & Payment Reconciliation ---");
  // Clean up any test records
  await supabase.from('walkin_sessions').delete().like('customer_name', 'Reset12PMTest%');

  // Insert mock completed sessions for test date 2026-08-24 (which ran during 2026-08-24 business day)
  const testSessionDate = "2026-08-24T14:00:00Z"; // 7:30 PM IST on Aug 24
  const { data: s1 } = await supabase.from('walkin_sessions').insert([{
    session_code: 'TEST-12PM-CASH',
    customer_name: 'Reset12PMTest Cash',
    device: 'PlayStation 5',
    device_id: 'PS5-1',
    players: 1,
    pricing_plan: '1 Hour',
    total_amount: 100,
    payment_status: 'PAID',
    payment_method: 'Cash',
    session_status: 'COMPLETED',
    start_time: testSessionDate,
    end_time: "2026-08-24T15:00:00Z",
    actual_end_time: "2026-08-24T15:00:00Z"
  }]).select().single();

  const { data: s2 } = await supabase.from('walkin_sessions').insert([{
    session_code: 'TEST-12PM-UPI',
    customer_name: 'Reset12PMTest UPI',
    device: 'PlayStation 5',
    device_id: 'PS5-2',
    players: 2,
    pricing_plan: '1 Hour',
    total_amount: 180,
    payment_status: 'PAID',
    payment_method: 'UPI',
    session_status: 'COMPLETED',
    start_time: testSessionDate,
    end_time: "2026-08-24T15:00:00Z",
    actual_end_time: "2026-08-24T15:00:00Z"
  }]).select().single();

  // Archive operational date 2026-08-24
  const archiveSuccess = await sessionService.archiveDailyReportIfClosed('2026-08-24');
  console.log(`  Archive Execution Result: ${archiveSuccess}`);
  if (!archiveSuccess) throw new Error("Archive failed");

  const reports = await sessionService.getHistoricalReports();
  const rep24 = reports.find(r => r.rawDate === '2026-08-24');
  if (!rep24) throw new Error("Report for 2026-08-24 not found");

  console.log(`  Archived Report Revenue: ₹${rep24.revenue}`);
  console.log(`  Payment Breakdown: Cash=₹${rep24.paymentBreakdown.Cash || 0}, UPI=₹${rep24.paymentBreakdown.UPI || 0}`);
  
  const sumBreakdown = Object.values(rep24.paymentBreakdown).reduce((s, val) => s + (Number(val) || 0), 0);
  if (sumBreakdown !== rep24.revenue) {
    throw new Error(`Payment Breakdown mismatch: Sum=${sumBreakdown}, Revenue=${rep24.revenue}`);
  }
  console.log("✓ TEST 5 & 6 PASSED (Previous day report saved accurately, Cash + UPI = Total Revenue)");

  // -------------------------------------------------------------
  // TEST 7: Idempotency Check (Reset run twice must not duplicate)
  // -------------------------------------------------------------
  console.log("\n--- TEST 7: Idempotency / Double Reset Protection ---");
  const reportsCountBefore = reports.length;
  await sessionService.archiveDailyReportIfClosed('2026-08-24');
  const reportsAfter = await sessionService.getHistoricalReports();
  console.log(`  Reports Count Before: ${reportsCountBefore}, After Second Call: ${reportsAfter.length}`);
  if (reportsAfter.length !== reportsCountBefore) {
    throw new Error(`TEST 7 Failed: Report duplicated! Before: ${reportsCountBefore}, After: ${reportsAfter.length}`);
  }
  console.log("✓ TEST 7 PASSED (Zero duplicates on re-running reset)");

  // -------------------------------------------------------------
  // TEST 8: Recovery after Offline / Missed Reset
  // -------------------------------------------------------------
  console.log("\n--- TEST 8: Missed Reset Recovery ---");
  // Set operational date to old date 2026-08-23
  localStorage.setItem('gforce_operational_date', '2026-08-23');
  localStorage.setItem('gforce_business_day_state', 'OPEN');
  
  // Call checkAndPerformDailyAutoReset
  await sessionService.checkAndPerformDailyAutoReset();
  
  const updatedOpDate = localStorage.getItem('gforce_operational_date');
  const currentActualBizDate = sessionService.getBusinessDate(new Date());
  console.log(`  Recovered Operational Date: ${updatedOpDate}, Current Business Date: ${currentActualBizDate}`);
  if (updatedOpDate !== currentActualBizDate) {
    throw new Error(`TEST 8 Failed: Expected ${currentActualBizDate}, got ${updatedOpDate}`);
  }
  console.log("✓ TEST 8 PASSED (Offline / missed reset recovered safely)");

  // Clean up mock data
  await supabase.from('walkin_sessions').delete().like('customer_name', 'Reset12PMTest%');

  console.log("\n=================================================");
  console.log("ALL 8 DAILY RESET TESTS PASSED 100%");
  console.log("=================================================");
}

runTests().catch(err => {
  console.error("Test Error:", err);
  process.exit(1);
});
