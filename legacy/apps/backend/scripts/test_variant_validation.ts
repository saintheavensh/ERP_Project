
console.log("DB URL:", process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/:[^:]+@/, ":***@") : "UNDEFINED");

// Dynamic import to ensure env vars are loaded before db connection
const { db } = await import("../src/db");
const { suppliers, categories, categoryVariants, products, users } = await import("../src/db/schema");
const { generateId, ID_PREFIX } = await import("../src/lib/utils");

const BASE_URL = "http://localhost:4000";

async function run() {
    try {
        console.log("🚀 Starting Variant Validation Test...");


        // 1. Setup Data via DB (Bypass API to avoid validation/permission noise)
        console.log("1. Seeding Test Data...");

        const suppAId = "SUP-TEST-A-" + Date.now();
        const suppBId = "SUP-TEST-B-" + Date.now();
        const catId = "CAT-TEST-" + Date.now();
        const prodId = "PRD-TEST-" + Date.now();
        const varName = "ExclusiveVar";

        // Create Suppliers
        await db.insert(suppliers).values([
            { id: suppAId, name: "Supplier A" },
            { id: suppBId, name: "Supplier B" }
        ]);

        // Create Category
        await db.insert(categories).values({
            id: catId,
            name: "Test Cat " + Date.now()
        });

        // Create Variant Template (Linked to Supplier A)
        await db.insert(categoryVariants).values({
            categoryId: catId,
            name: varName,
            supplierId: suppAId
        });

        // Create Product
        await db.insert(products).values({
            id: prodId,
            name: "Test Product " + Date.now(),
            categoryId: catId,
            stock: 100,
            minStock: 5
        });

        console.log("✅ Seed Data Created.");

        // 2. Login to get token for API calls
        console.log("2. Logging in...");
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: "superadmin", password: "password123" })
        });
        if (!loginRes.ok) {
            console.error("Login failed:", await loginRes.text());
            process.exit(1);
        }
        const loginData = await loginRes.json();
        const token = loginData.data?.token;
        if (!token) {
            console.error("No token in response", loginData);
            process.exit(1);
        }
        const headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        };

        // 3. Test PO 1: Supplier A (Should Pass)
        console.log("3. Testing PO for Supplier A (Expected: Success)...");
        const payload1 = {
            supplierId: suppAId, // Matches variant owner
            items: [{ productId: prodId, variant: varName, qtyOrdered: 10, estimatedBuyPrice: 1000 }]
        };
        console.log("Payload 1:", JSON.stringify(payload1, null, 2));

        const po1Res = await fetch(`${BASE_URL}/purchases`, {
            method: "POST",
            headers,
            body: JSON.stringify(payload1)
        });

        if (po1Res.ok) {
            console.log("✅ PO 1 Success (Correct)");
            const data = await po1Res.json();
        } else {
            const err = await po1Res.json();
            console.error("❌ PO 1 Failed (Unexpected)", JSON.stringify(err, null, 2));
        }

        // 4. Test PO 2: Supplier B (Should Fail)
        console.log("4. Testing PO for Supplier B (Expected: Failure)...");
        const payload2 = {
            supplierId: suppBId, // DOES NOT match variant owner
            items: [{ productId: prodId, variant: varName, qtyOrdered: 10, estimatedBuyPrice: 1000 }]
        };
        console.log("Payload 2:", JSON.stringify(payload2, null, 2));

        const po2Res = await fetch(`${BASE_URL}/purchases`, {
            method: "POST",
            headers,
            body: JSON.stringify(payload2)
        });

        if (!po2Res.ok) {
            const err = await po2Res.json();
            console.log("✅ PO 2 Failed as expected:", JSON.stringify(err, null, 2));
        } else {
            console.log("❌ PO 2 Succeeded (Unexpected - Should have been blocked)");
            // console.log(await po2Res.json());
        }

        // Cleanup
        // console.log("Cleaning up...");
        // await db.delete(products).where(products.id.eq(prodId)); 

        console.log("Done.");
        process.exit(0);

    } catch (e) {
        console.error("Script error:", e);
        process.exit(1);
    }
}

run();
