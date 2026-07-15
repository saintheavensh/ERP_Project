
import { db } from "../../shared/infrastructure/database/client";
import { brands, devices } from "../../shared/infrastructure/database/schema";
import { v4 as uuidv4 } from "uuid";
import { sql } from "drizzle-orm";

async function parseCSVLine(text: string): Promise<string[]> {
    const result: string[] = [];
    let current = '';
    let inQuote = false;
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === '"') {
            inQuote = !inQuote;
        } else if (char === ',' && !inQuote) {
            result.push(current);
            current = '';
        } else if (char === '\r') {
            // ignore
        } else {
            current += char;
        }
    }
    result.push(current);
    return result;
}

async function main() {
    console.log("Starting import...");
    const csvPath = "c:\\Users\\Good\\Documents\\web\\cek\\coba\\docs\\phone_dataset .csv";
    const file = Bun.file(csvPath);

    if (!(await file.exists())) {
        console.error(`File not found: ${csvPath}`);
        process.exit(1);
    }

    const text = await file.text();
    const lines = text.split('\n');

    if (lines.length < 2) {
        console.error("CSV is empty or invalid");
        process.exit(1);
    }

    const headers = await parseCSVLine(lines[0]);
    console.log("Headers:", headers);

    const idx = {
        brand: headers.findIndex(h => h.trim() === 'brand'),
        model: headers.findIndex(h => h.trim() === 'model'),
        announced: headers.findIndex(h => h.trim() === 'announced'),
        os: headers.findIndex(h => h.trim() === 'OS'),
        network: headers.findIndex(h => h.trim() === 'network_technology'),
        chipset: headers.findIndex(h => h.trim() === 'Chipset'),
        internal: headers.findIndex(h => h.trim() === 'internal_memory'),
        ram: headers.findIndex(h => h.trim() === 'RAM'),
        colors: headers.findIndex(h => h.trim() === 'colors'),
        img: headers.findIndex(h => h.trim() === 'img_url'),
    };

    console.log("Column mapping:", idx);

    // CLEAR DATABASE
    console.log("Clearing existing data...");
    await db.delete(devices).execute();
    await db.delete(brands).execute();
    console.log("Data cleared.");

    let insertedBrands = 0;
    let insertedDevices = 0;
    const uniqueBrands = new Set<string>();
    const devicesData: any[] = [];

    const ALLOWED_BRANDS = ["samsung", "oppo", "xiaomi", "infinix", "vivo", "apple", "advan", "realme", "asus", "huawei"];
    const MIN_YEAR = 2015;

    console.log(`Processing ${lines.length} lines...`);

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        try {
            const row = await parseCSVLine(line);

            const brandName = row[idx.brand]?.trim();
            const model = row[idx.model]?.trim();

            if (!brandName || !model) continue;

            // FILTER: BRANDS
            if (!ALLOWED_BRANDS.includes(brandName.toLowerCase())) {
                continue;
            }

            // FILTER: YEAR
            const announced = idx.announced !== -1 ? (row[idx.announced] || "") : "";
            const yearMatch = announced.match(/\d{4}/);
            const year = yearMatch ? parseInt(yearMatch[0]) : 0;

            if (year < MIN_YEAR) {
                continue;
            }

            // FILTER: OS
            const os = idx.os !== -1 ? (row[idx.os] || "").toLowerCase() : "";
            if (!os.includes("android") && !os.includes("ios")) {
                continue;
            }

            uniqueBrands.add(brandName);

            const chipset = idx.chipset !== -1 ? (row[idx.chipset]?.trim() || null) : null;
            const internal = idx.internal !== -1 ? row[idx.internal]?.trim() : "";
            const ram = idx.ram !== -1 ? row[idx.ram]?.trim() : "";

            // Format specs
            let specs = internal;
            if (ram) {
                specs = specs ? `${specs} - ${ram}` : ram;
            }

            const colorsRaw = idx.colors !== -1 ? row[idx.colors]?.trim() : "";
            const colors = colorsRaw ? colorsRaw.split('|').map(c => c.trim()).filter(c => c) : [];

            const image = idx.img !== -1 ? (row[idx.img]?.trim() || null) : null;

            // Capture all other columns as specifications
            const specifications: Record<string, any> = {};

            headers.forEach((h, index) => {
                const key = h.trim();
                // Skip columns we already mapped explicitly to main fields (optional, but keeps JSON cleaner)
                // actually simpler to just dump everything or skip the big ones?
                // let's keep everything in specs for completeness, or maybe skip mapped ones.
                // staying consistent: keep everything in specs.
                specifications[key] = row[index]?.trim() || null;
            });

            devicesData.push({
                brandName,
                brandId: brandName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
                model,
                chipset,
                specs,
                colors,
                image,
                specifications
            });
        } catch (e) {
            console.error(`Error parsing line ${i}:`, e);
        }
    }

    console.log(`Found ${uniqueBrands.size} unique brands.`);
    console.log(`Found ${devicesData.length} devices.`);

    // 1. Insert Brands
    for (const brandName of uniqueBrands) {
        const id = brandName.toLowerCase().replace(/[^a-z0-9]/g, '-');
        try {
            await db.insert(brands).values({
                id,
                name: brandName,
            }).onConflictDoNothing().execute();
            insertedBrands++;
            // process.stdout.write('.');
        } catch (e) {
            console.error(`Failed to insert brand ${brandName}:`, e);
        }
    }
    console.log(`\nUpserted ${insertedBrands} brands.`);

    // 2. Insert Devices
    const batchSize = 100;
    for (let i = 0; i < devicesData.length; i += batchSize) {
        const batch = devicesData.slice(i, i + batchSize);
        const values = batch.map(d => ({
            id: uuidv4(),
            brand: d.brandId,
            model: d.model,
            chipset: d.chipset,
            specs: d.specs,
            colors: d.colors,
            image: d.image,
            code: null,
            specifications: d.specifications
        }));

        try {
            await db.insert(devices).values(values).execute();
            insertedDevices += batch.length;
            process.stdout.write('.');
        } catch (e) {
            console.error(`Error batch inserting:`, e);
        }
    }

    console.log(`\nImport complete. Inserted ${insertedDevices} devices.`);
    process.exit(0);
}

main().catch(console.error);
