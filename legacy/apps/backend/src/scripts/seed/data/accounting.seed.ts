/**
 * Accounting Seed
 * Charts of Accounts, Journals, Assets, Cash Registers, Revenue Targets, and Audit Logs
 */
import { db } from "../index";
import {
    accountTypes, accounts, journals, journalLines, assets,
    cashRegisters, revenueTargets, auditLogs
} from "../../../shared/infrastructure/database/schema";
import { USER_IDS, getPastDate } from "./helpers";
import { eq } from "drizzle-orm";

export async function seedAccounting() {
    console.log("Creating accounting chart of accounts...");

    // 1. Account Types
    await db.insert(accountTypes).values([
        { id: "ASSET", name: "Aktiva", normalBalance: "debit" },
        { id: "LIABILITY", name: "Kewajiban", normalBalance: "credit" },
        { id: "EQUITY", name: "Ekuitas", normalBalance: "credit" },
        { id: "REVENUE", name: "Pendapatan", normalBalance: "credit" },
        { id: "EXPENSE", name: "Beban", normalBalance: "debit" },
    ]);

    // 2. Accounts
    await db.insert(accounts).values([
        // Assets (1-XXXX)
        { id: "1-1000", code: "1000", name: "Kas & Bank", typeId: "ASSET", isSystem: true, description: "Akun induk kas" },
        { id: "1-1001", code: "1001", name: "Kas Toko", typeId: "ASSET", parentId: "1-1000", isSystem: true, description: "Kas di toko" },
        { id: "1-2000", code: "2000", name: "Piutang Usaha", typeId: "ASSET", isSystem: true, description: "Piutang pelanggan" },
        { id: "1-3000", code: "3000", name: "Persediaan", typeId: "ASSET", isSystem: true, description: "Stok barang" },
        { id: "1-4000", code: "4000", name: "Aset Tetap", typeId: "ASSET", isSystem: true, description: "Akun induk aset tetap" },
        { id: "1-4001", code: "4001", name: "Peralatan Service", typeId: "ASSET", parentId: "1-4000", isSystem: true, description: "Alat service HP" },
        { id: "1-4002", code: "4002", name: "Furniture & Perlengkapan", typeId: "ASSET", parentId: "1-4000", isSystem: true, description: "Meja, kursi, display" },
        { id: "1-4003", code: "4003", name: "Kendaraan", typeId: "ASSET", parentId: "1-4000", isSystem: true, description: "Motor/Mobil operasional" },
        { id: "1-4004", code: "4004", name: "Bangunan", typeId: "ASSET", parentId: "1-4000", isSystem: true, description: "Ruko/Gedung" },
        { id: "1-4090", code: "4090", name: "Aset Lainnya", typeId: "ASSET", parentId: "1-4000", isSystem: true, description: "Aset tetap lainnya" },
        { id: "1-4099", code: "4099", name: "Akum. Penyusutan", typeId: "ASSET", parentId: "1-4000", isSystem: true, description: "Akumulasi penyusutan (kontra)" },

        // Liabilities (2-XXXX)
        { id: "2-1000", code: "2100", name: "Hutang Usaha", typeId: "LIABILITY", isSystem: true, description: "Hutang ke supplier" },
        { id: "2-2000", code: "2200", name: "Hutang Gaji", typeId: "LIABILITY", isSystem: true, description: "Gaji belum dibayar" },
        { id: "2-3000", code: "2300", name: "Hutang Komisi", typeId: "LIABILITY", isSystem: true, description: "Hutang komisi teknisi pending" },

        // Equity (3-XXXX)
        { id: "3-1000", code: "3100", name: "Modal Pemilik", typeId: "EQUITY", isSystem: true, description: "Modal awal pemilik" },
        { id: "3-2000", code: "3200", name: "Laba Ditahan", typeId: "EQUITY", isSystem: true, description: "Laba periode sebelumnya" },
        { id: "3-3000", code: "3300", name: "Modal Awal (Saldo Awal)", typeId: "EQUITY", isSystem: true, description: "Saldo awal pembukuan" },

        // Revenue (4-XXXX)
        { id: "4-1000", code: "4100", name: "Pendapatan Penjualan", typeId: "REVENUE", isSystem: true, description: "Penjualan barang" },
        { id: "4-2000", code: "4200", name: "Pendapatan Service", typeId: "REVENUE", isSystem: true, description: "Jasa perbaikan HP" },
        { id: "4-3000", code: "4300", name: "Pendapatan Lain-lain", typeId: "REVENUE", isSystem: true, description: "Pendapatan non operasional" },

        // Expenses (5-XXXX)
        { id: "5-1000", code: "5100", name: "HPP (Harga Pokok)", typeId: "EXPENSE", isSystem: true, description: "Akun induk HPP" },
        { id: "5-1001", code: "5101", name: "HPP Penjualan", typeId: "EXPENSE", parentId: "5-1000", isSystem: true, description: "Harga pokok barang terjual" },
        { id: "5-1002", code: "5102", name: "HPP Service", typeId: "EXPENSE", parentId: "5-1000", isSystem: true, description: "Sparepart untuk service" },
        { id: "5-2000", code: "5200", name: "Beban Operasional", typeId: "EXPENSE", isSystem: true, description: "Akun induk beban operasional" },
        { id: "5-2001", code: "5201", name: "Beban Listrik", typeId: "EXPENSE", parentId: "5-2000", isSystem: true, description: "Tagihan listrik" },
        { id: "5-2002", code: "5202", name: "Beban Internet", typeId: "EXPENSE", parentId: "5-2000", isSystem: true, description: "Tagihan internet" },
        { id: "5-2003", code: "5203", name: "Beban Sewa", typeId: "EXPENSE", parentId: "5-2000", isSystem: true, description: "Sewa tempat" },
        { id: "5-2004", code: "5204", name: "Beban Gaji", typeId: "EXPENSE", parentId: "5-2000", isSystem: true, description: "Gaji karyawan" },
        { id: "5-2005", code: "5205", name: "Beban Komisi", typeId: "EXPENSE", parentId: "5-2000", isSystem: true, description: "Komisi teknisi" },
        { id: "5-3000", code: "5300", name: "Beban Penyusutan", typeId: "EXPENSE", isSystem: true, description: "Penyusutan aset tetap" },
    ]);

    console.log("✅ Created chart of accounts (5 types, 32 accounts).");

    // 3. Assets (Fixed Assets)
    /*
    const now = new Date();
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

    await db.insert(assets).values([
        // ... (elided for brevity) ...
    ]);
    console.log("✅ Created 5 fixed assets");
    */

    // 4. Revenue Targets
    /*
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    await db.insert(revenueTargets).values([
       // ...
    ]);
    console.log("✅ Created revenue target for current month");
    */

    // 5. Journals
    /*
    const journalEntries = [
        // ...
    ];

    for (const jrn of journalEntries) {
        // ...
    }
    console.log("✅ Created 4 sample journal entries");
    */

    // 6. Cash Registers
    /*
    const yesterday = getPastDate(1);
    const todayDate = new Date();

    await db.insert(cashRegisters).values({
        // ...
    });

    await db.insert(cashRegisters).values({
        // ...
    });
    console.log("✅ Created 2 cash register entries");
    */

    // 7. Audit Logs
    /*
    await db.insert(auditLogs).values([
        // ...
    ]);
    console.log("✅ Created 3 audit log entries");
    */
}
