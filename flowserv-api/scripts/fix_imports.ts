import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const routesDir = path.join(__dirname, '../src/routes');
const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.ts'));

for (const f of files) {
  const p = path.join(routesDir, f);
  let c = fs.readFileSync(p, 'utf8');
  c = c.replace(/\.\.\/db\/schema\.js/g, '../db/schema/index.js');
  fs.writeFileSync(p, c);
}

// Fix connection.ts
const connPath = path.join(__dirname, '../src/db/connection.ts');
let conn = fs.readFileSync(connPath, 'utf8');
conn = conn.replace(/\.\/schema/g, './schema/index.js');
fs.writeFileSync(connPath, conn);

// Fix drizzle.config.ts
const drizzlePath = path.join(__dirname, '../drizzle.config.ts');
let drizzleConfig = fs.readFileSync(drizzlePath, 'utf8');
drizzleConfig = drizzleConfig.replace(/\.\/src\/db\/schema\.ts/g, './src/db/schema/index.ts');
fs.writeFileSync(drizzlePath, drizzleConfig);

console.log('Imports fixed!');
