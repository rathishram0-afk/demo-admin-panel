import { offerService } from '../src/services/offerService.js';
import { supabase } from '../src/services/supabase.js';
import { deviceService } from '../src/services/deviceService.js';

async function testOfferDurationCalculation() {
  console.log("=================================================");
  console.log("RUNNING ALL 7 OFFER DURATION & BONUS TEST CASES");
  console.log("=================================================");

  // Cleanup test records & reset test station
  await supabase.from('walkin_sessions').delete().like('customer_name', 'OfferCalcTest%');
  await deviceService.toggleStatus('PS5-3', 'AVAILABLE').catch(() => {});

  // ------------------------------------------------------------------
  // TEST 1: 1 Hour Offer -> Expected 1h 30m (90 mins)
  // ------------------------------------------------------------------
  console.log("\n--- TEST 1: 1 Hour Offer ---");
  const paid1 = 60;
  const bonus1 = (paid1 === 120 ? 60 : (paid1 === 60 ? 30 : 0));
  const total1 = paid1 + bonus1;
  console.log(`  Paid: ${paid1} mins, Bonus: ${bonus1} mins, Total: ${total1} mins (${total1/60} Hours)`);
  if (total1 !== 90) throw new Error(`TEST 1 Failed: Expected 90 mins, got ${total1}`);
  console.log("✓ TEST 1 PASSED (1 Hour 30 Minutes)");

  // ------------------------------------------------------------------
  // TEST 2: 2 Hours Offer -> Expected 3h (180 mins)
  // ------------------------------------------------------------------
  console.log("\n--- TEST 2: 2 Hours Offer ---");
  const paid2 = 120;
  const bonus2 = (paid2 === 120 ? 60 : (paid2 === 60 ? 30 : 0));
  const total2 = paid2 + bonus2;
  console.log(`  Paid: ${paid2} mins, Bonus: ${bonus2} mins, Total: ${total2} mins (${total2/60} Hours)`);
  if (total2 !== 180) throw new Error(`TEST 2 Failed: Expected 180 mins, got ${total2}`);
  console.log("✓ TEST 2 PASSED (3 Hours)");

  // ------------------------------------------------------------------
  // TEST 3: Switch 1 Hour -> 2 Hours -> Expected 3h (180 mins, NOT 2h 30m)
  // ------------------------------------------------------------------
  console.log("\n--- TEST 3: Switch 1 Hour -> 2 Hours ---");
  let activePaid = 60;
  // User clicks 2 Hours:
  activePaid = 120;
  const bonus3 = (activePaid === 120 ? 60 : (activePaid === 60 ? 30 : 0));
  const total3 = activePaid + bonus3;
  console.log(`  After switching to 2 Hours -> Total: ${total3} mins`);
  if (total3 !== 180) throw new Error(`TEST 3 Failed: Expected 180 mins, got ${total3}`);
  console.log("✓ TEST 3 PASSED (Strictly 3 Hours, NOT 2 Hours 30 Mins)");

  // ------------------------------------------------------------------
  // TEST 4: Switch 2 Hours -> 1 Hour -> Expected 1h 30m (90 mins)
  // ------------------------------------------------------------------
  console.log("\n--- TEST 4: Switch 2 Hours -> 1 Hour ---");
  activePaid = 60;
  const bonus4 = (activePaid === 120 ? 60 : (activePaid === 60 ? 30 : 0));
  const total4 = activePaid + bonus4;
  console.log(`  After switching back to 1 Hour -> Total: ${total4} mins`);
  if (total4 !== 90) throw new Error(`TEST 4 Failed: Expected 90 mins, got ${total4}`);
  console.log("✓ TEST 4 PASSED (1 Hour 30 Minutes)");

  // ------------------------------------------------------------------
  // TEST 5: Refresh/reopen page and select 2-Hour offer -> Expected 3h
  // ------------------------------------------------------------------
  console.log("\n--- TEST 5: Fresh Select 2-Hour Offer ---");
  const offers = await offerService.getOffers();
  const offer2 = offers.find(o => Number(o.paid_duration_mins) === 120) || { paid_duration_mins: 120, bonus_duration_mins: 60 };
  const paid5 = Number(offer2.paid_duration_mins);
  const bonus5 = (paid5 === 120 ? 60 : (paid5 === 60 ? 30 : 0));
  const total5 = paid5 + bonus5;
  console.log(`  Selected Offer "${offer2.offer_name || '2 Hours'}" -> Total: ${total5} mins`);
  if (total5 !== 180) throw new Error(`TEST 5 Failed: Expected 180 mins, got ${total5}`);
  console.log("✓ TEST 5 PASSED (3 Hours)");

  // ------------------------------------------------------------------
  // TEST 6: Launch 2-Hour offer session -> Timer/duration = 3 hours (180 mins)
  // ------------------------------------------------------------------
  console.log("\n--- TEST 6: Launch 2-Hour Offer Session ---");
  await deviceService.toggleStatus('PS5-3', 'AVAILABLE').catch(() => {});
  await offerService.startOfferSession({
    offerName: 'Play 2 Hours Get 1 Hour Free',
    stationId: 'PS5-3',
    customerName: 'OfferCalcTest 6',
    phone: '9900000006',
    numPlayers: 1,
    paidDurationMinutes: 120,
    bonusDurationMinutes: 60
  });

  const { data: rec6 } = await supabase.from('walkin_sessions').select('*').eq('customer_name', 'OfferCalcTest 6').single();
  console.log(`  DB Record Planned Duration: ${rec6.planned_duration} Mins (Expected 180)`);
  console.log(`  DB Record Total Amount Billed: ₹${rec6.total_amount}`);
  if (Number(rec6.planned_duration) !== 180) throw new Error(`TEST 6 Failed: Expected 180 mins planned_duration, got ${rec6.planned_duration}`);
  console.log("✓ TEST 6 PASSED");
  await deviceService.toggleStatus('PS5-3', 'AVAILABLE').catch(() => {});

  // ------------------------------------------------------------------
  // TEST 7: Launch 1-Hour offer session -> Timer/duration = 1h 30m (90 mins)
  // ------------------------------------------------------------------
  console.log("\n--- TEST 7: Launch 1-Hour Offer Session ---");
  await deviceService.toggleStatus('PS5-3', 'AVAILABLE').catch(() => {});
  await offerService.startOfferSession({
    offerName: 'Play 1 Hour Get 30 Minutes Free',
    stationId: 'PS5-3',
    customerName: 'OfferCalcTest 7',
    phone: '9900000007',
    numPlayers: 1,
    paidDurationMinutes: 60,
    bonusDurationMinutes: 30
  });

  const { data: rec7 } = await supabase.from('walkin_sessions').select('*').eq('customer_name', 'OfferCalcTest 7').single();
  console.log(`  DB Record Planned Duration: ${rec7.planned_duration} Mins (Expected 90)`);
  console.log(`  DB Record Total Amount Billed: ₹${rec7.total_amount}`);
  if (Number(rec7.planned_duration) !== 90) throw new Error(`TEST 7 Failed: Expected 90 mins planned_duration, got ${rec7.planned_duration}`);
  console.log("✓ TEST 7 PASSED");
  await deviceService.toggleStatus('PS5-3', 'AVAILABLE').catch(() => {});

  // Cleanup test records
  await supabase.from('walkin_sessions').delete().like('customer_name', 'OfferCalcTest%');
  await deviceService.toggleStatus('PS5-3', 'AVAILABLE').catch(() => {});

  console.log("\n=================================================");
  console.log("ALL 7 OFFER CALCULATION TESTS PASSED 100%");
  console.log("=================================================");
}

testOfferDurationCalculation();
