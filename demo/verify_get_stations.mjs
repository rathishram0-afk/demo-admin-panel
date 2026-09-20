import { sessionService } from './src/services/sessionService.js';
import fs from 'fs';

// Load .env
const envText = fs.readFileSync('.env', 'utf8');
envText.split('\n').forEach(line => {
  const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (m) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
});

async function verify() {
  console.log("Calling sessionService.getStations()...");
  const stations = await sessionService.getStations();
  console.log("Returned stations count:", stations ? stations.length : null);
  if (stations && stations.length > 0) {
    stations.forEach(s => {
      console.log(` - [${s.id}] ${s.name} (${s.zone}) | Status: ${s.status} | Image: ${s.image}`);
    });
  } else {
    console.error("FAILURE: stations array is empty!");
  }
}

verify().catch(console.error);
