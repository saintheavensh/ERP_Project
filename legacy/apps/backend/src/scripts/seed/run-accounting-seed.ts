import { seedAccounting } from "./data/accounting.seed";

async function runSeeder() {
    try {
        await seedAccounting();
        console.log("✅ Accounting Seed Complete!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Accounting Seed failed:", error);
        process.exit(1);
    }
}

runSeeder();
