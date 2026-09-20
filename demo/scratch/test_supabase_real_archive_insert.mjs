import { cafeArchiveService } from '../src/services/cafeArchiveService.js';
import { supabase } from '../src/services/supabase.js';

async function testSupabaseRealArchiveInsert() {
  console.log("=== STARTING REAL SUPABASE CAFE_DAILY_ARCHIVES INSERT TEST ===");

  const testOpDate = '2026-08-05';
  const testOrders = [
    {
      id: 'sp_ord_1',
      order_id: 'GF-901',
      product_name: 'Fanta 400ml',
      category: 'Drinks',
      quantity: 3,
      price: 30,
      total_amount: 90,
      payment_method: 'UPI',
      status: 'Collected',
      created_at: `${testOpDate}T15:00:00.000Z`
    },
    {
      id: 'sp_ord_2',
      order_id: 'GF-902',
      product_name: 'Lays Chips',
      category: 'Snacks',
      quantity: 1,
      price: 50,
      total_amount: 50,
      payment_method: 'Cash',
      status: 'Collected',
      created_at: `${testOpDate}T16:00:00.000Z`
    }
  ];

  console.log(`\n[STEP 1] Calling cafeArchiveService.archiveDailyCafeReport for ${testOpDate} (Revenue ₹140, 2 Orders)...`);
  const result = await cafeArchiveService.archiveDailyCafeReport(testOpDate, testOrders);
  console.log("  ✓ Archive Service Result:", result);

  console.log(`\n[STEP 2] Direct SQL/Supabase query on cafe_daily_archives table...`);
  const { data: dbRows, error } = await supabase
    .from('cafe_daily_archives')
    .select('*')
    .eq('raw_date', testOpDate);

  if (error) {
    console.error("  ❌ Supabase query error:", error);
    process.exit(1);
  }

  console.log(`  ✓ Supabase returned ${dbRows?.length} record(s) for ${testOpDate}:`);
  dbRows.forEach(row => {
    console.log(`    - ID: ${row.id}`);
    console.log(`    - Raw Date: ${row.raw_date} (${row.date_str})`);
    console.log(`    - Total Revenue: ₹${row.total_revenue}`);
    console.log(`    - Total Orders: ${row.total_orders}`);
    console.log(`    - Cash Revenue: ₹${row.cash_revenue}`);
    console.log(`    - UPI Revenue: ₹${row.upi_revenue}`);
    console.log(`    - Top Selling Product: ${row.best_selling_product}`);
  });

  if (!dbRows || dbRows.length === 0) {
    console.error("  ❌ Record was NOT found in Supabase cafe_daily_archives table!");
    process.exit(1);
  }

  const savedRow = dbRows[0];
  if (Number(savedRow.total_revenue) !== 140 || Number(savedRow.total_orders) !== 2) {
    console.error("  ❌ Value mismatch in Supabase table!");
    process.exit(1);
  }

  console.log("\n=== REAL SUPABASE CAFE_DAILY_ARCHIVES INSERT PASSED 100% ===");
}

testSupabaseRealArchiveInsert();
