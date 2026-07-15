
import { db } from "../src/db";
import { sales, saleItems, productBatches, products, members, salePayments } from "../src/db/schema";
import { SalesService } from "../src/modules/sales/sales.service";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

const service = new SalesService();

async function run() {
    console.log("Starting Sales Logic Test...");

    // 1. Setup Data
    const productId = "PROD-TEST-" + Date.now();
    const variant = "TestVariant";
    const memberId = "CUST-TEST-" + Date.now();
    const userId = "USR-TEST";

    console.log("Creating Product & Customer...");

    await db.insert(products).values({
        id: productId,
        name: "Test Product",
        code: "SKU-" + Date.now(), // Changed from sku to code
        stock: 10,
        categoryId: "CAT-GENERAL",
        createdAt: new Date()
    });

    await db.insert(productBatches).values({
        id: "BATCH-" + Date.now(),
        productId,
        variant, // Field is variant
        // batchName removed/mapped if schema doesn't have it. Schema has variant.
        supplierName: "Supplier Test",
        initialStock: 10,
        currentStock: 10,
        buyPrice: 1000,
        sellPrice: 2000,
        createdAt: new Date(),
        updatedAt: new Date()
    });

    await db.insert(members).values({
        id: memberId,
        name: "Test Customer",
        phone: "08123456789" + Math.floor(Math.random() * 100),
        creditLimit: 100000,
        debt: 0
    });

    // 2. Execute Sale (Split Payment: Cash 5000, Tempo 5000)
    // Total should be 10000 (5 qty * 2000 price)
    console.log("Executing Sale...");

    try {
        const result = await service.createSale({
            memberId,
            customerName: "Test Customer",
            userId,
            items: [{
                productId,
                variant,
                qty: 5,
                price: 2000
            }],
            payments: [
                { method: "cash", amount: 5000 },
                { method: "tempo", amount: 5000 }
            ],
            notes: "Test Split Payment"
        });

        console.log("Sale Created:", result);

        // 3. Verify Results
        const sale = await db.query.sales.findFirst({
            where: eq(sales.id, result.id),
            with: {
                payments: true
            }
        });

        if (!sale) throw new Error("Sale not found in DB");

        console.log("Sale ID:", sale.id);
        console.log("Payment Status:", sale.paymentStatus); // Should be 'partial'
        console.log("Payment Method Str:", sale.paymentMethod); // Should be 'mixed'

        if (sale.paymentStatus !== "partial") console.error("FAILED: Status should be partial");
        if (sale.paymentMethod !== "mixed") console.error("FAILED: Method should be mixed");

        // Verify Debt
        const member = await db.query.members.findFirst({
            where: eq(members.id, memberId)
        });

        console.log("Member Debt:", member?.debt); // Should be 5000

        if (member?.debt !== 5000) console.error("FAILED: Debt should be 5000");

        // Verify Stock
        const batch = await db.query.productBatches.findFirst({
            where: eq(productBatches.productId, productId)
        });
        console.log("Remaining Stock:", batch?.currentStock); // Should be 5

        if (batch?.currentStock !== 5) console.error("FAILED: Stock should be 5");

        console.log("Test Completed.");

    } catch (e) {
        console.error("Test Error:", e);
    }
}

run();
