
import { db } from "../src/db";
import { products, productBatches } from "../src/db/schema";
import { SalesService } from "../src/modules/sales/sales.service";

const service = new SalesService();

async function run() {
    console.log("Starting FIFO Logic Test...");

    const productId = "PROD-FIFO-" + Date.now();
    const variant = "Standard";
    const userId = "USR-TEST-FIFO";

    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 2); // 2 Days ago

    const newDate = new Date(); // Now

    // 1. Create Product & Batches
    // Batch 1: Old (Stock 5)
    await db.insert(products).values({
        id: productId,
        name: "FIFO Product",
        code: "FIFO-" + Date.now(),
        stock: 15, // Total
        categoryId: "CAT-GENERAL",
        createdAt: new Date()
    });

    await db.insert(productBatches).values({
        id: "BATCH-OLD-" + Date.now(),
        productId,
        variant,
        supplierName: "Sup A",
        initialStock: 5,
        currentStock: 5,
        buyPrice: 1000,
        sellPrice: 2000,
        createdAt: oldDate,
        updatedAt: oldDate
    });

    // Batch 2: New (Stock 10)
    await db.insert(productBatches).values({
        id: "BATCH-NEW-" + Date.now(),
        productId,
        variant,
        supplierName: "Sup A",
        initialStock: 10,
        currentStock: 10,
        buyPrice: 1200, // Higher price
        sellPrice: 2500,
        createdAt: newDate,
        updatedAt: newDate
    });

    console.log("Product & Batches created.");

    // 2. Execute Sale (Qty 8)
    // Should take 5 from Old, 3 from New
    console.log("Executing Sale Qty 8...");

    try {
        const result = await service.createSale({
            userId,
            items: [{
                productId,
                variant,
                qty: 8,
                price: 2500
            }],
            payments: [{ method: "cash", amount: 20000 }]
        });

        console.log("Sale Created:", result);
        console.log("Test Completed.");

    } catch (e) {
        console.error("Test Error:", e);
    }
}

run();
