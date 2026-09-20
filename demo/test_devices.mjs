import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

function parseEnv() {
  const content = fs.readFileSync('.env', 'utf8');
  const env = {};
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      env[match[1]] = match[2].trim().replace(/^["']|["']$/g, '');
    }
  });
  return env;
}

const env = parseEnv();
console.log("Supabase URL:", env.VITE_SUPABASE_URL ? "Found" : "Missing");
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase.from('devices').select('*');
  console.log("Error:", error);
  console.log("Data count:", data ? data.length : null);
}

test().catch(err => console.error("Unhandled error:", err));
