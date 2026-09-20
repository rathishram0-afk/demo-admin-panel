import { sessionService } from '../src/services/sessionService.js';
import { supabase } from '../src/services/supabase.js';

async function testRevenueUnification() {
  console.log("=================================================");
  console.log("TESTING REVENUE UNIFICATION AND PAYMENT BREAKDOWN MATCH");
  console.log("=================================================");

  const summary = await sessionService.getTodaySummary();
  console.log(`\nToday (${summary.opDate}) Summary:`);
  console.log(`  Gaming Revenue: ₹${summary.sessionRevenue}`);
  console.log(`  Cafe Revenue: ₹${summary.cafeRevenue}`);
  console.log(`  Total Revenue: ₹${summary.totalRevenue}`);
  console.log(`  Payment Breakdown: Cash ₹${summary.paymentBreakdown.Cash} | UPI ₹${summary.paymentBreakdown.UPI} | Debit Card ₹${summary.paymentBreakdown['Debit Card'] || 0}`);
  
  const sumBreakdownToday = (summary.paymentBreakdown.Cash || 0) + (summary.paymentBreakdown.UPI || 0) + (summary.paymentBreakdown['Debit Card'] || 0);
  console.log(`  Breakdown Sum: ₹${sumBreakdownToday} (Matches Total Revenue: ${sumBreakdownToday === summary.totalRevenue})`);

  const reports = await sessionService.getHistoricalReports();
  console.log(`\nHistorical Reports Count: ${reports.length}`);

  let mismatches = 0;
  reports.forEach(r => {
    const pb = r.paymentBreakdown || {};
    const pbSum = (pb.Cash || 0) + (pb.UPI || 0) + (pb['Debit Card'] || 0) + (pb['Credit Card'] || 0);
    const matches = r.revenue === pbSum;
    if (!matches) mismatches++;
    console.log(`  Date: ${r.rawDate} | Revenue: ₹${r.revenue} | SessionRev: ₹${r.sessionRevenue} | CafeRev: ₹${r.cafeSales} | BreakdownSum: ₹${pbSum} | Matches: ${matches ? 'YES ✓' : 'NO ❌'}`);
  });

  console.log(`\nTotal Mismatches Across Reports: ${mismatches}`);
}

testRevenueUnification();
