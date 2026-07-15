import { db } from "../../shared/infrastructure/database/client";
import { brands, devices } from "../../shared/infrastructure/database/schema";
import { eq, sql } from "drizzle-orm";

/**
 * Normalize brand name: capitalize first letter, rest lowercase
 */
function normalizeBrandName(name: string): string {
    if (!name || name.trim().length === 0) return name;
    const trimmed = name.trim();
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

async function main() {
    console.log("🔄 Starting brand normalization...");

    try {
        // 1. Get all brands
        const allBrands = await db.select().from(brands);
        console.log(`📦 Found ${allBrands.length} brands to process`);

        // 2. Group brands by normalized name (case-insensitive)
        const brandGroups = new Map<string, typeof allBrands>();
        
        for (const brand of allBrands) {
            const normalized = normalizeBrandName(brand.name);
            const key = normalized.toLowerCase();
            
            if (!brandGroups.has(key)) {
                brandGroups.set(key, []);
            }
            brandGroups.get(key)!.push(brand);
        }

        let updatedBrands = 0;
        let updatedDevices = 0;
        let mergedBrands = 0;

        // 3. Process each group
        for (const [normalizedKey, group] of brandGroups) {
            if (group.length === 0) continue;

            const normalizedName = normalizeBrandName(group[0].name);
            
            // If all brands in group already have normalized name, skip
            if (group.every(b => b.name === normalizedName)) {
                continue;
            }

            // Find the brand with normalized name, or use the first one
            let targetBrand = group.find(b => b.name === normalizedName) || group[0];
            
            // Update target brand name if needed
            if (targetBrand.name !== normalizedName) {
                await db.update(brands)
                    .set({ name: normalizedName })
                    .where(eq(brands.id, targetBrand.id));
                updatedBrands++;
                targetBrand.name = normalizedName; // Update in memory for device updates
            }

            // Update all devices using brands from this group to use target brand
            for (const brand of group) {
                if (brand.id === targetBrand.id) continue; // Skip target brand itself
                
                // Update devices to use normalized brand name
                // Note: devices.brand is a text field, so we use SQL for case-insensitive matching
                const result = await db.execute(
                    sql`UPDATE devices SET brand = ${normalizedName} WHERE LOWER(brand) = LOWER(${brand.name})`
                );
                
                // Get count of affected rows (PostgreSQL returns rowCount)
                updatedDevices += (result as any).rowCount || 0;

                // Delete duplicate brand (if not the target)
                await db.delete(brands).where(eq(brands.id, brand.id));
                mergedBrands++;
            }
        }

        console.log(`✅ Normalization complete!`);
        console.log(`   - Updated ${updatedBrands} brand names`);
        console.log(`   - Updated ${updatedDevices} device brand references`);
        console.log(`   - Merged ${mergedBrands} duplicate brands`);

    } catch (error) {
        console.error("❌ Error normalizing brands:", error);
        process.exit(1);
    }
}

main().catch(console.error);

