/**
 * Sales, Sale Items, and Payments Seed
 */
import { db } from "../index";
import { sales, saleItems, salePayments, members, paymentMethods, paymentVariants } from "../../../shared/infrastructure/database/schema";
import { USER_IDS, PRODUCT_IDS, CATEGORY_IDS, BATCH_IDS, getPastDate, randomPhone } from "./helpers";

export async function seedSales() {
    console.log("Creating payment methods...");

    // Methods
    const pmCashId = "PM-CASH";
    const pmTransferId = "PM-TRANSFER";
    const pmEdcId = "PM-EDC";
    const pmQrisId = "PM-QRIS";

    await db.insert(paymentMethods).values([
        { id: pmCashId, name: "Tunai", type: "cash", enabled: true, tenantId: "system" },
        { id: pmTransferId, name: "Transfer Bank", type: "transfer", enabled: true, tenantId: "system" },
        { id: pmEdcId, name: "EDC / Debit", type: "custom", enabled: true, tenantId: "system" },
        { id: pmQrisId, name: "QRIS", type: "qris", enabled: true, tenantId: "system" },
    ]);

    // Variants (Banks)
    await db.insert(paymentVariants).values([
        { id: "PV-BCA", methodId: pmTransferId, name: "BCA", enabled: true, tenantId: "system" },
        { id: "PV-MANDIRI", methodId: pmTransferId, name: "Mandiri", enabled: true, tenantId: "system" },
        { id: "PV-EDC-BCA", methodId: pmEdcId, name: "EDC BCA", enabled: true, tenantId: "system" },
    ]);

    console.log("Creating members...");

    const mem1Id = "MEM-001";
    await db.insert(members).values([
        { id: mem1Id, name: "Pelanggan Setia", phone: randomPhone(), discountPercent: 5, createdAt: getPastDate(100), tenantId: "system" },
        { id: "MEM-002", name: "Joko Santoso", phone: randomPhone(), createdAt: getPastDate(30), tenantId: "system" },
    ]);

    console.log("Creating sales transactions...");

    // Sale 1: Case & TG (Cash)
    const sal1Id = "SAL-TEST-001";
    await db.insert(sales).values({
        id: sal1Id,
        createdAt: getPastDate(5),
        paymentMethod: "cash",
        paymentStatus: "paid",
        discountAmount: 0,
        totalAmount: 60000,
        userId: USER_IDS.kasir,
        notes: "Walk-in customer",
        tenantId: "system",
    });

    await db.insert(saleItems).values([
        { saleId: sal1Id, productId: PRODUCT_IDS.caseClear, batchId: BATCH_IDS.caseA, qty: 1, price: 35000, tenantId: "system" },
        { saleId: sal1Id, productId: PRODUCT_IDS.tempered, batchId: BATCH_IDS.tgA, qty: 1, price: 25000, tenantId: "system" },
    ]);

    await db.insert(salePayments).values({
        saleId: sal1Id,
        methodId: pmCashId,
        method: "Tunai",
        amount: 60000,
        tenantId: "system",
    });

    // Sale 2: Batere Replacement (Part Only) - Transfer
    const sal2Id = "SAL-TEST-002";
    await db.insert(sales).values({
        id: sal2Id,
        createdAt: getPastDate(2),
        paymentMethod: "transfer",
        paymentStatus: "paid",
        discountAmount: 0,
        totalAmount: 200000,
        userId: USER_IDS.kasir,
        tenantId: "system",
    });

    await db.insert(saleItems).values([
        { saleId: sal2Id, productId: PRODUCT_IDS.batreIpX, batchId: BATCH_IDS.batreIpXA, qty: 1, price: 200000, tenantId: "system" },
    ]);

    await db.insert(salePayments).values({
        saleId: sal2Id,
        methodId: pmTransferId,
        method: "Transfer Bank",
        variantId: "PV-BCA",
        amount: 200000,
        reference: "TRF-123456",
        tenantId: "system",
    });

    // Add 8 more dummy sales to total 10
    for (let i = 3; i <= 10; i++) {
        const sId = `SAL-DUMMY-00${i}`;
        await db.insert(sales).values({
            id: sId,
            createdAt: getPastDate(i), // varied dates
            paymentMethod: "cash",
            paymentStatus: "paid",
            totalAmount: 50000,
            userId: USER_IDS.kasir,
            tenantId: "system",
        });

        // Just sell TG
        await db.insert(saleItems).values({
            saleId: sId,
            productId: PRODUCT_IDS.tempered,
            batchId: BATCH_IDS.tgA,
            qty: 2,
            price: 25000,
            tenantId: "system",
        });

        await db.insert(salePayments).values({
            saleId: sId,
            methodId: pmCashId,
            method: "Tunai",
            amount: 50000,
            tenantId: "system",
        });
    }

    console.log("✅ Created 10 sales transactions.");
}
