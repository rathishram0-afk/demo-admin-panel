import { supabase } from '../src/services/supabase.js';
import { sessionService } from '../src/services/sessionService.js';

async function checkTodayData() {
  const now = new Date();
  const currentBizDate = sessionService.getBusinessDate(now);
  console.log("Current System Date:", now.toISOString());
  console.log("Current Business Date:", currentBizDate);

  const { data: walkins, error: wErr } = await supabase.from('walkin_sessions').select('*');
  console.log("\nWALKIN SESSIONS IN DB:", walkins ? walkins.length : 0);
  if (walkins) {
    walkins.forEach(w => {
      const bDate = sessionService.getBusinessDate(w.start_time || w.created_at || w.session_date);
      console.log(`- ID: ${w.id} | Code: ${w.session_code} | Customer: ${w.customer_name} | Status: ${w.session_status} | Amount: ₹${w.total_amount} | Start: ${w.start_time} | BizDate: ${bDate}`);
    });
  }

  const { data: cafeOrders, error: cErr } = await supabase.from('cafe_orders').select('*');
  console.log("\nCAFE ORDERS IN DB:", cafeOrders ? cafeOrders.length : 0);
  if (cafeOrders) {
    cafeOrders.forEach(c => {
      const bDate = sessionService.getBusinessDate(c.created_at);
      console.log(`- ID: ${c.id} | Product: ${c.product_name} | Status: ${c.status} | Total: ₹${c.total_amount || c.total} | Created: ${c.created_at} | BizDate: ${bDate}`);
    });
  }

  const histReports = await sessionService.getHistoricalReports();
  console.log("\nHISTORICAL REPORTS FROM getHistoricalReports():", histReports.length);
  histReports.forEach(r => {
    console.log(`- Date: ${r.rawDate} (${r.dateStr}) | Revenue: ₹${r.revenue} | Sessions: ${r.completedSessions} | Cafe: ₹${r.cafeSales}`);
  });

  const metrics = await sessionService.getDashboardMetrics(true);
  console.log("\nDASHBOARD METRICS FROM getDashboardMetrics():", metrics);
}

checkTodayData();
