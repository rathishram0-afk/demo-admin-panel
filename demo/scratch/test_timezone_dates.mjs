import { sessionService } from '../src/services/sessionService.js';
import { supabase } from '../src/services/supabase.js';

async function testTimezoneDates() {
  console.log("=================================================");
  console.log("TESTING TIMEZONE & DATE CONVERSION IN sessionService");
  console.log("=================================================");

  const { data: walkins } = await supabase.from('walkin_sessions').select('*');

  console.log("\nWalkin Sessions Business Date Evaluation:");
  walkins.forEach(w => {
    const rawStart = w.start_time || w.created_at;
    const rawEnd = w.actual_end_time || w.end_time || w.created_at;
    const busDate = sessionService.getSessionBusinessDate(w);

    console.log(`ID: ${w.id} | SessionCode: ${w.session_code} | Customer: ${w.customer_name} | SessionDateCol: ${w.session_date} | RawStart: ${rawStart} | RawEnd: ${rawEnd} | BusDateResult: ${busDate}`);
  });
}

testTimezoneDates();
