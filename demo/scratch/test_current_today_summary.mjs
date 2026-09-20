import { sessionService } from '../src/services/sessionService.js';

async function testCurrentTodaySummary() {
  console.log("=================================================");
  console.log("TESTING CURRENT getTodaySummary() AND REVENUE OUTPUT");
  console.log("=================================================");

  const summary = await sessionService.getTodaySummary();
  console.log("\ngetTodaySummary() Result:");
  console.log(JSON.stringify(summary, null, 2));

  const reports = await sessionService.getHistoricalReports();
  console.log("\ngetHistoricalReports() Result (Today's Entry):");
  const todayReport = reports.find(r => r.rawDate === summary.opDate);
  console.log(JSON.stringify(todayReport, null, 2));
}

testCurrentTodaySummary();
