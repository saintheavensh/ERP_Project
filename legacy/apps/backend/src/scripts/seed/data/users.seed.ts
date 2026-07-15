/**
 * Users, Roles, and Settings Seed
 */
import { db } from "../index";
import { users, roles, settings } from "../../../shared/infrastructure/database/schema";
import { USER_IDS } from "./helpers";

export async function seedUsers() {
    console.log("Creating roles and users...");

    // Roles
    await db.insert(roles).values([
        { id: "admin", name: "Administrator", tenantId: "system" },
        { id: "teknisi", name: "Technician", tenantId: "system" },
        { id: "kasir", name: "Cashier", tenantId: "system" }
    ]);

    // Hash password
    const pw = await Bun.password.hash("123456");

    // Users
    await db.insert(users).values([
        { id: USER_IDS.admin, username: "admin", password: pw, name: "Super Admin", role: "admin", isActive: true, tenantId: "system", email: "admin@system.com" },
        { id: USER_IDS.teknisi1, username: "teknisi", password: pw, name: "Budi Teknisi", role: "teknisi", isActive: true, tenantId: "system", email: "teknisi@system.com" },
        { id: USER_IDS.teknisi2, username: "teknisi2", password: pw, name: "Andi Junior", role: "teknisi", isActive: true, tenantId: "system", email: "teknisi2@system.com" },
        { id: USER_IDS.kasir, username: "kasir", password: pw, name: "Siti Kasir", role: "kasir", isActive: true, tenantId: "system", email: "kasir@system.com" },
    ]);

    console.log("✅ Created 3 roles and 4 users.");
}

export async function seedSettings() {
    console.log("Configuring application settings...");

    await db.insert(settings).values([
        {
            key: "store",
            tenantId: "system",
            value: {
                name: "iFix Store & Service",
                address: "Jl. Teknologi No. 88, Jakarta Digital Valley",
                phone: "0812-3456-7890",
                website: "www.ifixstore.com",
            }
        },
        {
            key: "service",
            tenantId: "system",
            value: {
                commissionModel: "completion",
                enableVirtualArchive: true,
                autoCloseAfterDays: 30,
                enableLiquidation: true,
                archiveExclusions: ["dikerjakan", "konfirmasi"],
                warrantyPresets: [
                    { label: "7 Hari", value: "7_days" },
                    { label: "14 Hari", value: "14_days" },
                    { label: "30 Hari", value: "30_days" },
                    { label: "90 Hari", value: "90_days" }
                ],
                defaultWarranty: "30_days"
            }
        }
    ]);

    console.log("✅ Created application settings.");
}
