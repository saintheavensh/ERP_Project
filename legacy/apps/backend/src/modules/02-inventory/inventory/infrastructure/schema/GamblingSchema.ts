import { text, integer, timestamp, date, pgTable, jsonb, index } from "drizzle-orm/pg-core";
import { users } from "../../../../05-shared/users/infrastructure/schema/UserSchema";
import { suppliers } from "../../../../01-purchases/suppliers/infrastructure/schema/SupplierSchema";
import { services } from "../../../../03-sales/service/infrastructure/schema/ServiceSchema";
import { productBatches } from "./BatchSchema";
import { randomUUID } from "crypto";

export const deadPhonePurchases = pgTable("dead_phone_purchases", {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    deviceName: text("device_name").notNull(),
    imei: text("imei"),
    purchasePrice: integer("purchase_price").notNull(),
    purchaseDate: date("purchase_date").notNull(),
    supplierId: text("supplier_id").references(() => suppliers.id),
    suspectedIssue: text("suspected_issue"),
    visualCondition: text("visual_condition"),
    status: text("status", { enum: ["STORED", "TESTED", "HARVESTED"] }).default("STORED"),
    storageLocation: text("storage_location"),
    tenantId: text("tenant_id").notNull(),
    createdAt: timestamp("created_at").defaultNow()
}, (table) => ({
    tenantIdx: index("dead_phone_purchases_tenant_idx").on(table.tenantId),
}));

export const gamblingTestLogs = pgTable("gambling_test_logs", {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    deadPhoneId: text("dead_phone_id").references(() => deadPhonePurchases.id),
    triggerServiceId: text("trigger_service_id").references(() => services.id),
    testDate: timestamp("test_date").defaultNow(),
    technicianId: text("technician_id").references(() => users.id),
    testResults: jsonb("test_results"),
    verdict: text("verdict", { enum: ["REPAIRABLE", "KANIBAL", "DEAD"] }),
    notes: text("notes"),
    tenantId: text("tenant_id").notNull(),
}, (table) => ({
    tenantIdx: index("gambling_test_logs_tenant_idx").on(table.tenantId),
}));

export const forfeitedDevices = pgTable("forfeited_devices", {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    serviceId: text("service_id").references(() => services.id),
    deviceName: text("device_name"),
    forfeitedDate: date("forfeited_date").notNull(),
    status: text("status", { enum: ["UTUH", "HARVESTED"] }).default("UTUH"),
    notes: text("notes"),
    tenantId: text("tenant_id").notNull(),
}, (table) => ({
    tenantIdx: index("forfeited_devices_tenant_idx").on(table.tenantId),
}));

export const partHarvestLogs = pgTable("part_harvest_log", {
    id: text("id").primaryKey().$defaultFn(() => randomUUID()),
    forfeitedDeviceId: text("forfeited_device_id").references(() => forfeitedDevices.id),
    deadPhoneId: text("dead_phone_id").references(() => deadPhonePurchases.id),
    partType: text("part_type").notNull(),
    partCondition: text("part_condition"),
    targetServiceId: text("target_service_id").references(() => services.id),
    technicianId: text("technician_id").references(() => users.id),
    harvestDate: timestamp("harvest_date").defaultNow(),
    newBatchId: text("new_batch_id").references(() => productBatches.id),
    notes: text("notes"),
    tenantId: text("tenant_id").notNull(),
}, (table) => ({
    tenantIdx: index("part_harvest_log_tenant_idx").on(table.tenantId),
}));
