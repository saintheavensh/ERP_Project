import { serve } from '@hono/node-server';
import dotenv from 'dotenv';
import os from 'node:os';
import { app } from './app';

dotenv.config();

const port = process.env.PORT ? parseInt(process.env.PORT) : 3001;
// B2.1 (go-live pilot LAN) — bind ALL interfaces by default so devices on the
// same WiFi can reach the API at http://<host-LAN-IP>:3001. Node already does
// this when hostname is omitted; setting it explicitly (overridable via HOST)
// makes the intent unambiguous and lets us print the LAN URL below.
const hostname = process.env.HOST ?? '0.0.0.0';

// Best-effort: the machine's private LAN IPv4, for a phone-friendly startup hint.
function lanIPv4(): string | null {
  for (const addrs of Object.values(os.networkInterfaces())) {
    for (const a of addrs ?? []) {
      if (a.family === 'IPv4' && !a.internal && /^(192\.168|10\.|172\.(1[6-9]|2\d|3[01]))\./.test(a.address)) {
        return a.address;
      }
    }
  }
  return null;
}

console.log(`FlowServ API starting on ${hostname}:${port}...`);

serve({ fetch: app.fetch, port, hostname }, () => {
  const ip = lanIPv4();
  console.log(`FlowServ API listening on ${hostname}:${port}`);
  console.log(`  Lokal : http://localhost:${port}/v1/health`);
  if (ip) console.log(`  LAN   : http://${ip}:${port}/v1/health  (akses dari HP/tablet di WiFi sama)`);
});
