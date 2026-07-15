import { pgTable, uuid, varchar, timestamp, jsonb, index } from "drizzle-orm/pg-core";

export const storeDeviceTable = pgTable("store_devices", {
    id: uuid("id").primaryKey().defaultRandom(),
    deviceId: varchar("device_id").unique().notNull(), // External device ID
    name: varchar("name").notNull(),
    type: varchar("type").notNull(), // 'POS', 'SCANNER', 'PRINTER', 'KIOSK'
    storeId: uuid("store_id").notNull(),
    status: varchar("status").notNull().default('OFFLINE'), // 'ONLINE', 'OFFLINE', 'MAINTENANCE'
    lastPingAt: timestamp("last_ping_at").defaultNow(),
    firmwareVersion: varchar("firmware_version"),
    metadata: jsonb("metadata"), // For additional device-specific data
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull()
}, (table) => ({
    storeIdx: index("store_idx").on(table.storeId),
    statusIdx: index("status_idx").on(table.status)
}));

export type StoreDeviceRow = typeof storeDeviceTable.$inferSelect;
export type NewStoreDeviceRow = typeof storeDeviceTable.$inferInsert;
