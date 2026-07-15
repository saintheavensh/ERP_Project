/**
 * Service, Operational Costs, and Notifications Seed
 */
import { db } from "../index";
import { services, operationalCosts, notifications } from "../../../shared/infrastructure/database/schema";
import { USER_IDS, PRODUCT_IDS, BATCH_IDS, getPastDate, genSrvNo, randomPhone, randomCost, randomPick, getMonthDate } from "./helpers";

export async function seedServices() {
    console.log("Creating 120 service records over 3 months...");

    // Arrays for randomization
    // Enum: "antrian", "dicek", "konfirmasi", "dikerjakan", "re-konfirmasi", "selesai", "diambil", "batal"
    const statuses = ["antrian", "dicek", "konfirmasi", "dikerjakan", "selesai", "diambil", "batal"];
    const deviceTypes = [
        { brand: "Apple", model: "iPhone X" },
        { brand: "Apple", model: "iPhone 11" },
        { brand: "Apple", model: "iPhone 13" },
        { brand: "Samsung", model: "Galaxy S21" },
        { brand: "Xiaomi", model: "Redmi Note 10" }
    ];
    const issues = ["LCD Pecah", "Batre Drop", "Mati Total", "No Signal", "Speaker Sember", "Bootloop", "Konektor Cas Rusak"];
    const technicians = [USER_IDS.teknisi1, USER_IDS.teknisi2];

    const servicesPayload = [];

    // Distribute services: M1 (Oldest) to M3 (Newest)
    const distribution = [30, 40, 50];

    for (let month = 1; month <= 3; month++) {
        const count = distribution[month - 1];

        for (let i = 0; i < count; i++) {
            const date = getMonthDate(month as 1 | 2 | 3, Math.floor(Math.random() * 28));
            const status = randomPick(statuses);
            const dev = randomPick(deviceTypes);

            // Logic for status properties
            let diagnosis = null;
            let costEstimate = null;
            let technicianId = null;
            let actualCost = null;
            let completionDate = null; // estimated
            let dateOut = null; // actual pickup
            let parts = null;
            let qc = null;

            if (status !== "antrian") {
                diagnosis = "Kerusakan pada komponen utama, perlu penggantian.";
                costEstimate = randomCost(100000, 1500000);
                technicianId = randomPick(technicians);
            }

            if (["dikerjakan", "selesai", "diambil"].includes(status)) {
                // Add parts used
                if (Math.random() > 0.3) { // 70% use parts
                    parts = [
                        {
                            name: "LCD iPhone X",
                            qty: 1,
                            price: 450000,
                            source: "inventory", // internal stock
                            productId: PRODUCT_IDS.lcdIpX,
                            batchId: BATCH_IDS.lcdIpXA,
                            buyPrice: 250000 // COGS
                        }
                    ];
                }
            }

            if (["selesai", "diambil"].includes(status)) {
                completionDate = new Date(date.getTime() + 86400000 * 2); // estimated done
                actualCost = costEstimate;
                qc = { passed: true, before: [], after: [], notes: "QC OK" };
            }

            if (status === "diambil") {
                dateOut = new Date(date.getTime() + 86400000 * 4); // picked up
            }

            servicesPayload.push({
                no: genSrvNo(date),
                dateIn: date,
                customer: {
                    name: `Customer ${month}-${i}`,
                    phone: randomPhone(),
                    address: "Kota Bandung"
                },
                device: {
                    brand: dev.brand,
                    model: dev.model,
                    equipment: "Unit Only + Sim Tray"
                },
                complaint: randomPick(issues),
                status: status as any,
                technicianId,
                diagnosis,
                costEstimate,
                actualCost,
                parts: parts ? parts : [],  // JSONB
                estimatedCompletionDate: completionDate,
                dateOut: dateOut,
                warrantyExpiryDate: status === "diambil" ? new Date(date.getTime() + 86400000 * 30) : null, // 30 days warranty
                createdBy: USER_IDS.kasir,
                qc: qc,
                tenantId: "system"
            });
        }
    }

    // Force some specific scenarios
    // 1. Service with External Part (Jasa Only + Part Luar)
    servicesPayload.push({
        no: "SRV-EXT-001",
        dateIn: getPastDate(5),
        customer: {
            name: "Budi External",
            phone: randomPhone(),
        },
        device: {
            brand: "Apple",
            model: "iPhone 13 Pro Max",
            equipment: "Fullset"
        },
        complaint: "Ganti IC Audio (Beli sendiri)",
        status: "diambil" as const,
        technicianId: USER_IDS.teknisi1,
        diagnosis: "IC Audio rusak",
        costEstimate: 350000,
        actualCost: 350000,
        parts: [
            {
                name: "IC Audio (Customer Bawa)",
                qty: 1,
                price: 0,
                source: "external"
            }
        ],
        estimatedCompletionDate: getPastDate(1),
        dateOut: new Date(),
        createdBy: USER_IDS.kasir,
        qc: { passed: true, notes: "Tested OK" },
        tenantId: "system"
    });

    // 2. Service Jasa Only
    servicesPayload.push({
        no: "SRV-SVC-001",
        dateIn: getPastDate(3),
        customer: {
            name: "Siti Software",
            phone: randomPhone(),
        },
        device: {
            brand: "Samsung",
            model: "Galaxy S21",
            equipment: "Unit"
        },
        complaint: "Lupa Pola",
        status: "diambil" as const,
        technicianId: USER_IDS.teknisi2,
        diagnosis: "Perlu Flash Ulang",
        costEstimate: 150000,
        actualCost: 150000,
        parts: [],
        estimatedCompletionDate: getPastDate(1),
        dateOut: new Date(),
        createdBy: USER_IDS.kasir,
        qc: { passed: true, notes: "Unlocked" },
        tenantId: "system"
    });

    // Insert manually in chunks if needed, but array insert is fine for ~120 rows
    for (const srv of servicesPayload) {
        await db.insert(services).values(srv);
    }

    console.log(`✅ Created ${servicesPayload.length} services.`);

    // ============================================
    // OPERATIONAL COSTS
    // ============================================
    console.log("Creating 3 months of operational costs...");

    const opsCosts = [
        { month: "2025-11", category: "Listrik", amount: 1200000, desc: "Tagihan PLN Nov" },
        { month: "2025-11", category: "Internet", amount: 350000, desc: "Indihome Nov" },
        { month: "2025-11", category: "Gaji", amount: 8000000, desc: "Gaji Karyawan Nov" },

        { month: "2025-12", category: "Listrik", amount: 1350000, desc: "Tagihan PLN Dec (AC Nyala Terus)" },
        { month: "2025-12", category: "Internet", amount: 350000, desc: "Indihome Dec" },
        { month: "2025-12", category: "Gaji", amount: 8000000, desc: "Gaji Karyawan Dec" },
        { month: "2025-12", category: "Sparepart Luar", amount: 450000, desc: "Beli IC di Toko Sebelah (Darurat)" }, // External spending

        { month: "2026-01", category: "Listrik", amount: 1250000, desc: "Tagihan PLN Jan" },
        { month: "2026-01", category: "Internet", amount: 350000, desc: "Indihome Jan" },
        { month: "2026-01", category: "Gaji", amount: 8500000, desc: "Gaji Karyawan Jan (Naik Gaji)" },
    ];

    for (const cost of opsCosts) {
        await db.insert(operationalCosts).values({
            date: new Date(cost.month + "-01"), // roughly start of month
            category: cost.category,
            amount: cost.amount,
            description: cost.desc,
            userId: USER_IDS.admin,
            tenantId: "system"
        });
    }

    console.log("✅ Created operational costs for 3 months.");

    // Notifications
    await db.insert(notifications).values([
        {
            userId: USER_IDS.teknisi1,
            title: "Service Baru Masuk",
            message: "iPhone X LCD Pecah perlu diagnosa",
            type: "service_update",
            isRead: false,
            tenantId: "system"
        }
    ]);
}
