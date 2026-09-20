import { supabase } from '../src/services/supabase.js';

async function auditSupabaseDB() {
  console.log("=================================================");
  console.log("PHASE 1 — SUPABASE DATABASE & SCHEMA AUDIT");
  console.log("=================================================");

  // List of candidate table names to inspect
  const candidateTables = [
    'walkin_sessions',
    'cafe_orders',
    'payments',
    'transactions',
    'revenue',
    'daily_reports',
    'offers'
  ];

  for (const tableName of candidateTables) {
    try {
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact' })
        .limit(20);

      if (error) {
        console.log(`Table '${tableName}': ERROR / DOES NOT EXIST (${error.message})`);
      } else {
        console.log(`\n-------------------------------------------------`);
        console.log(`TABLE: '${tableName}' — Total Row Count: ${count}`);
        if (data && data.length > 0) {
          console.log(`Columns (${Object.keys(data[0]).length}): ${Object.keys(data[0]).join(', ')}`);
          console.log(`Sample Record 1:`, JSON.stringify(data[0], null, 2));
        } else {
          console.log(`Table '${tableName}' exists but is empty (0 rows).`);
        }
      }
    } catch (e) {
      console.log(`Table '${tableName}': Exception ${e.message}`);
    }
  }

  // Also query all walkin_sessions records
  console.log("\n=================================================");
  console.log("INSPECTING ALL WALKIN_SESSIONS RECORDS");
  console.log("=================================================");
  const { data: allWalkins, error: wErr } = await supabase
    .from('walkin_sessions')
    .select('*')
    .order('created_at', { ascending: false });

  if (wErr) {
    console.error("Error fetching all walkin_sessions:", wErr);
  } else {
    console.log(`Total walkin_sessions in DB: ${allWalkins.length}`);
    allWalkins.forEach((w, i) => {
      console.log(`[${i + 1}] ID: ${w.id} | SessionCode: ${w.session_code || '-'} | Device: ${w.device_id || w.device_name} | Customer: ${w.customer_name} | Start: ${w.start_time || w.created_at} | Status: ${w.session_status} | PayStatus: ${w.payment_status} | PayMethod: ${w.payment_method} | Gaming: ${w.gaming_charge || w.total_amount} | Food: ${w.food_total || 0} | Total: ${w.total_amount} | SnapshotPrepaid: ${w.pricing_snapshot?.isPrepaid}`);
    });
  }

  // Also query all cafe_orders records
  console.log("\n=================================================");
  console.log("INSPECTING ALL CAFE_ORDERS RECORDS");
  console.log("=================================================");
  const { data: allCafe, error: cErr } = await supabase
    .from('cafe_orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (cErr) {
    console.error("Error fetching all cafe_orders:", cErr);
  } else {
    console.log(`Total cafe_orders in DB: ${allCafe.length}`);
    allCafe.forEach((c, i) => {
      console.log(`[${i + 1}] ID: ${c.id || c.order_id} | Product: ${c.product_name} | Qty: ${c.quantity} | Total: ${c.total_amount || c.total} | Status: ${c.status} | PayStatus: ${c.payment_status} | PayMethod: ${c.payment_method} | Mode: ${c.mode} | SessId: ${c.session_id} | CreatedAt: ${c.created_at}`);
    });
  }
}

auditSupabaseDB();
