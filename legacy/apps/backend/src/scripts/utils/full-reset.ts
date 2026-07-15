import { db } from "../../shared/infrastructure/database/client";
import { sql } from "drizzle-orm";

async function fullReset() {
    console.log("🔥 Starting FULL Reset (Clearing EVERYTHING including Accounts, Roles, and Users)...");

    try {
        const tablesToClear = [
            "categories",
            "category_variants",
            "suppliers",
            "members",
            "supplier_categories",
            "products",
            "product_variants",
            "product_batches",
            "purchases",
            "purchase_items",
            "sales",
            "sale_items",
            "devices",
            "brands",
            "product_device_compatibility",
            "services",
            "activity_logs",
            "notifications",
            "settings",
            "purchase_returns",
            "purchase_return_items",
            "defective_items",
            "operational_costs",
            "stock_opname_sessions",
            "stock_opname_items",
            "service_tools",
            "service_tool_requests",
            "journals",
            "journal_lines",
            "assets",
            "asset_depreciation_logs",
            "cash_registers",
            "cash_register_transactions",
            "revenue_targets",
            "purchase_payments",
            "period_locks",
            "commission_payments",
            "audit_logs",
            "payment_methods",
            "payment_variants",
            "sale_payments",
            "accounts",
            "account_types",
            "user_roles",
            "users",
            "roles"
        ];

        for (const table of tablesToClear) {
            console.log(`Truncating ${table}...`);
            await db.execute(sql.raw(`TRUNCATE TABLE "${table}" CASCADE`));
        }

        console.log("✅ Full Reset Complete! Database is now empty.");
        process.exit(0);
    } catch (error) {
        console.error("❌ Full Reset failed:", error);
        process.exit(1);
    }
}

fullReset();
