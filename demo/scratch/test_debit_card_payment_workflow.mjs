import { supabase } from '../src/services/supabase.js';
import { sessionService } from '../src/services/sessionService.js';
import { deviceService } from '../src/services/deviceService.js';

async function testDebitCardPaymentWorkflow() {
  console.log("=== STARTING PRODUCTION DEBIT CARD PAYMENT WORKFLOW AUDIT & TEST ===");

  // PRE-CLEANUP
  await supabase.from('walkin_sessions').delete().eq('customer_name', 'Debit Card Test Gamer');

  const testStation = 'PS5-4';
  await deviceService.toggleStatus(testStation, 'AVAILABLE').catch(() => {});

  // STEP 1: Launch Walk-in Session
  console.log("\n[TEST 1] Starting Walk-in Session on PS5-4 for Debit Card payment test...");
  await sessionService.startWalkInSession({
    stationId: testStation,
    customerName: 'Debit Card Test Gamer',
    phone: '9999988888',
    numPlayers: 2,
    durationMinutes: 60,
    hourlyPrice: 100,
    estimatedTotal: 200,
    isManualMode: false
  });

  let activeList = sessionService._cachedActiveSessions || [];
  let sActive = activeList.find(s => s.customer_name === 'Debit Card Test Gamer');
  console.log("  ✓ Live Session started cleanly on PS5-4 for Debit Card Gamer. ID:", sActive?.id, "Code:", sActive?.session_code);

  // STEP 2: End Session with Debit Card Payment Method
  console.log("\n[TEST 2] Ending session with selected Payment Method = Debit Card...");
  await sessionService.endSession(testStation, 'Debit Card', sActive?.id, 200);

  // STEP 3: Verify Supabase database record & payment resolution
  console.log("\n[TEST 3] Verifying Debit Card payment persistence in Supabase database & resolution...");
  const { data: dbSessions, error: dbErr } = await supabase
    .from('walkin_sessions')
    .select('*')
    .eq('id', sActive.id);

  const dbSession = dbSessions && dbSessions[0];

  if (dbErr || !dbSession) {
    console.error("  ❌ Database record not found for Debit Card session:", dbErr);
    process.exit(1);
  }

  const resolvedPaymentMethod = sessionService.resolvePaymentMethod(dbSession);
  console.log("  ✓ Raw Payment Method in DB:", dbSession.payment_method);
  console.log("  ✓ Resolved Application Payment Method:", resolvedPaymentMethod, "(Expected: Debit Card)");
  console.log("  ✓ Total Amount Billed: ₹", dbSession.total_amount);

  if (resolvedPaymentMethod !== 'Debit Card') {
    console.error("  ❌ Payment method mismatch! Expected Debit Card, got:", resolvedPaymentMethod);
    process.exit(1);
  }

  // STEP 4: Verify Today Summary Payment Breakdown
  console.log("\n[TEST 4] Verifying Payment Breakdown in Today's Summary...");
  const opDate = new Date().toISOString().split('T')[0];
  const summary = await sessionService.getTodaySummary(opDate);
  
  console.log("  ✓ Today Payment Breakdown:");
  console.log("    - Cash: ₹", summary.paymentBreakdown?.Cash || 0);
  console.log("    - UPI: ₹", summary.paymentBreakdown?.UPI || 0);
  console.log("    - Credit Card: ₹", summary.paymentBreakdown?.['Credit Card'] || 0);
  console.log("    - Debit Card: ₹", summary.paymentBreakdown?.['Debit Card'] || 0);

  const calculatedSum = (summary.paymentBreakdown?.Cash || 0) +
                        (summary.paymentBreakdown?.UPI || 0) +
                        (summary.paymentBreakdown?.['Credit Card'] || 0) +
                        (summary.paymentBreakdown?.['Debit Card'] || 0);

  console.log("  ✓ Calculated Payment Breakdown Sum: ₹", calculatedSum);
  console.log("  ✓ Overall Session Revenue: ₹", summary.sessionRevenue);

  if (summary.paymentBreakdown?.['Debit Card'] < 200) {
    console.error("  ❌ Debit Card total calculation failed!");
    process.exit(1);
  }

  // STEP 5: Clean up test records
  console.log("\n[CLEANUP] Cleaning up Debit Card test session...");
  await supabase.from('walkin_sessions').delete().eq('id', dbSession.id);
  await deviceService.toggleStatus(testStation, 'AVAILABLE').catch(() => {});
  console.log("  ✓ Test records cleaned up successfully!");

  console.log("\n=== DEBIT CARD PAYMENT WORKFLOW TEST PASSED WITH ZERO ERRORS ===");
}

testDebitCardPaymentWorkflow().catch(err => {
  console.error("Debit Card Test Execution Error:", err);
  process.exit(1);
});
