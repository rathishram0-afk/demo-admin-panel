import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Load .env
const envText = fs.readFileSync('.env', 'utf8');
const env = {};
envText.split('\n').forEach(line => {
  const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function testWalkinInsert() {
  console.log("Testing dummy insert into walkin_sessions to check column existence...");
  
  const dummyRecord = {
    session_code: 'TEST-000',
    customer_name: 'Test Customer',
    mobile_number: '9999999999',
    device_id: 'PS5-1',
    device_name: 'PS5 - 1',
    device_type: 'PlayStation 5',
    player_count: 2,
    planned_duration: 60,
    hourly_price: 100,
    total_amount: 200,
    gaming_charge: 200,
    original_gaming_amount: 200,
    discount_amount: 0,
    payment_method: 'Cash',
    session_status: 'Completed'
  };

  const { data, error } = await supabase.from('walkin_sessions').insert([dummyRecord]).select();
  console.log("Insert result data:", data);
  console.log("Insert error:", error);

  if (data && data.length > 0) {
    // clean up dummy
    await supabase.from('walkin_sessions').delete().eq('session_code', 'TEST-000');
  }
}

testWalkinInsert().catch(console.error);
