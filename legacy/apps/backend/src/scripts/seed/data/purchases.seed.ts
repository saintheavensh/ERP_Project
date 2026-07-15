/**
 * Purchases, Purchase Items, and Returns Seed
 */
import { db } from "../index";
import { purchases, purchaseItems, purchaseReturns, purchaseReturnItems, defectiveItems } from "../../../shared/infrastructure/database/schema";
import { SUPPLIER_IDS, PRODUCT_IDS, USER_IDS, BATCH_IDS, getPastDate, getMonthDate } from "./helpers";
import { eq } from "drizzle-orm";

export async function seedPurchases() {
    console.log("Creating purchase transactions...");

    const po1Id = "PO-TEST-001";
    const po2Id = "PO-TEST-002";
    const po3Id = "PO-TEST-003";

    // PO 1: Recent purchase from Global (Paid)
    // 5 LCD X, 5 Batre X
    await db.insert(purchases).values({
        id: po1Id,
        supplierId: SUPPLIER_IDS.global,
        date: getPastDate(5),
        totalAmount: (5 * 250000) + (5 * 100000), // 1.25m + 500k = 1.75m
        notes: "Restock sparepart iPhone X",
        userId: USER_IDS.admin,
        tenantId: "system",
    });

    await db.insert(purchaseItems).values([
        { purchaseId: po1Id, productId: PRODUCT_IDS.lcdIpX, qtyOrdered: 5, qtyReceived: 5, buyPrice: 250000, sellPrice: 450000, tenantId: "system" },
        { purchaseId: po1Id, productId: PRODUCT_IDS.batreIpX, qtyOrdered: 5, qtyReceived: 5, buyPrice: 100000, sellPrice: 200000, tenantId: "system" },
    ]);

    // PO 2: Accessories from Global (Unpaid / Debt)
    // 20 Cases, 40 Tempered
    await db.insert(purchases).values({
        id: po2Id,
        supplierId: SUPPLIER_IDS.global,
        date: getPastDate(10),
        totalAmount: (20 * 10000) + (40 * 5000), // 200k + 200k = 400k
        notes: "Grosir aeseoris, tempo 30 hari",
        userId: USER_IDS.admin,
        tenantId: "system",
    });

    await db.insert(purchaseItems).values([
        { purchaseId: po2Id, productId: PRODUCT_IDS.caseClear, qtyOrdered: 20, qtyReceived: 20, buyPrice: 10000, sellPrice: 35000, tenantId: "system" },
        { purchaseId: po2Id, productId: PRODUCT_IDS.tempered, qtyOrdered: 40, qtyReceived: 40, buyPrice: 5000, sellPrice: 25000, tenantId: "system" },
    ]);

    // PO 3: Unit purchase (Partial)
    // 1 iPhone 13
    await db.insert(purchases).values({
        id: po3Id,
        supplierId: SUPPLIER_IDS.lokal,
        date: getPastDate(2),
        totalAmount: 9000000,
        notes: "DP 5jt sisa COD",
        userId: USER_IDS.admin,
        tenantId: "system",
    });

    await db.insert(purchaseItems).values([
        { purchaseId: po3Id, productId: PRODUCT_IDS.iphone13, qtyOrdered: 1, qtyReceived: 1, buyPrice: 9000000, sellPrice: 10500000, tenantId: "system" }
    ]);

    // Add 2 more for volume
    for (let i = 4; i <= 5; i++) {
        await db.insert(purchases).values({
            id: `PO-OLD-00${i}`,
            supplierId: SUPPLIER_IDS.lokal,
            date: getMonthDate(2, i), // 2 months ago
            totalAmount: 1000000,
            notes: "Historical data",
            userId: USER_IDS.admin,
            tenantId: "system",
        });
    }

    console.log("✅ Created 5 purchases.");

    console.log("Creating purchase returns...");

    const ret1Id = "RET-001";
    // Return 5 tempered glass from PO2 (defective)
    await db.insert(purchaseReturns).values({
        id: ret1Id,
        supplierId: SUPPLIER_IDS.global, // Added missing required field
        userId: USER_IDS.admin,
        date: new Date(),
        notes: "Datang pecah",
        tenantId: "system",
    });

    await db.insert(purchaseReturnItems).values({
        returnId: ret1Id,
        productId: PRODUCT_IDS.tempered,
        batchId: BATCH_IDS.tgA, // Added missing required field
        qty: 5,
        reason: "Broken on arrival",
        tenantId: "system",
    });

    // Also track in Defective Items
    await db.insert(defectiveItems).values({
        id: "DEF-001",
        productId: PRODUCT_IDS.tempered,
        batchId: BATCH_IDS.tgA,
        supplierId: SUPPLIER_IDS.global,
        qty: 5,
        source: "purchase_return",
        sourceRefId: ret1Id,
        reason: "Pecah dari supplier",
        status: "pending",
        tenantId: "system",
    });

    console.log("✅ Created 1 completed return (5 items) + 1 defect record.");
}
