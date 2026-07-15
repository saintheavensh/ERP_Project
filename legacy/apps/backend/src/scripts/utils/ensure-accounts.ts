
import { db } from "../../shared/infrastructure/database/client";
import { accounts, accountTypes } from "../../shared/infrastructure/database/schema";
import { eq, inArray } from "drizzle-orm";

async function main() {
    console.log("Checking for missing default accounts...");

    // 1. Ensure Account Types exist first (dependency)
    const requiredTypes = [
        { id: "ASSET", name: "Aktiva", normalBalance: "debit" },
        { id: "LIABILITY", name: "Kewajiban", normalBalance: "credit" },
        { id: "EQUITY", name: "Ekuitas", normalBalance: "credit" },
        { id: "REVENUE", name: "Pendapatan", normalBalance: "credit" },
        { id: "EXPENSE", name: "Beban", normalBalance: "debit" },
    ];

    for (const type of requiredTypes) {
        const typeExists = await db.select().from(accountTypes).where(eq(accountTypes.id, type.id));
        if (typeExists.length === 0) {
            console.log(`Creating missing account type: ${type.id}`);
            await db.insert(accountTypes).values(type as any);
        }
    }

    // 2. Ensure Accounts exist
    const requiredAccounts = [
        // Assets
        { id: "1-1000", code: "1000", name: "Kas & Bank", typeId: "ASSET", description: "Akun induk kas" },
        { id: "1-1001", code: "1001", name: "Kas Toko", typeId: "ASSET", parentId: "1-1000", description: "Kas di toko" },
        { id: "1-1002", code: "1002", name: "Bank BCA", typeId: "ASSET", parentId: "1-1000", description: "Rekening BCA" },
        { id: "1-2000", code: "2000", name: "Piutang Usaha", typeId: "ASSET", description: "Piutang pelanggan" },
        { id: "1-3000", code: "3000", name: "Persediaan", typeId: "ASSET", description: "Stok barang" },
        { id: "1-4000", code: "4000", name: "Aset Tetap", typeId: "ASSET", description: "Akun induk aset tetap" },
        { id: "1-4001", code: "4001", name: "Peralatan Service", typeId: "ASSET", parentId: "1-4000", description: "Alat service HP" },
        { id: "1-4002", code: "4002", name: "Furniture & Perlengkapan", typeId: "ASSET", parentId: "1-4000", description: "Meja, kursi, display" },
        { id: "1-4099", code: "4099", name: "Akum. Penyusutan", typeId: "ASSET", parentId: "1-4000", description: "Akumulasi penyusutan (kontra)" },

        // Liabilities
        { id: "2-1000", code: "2100", name: "Hutang Usaha", typeId: "LIABILITY", description: "Hutang ke supplier" },
        { id: "2-2000", code: "2200", name: "Hutang Gaji", typeId: "LIABILITY", description: "Gaji belum dibayar" },

        // Equity (Target Logic)
        { id: "3-1000", code: "3100", name: "Modal Pemilik", typeId: "EQUITY", description: "Modal awal pemilik" },
        { id: "3-3000", code: "3000", name: "Modal Awal (Saldo Awal)", typeId: "EQUITY", description: "Saldo Awal Pembukaan" },

        // Expenses
        { id: "5-3000", code: "5300", name: "Beban Penyusutan", typeId: "EXPENSE", description: "Penyusutan aset tetap" },
    ];

    for (const acc of requiredAccounts) {
        const accExists = await db.select().from(accounts).where(eq(accounts.id, acc.id));
        if (accExists.length === 0) {
            console.log(`Creating missing account: ${acc.id} (${acc.name})`);
            await db.insert(accounts).values(acc as any);
        } else {
            console.log(`Account exists: ${acc.id}`);
        }
    }

    console.log("Account verification complete.");
    process.exit(0);
}

main();
