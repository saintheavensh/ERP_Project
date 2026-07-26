import * as dotenv from 'dotenv';
import * as fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { db } from '../connection';
import { deviceBrands, deviceModels } from '../schema';
import { eq } from 'drizzle-orm';
import { IDS } from './ids';

dotenv.config();

// Real device catalog data (curated specs, NO images per 2026-07-25 decision),
// imported from a static export the owner had -- NOT a live scraper. This is a
// standalone script (`npm run import:devices`), kept out of the `db:seed`
// pipeline so plain `db:seed` / unit tests stay fast with only the 5 curated
// models. It IS chained into `db:reset` (after db:seed) so the normal dev/pilot
// workflow gets the full ~1780-model catalog for real autocomplete + sparepart
// compatibility. Safe to re-run: brands are found-or-created by name, models
// are skipped if a (brand, name) pair already exists.
//
// data/devices-catalog.json was derived from the owner's "devices_export (1).xlsx"
// by scripts-convert-devices.py (openpyxl) -- not the `xlsx` npm package, which
// carries unpatched high-severity CVEs (prototype pollution, ReDoS) not worth
// adding for a single local import. The xlsx itself is gitignored (provenance).

interface RawDevice {
  brand: string;
  model: string;
  imageUrl: string | null;
  specs: Record<string, string> | null;
}

const dataPath = fileURLToPath(new URL('./data/devices-catalog.json', import.meta.url));
const devicesRaw: RawDevice[] = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// The source "Brand" column is inconsistently cased ("apple" vs "Samsung");
// display casing is normalized here at the import boundary, not in the raw
// extracted JSON. "vivo" is intentionally left as-is -- that IS the brand's
// real stylization, not a data bug (unlike "apple").
function normalizeBrandName(name: string): string {
  return name === 'apple' ? 'Apple' : name;
}

async function main() {
  const tenantId = IDS.tenantMain;

  const uniqueBrandNames = [...new Set(devicesRaw.map((d) => normalizeBrandName(d.brand)))];

  const existingBrands = await db.select().from(deviceBrands).where(eq(deviceBrands.tenantId, tenantId));
  const brandIdByName = new Map(existingBrands.map((b) => [b.name, b.id]));

  for (const name of uniqueBrandNames) {
    if (!brandIdByName.has(name)) {
      const [created] = await db.insert(deviceBrands).values({ tenantId, name }).returning();
      brandIdByName.set(name, created.id);
      console.log(`Created brand: ${name}`);
    }
  }

  const existingModels = await db
    .select({ deviceBrandId: deviceModels.deviceBrandId, name: deviceModels.name })
    .from(deviceModels);
  const existingKeys = new Set(existingModels.map((m) => `${m.deviceBrandId}|${m.name.toLowerCase()}`));

  const toInsert: Array<typeof deviceModels.$inferInsert> = [];
  const seenInBatch = new Set<string>();
  for (const d of devicesRaw) {
    const brandId = brandIdByName.get(normalizeBrandName(d.brand))!;
    const key = `${brandId}|${d.model.toLowerCase()}`;
    if (existingKeys.has(key) || seenInBatch.has(key)) continue;
    seenInBatch.add(key);
    toInsert.push({
      deviceBrandId: brandId,
      name: d.model,
      // Foto katalog bulk (30MB) sengaja tidak dishipkan (keputusan 2026-07-25,
      // opsi a): data specs cukup untuk autocomplete intake + kompatibilitas
      // sparepart. Gambar ditambahkan on-demand per model lewat fitur ImageUpload.
      imageUrl: null,
      specs: d.specs,
    });
  }

  const skipped = devicesRaw.length - toInsert.length;
  console.log(`Importing ${toInsert.length} device models (${skipped} already present, skipped)...`);

  const CHUNK = 200;
  for (let i = 0; i < toInsert.length; i += CHUNK) {
    await db.insert(deviceModels).values(toInsert.slice(i, i + CHUNK));
  }

  console.log('Done.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
