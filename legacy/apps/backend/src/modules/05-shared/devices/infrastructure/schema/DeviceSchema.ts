import { text, timestamp, pgTable, json, primaryKey, index } from "drizzle-orm/pg-core";
import { randomUUID } from "crypto";
import { brands } from "./BrandSchema";
import { products } from "../../../../02-inventory/products/infrastructure/schema/ProductSchema";

const timestamps = () => ({
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
    deletedAt: timestamp("deleted_at"),
});

export const devices = pgTable("devices", {
    id: text("id").primaryKey(), // DEV-XXX or UUID
    brand: text("brand").notNull(),
    series: text("series"),
    model: text("model").notNull(),
    code: text("code"),
    image: text("image"),
    colors: json("colors").$type<string[]>(),
    specs: text("specs"),
    chipset: text("chipset"),
    specifications: json("specifications").$type<Record<string, any>>(),
    tenantId: text("tenant_id").notNull(),
    ...timestamps(),
}, (table) => ({
    tenantIdx: index("devices_tenant_idx").on(table.tenantId),
}));



export const productDeviceCompatibility = pgTable("product_device_compatibility", {
    productId: text("product_id").notNull().references(() => products.id, { onDelete: 'cascade' }),
    deviceId: text("device_id").notNull().references(() => devices.id, { onDelete: 'cascade' }),
    tenantId: text("tenant_id").notNull(),
}, (t) => ({
    pk: primaryKey({ columns: [t.productId, t.deviceId, t.tenantId] }),
    tenantIdx: index("product_device_comp_tenant_idx").on(t.tenantId),
}));


