import {
  pgTable,
  uuid,
  text,
  varchar,
  integer,
  decimal,
  timestamp,
  boolean,
  jsonb,
  unique,
  index,
  uniqueIndex,
  primaryKey,
  numeric,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

import { tenants, branches } from './core';

// Alur konfigurasi bebas yang diminta ("label ke printer mana, invoice ke printer mana,
// atau semua ke 1 printer") dicapai lewat printerAssignments — bukan lewat flag/mode khusus.
// Kalau semua documentType di 1 branch menunjuk printerDeviceId yang sama = "1 printer untuk semua".
// Kalau beda-beda = routing per jenis dokumen. Struktur datanya sama, tidak butuh logic spesial.
// ==========================================================

export const printerDevices = pgTable('printer_devices', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  branchId: uuid('branch_id').notNull().references(() => branches.id),
  name: text('name').notNull(), // "Epson TM-T82 - Kasir 1"
  connectionType: varchar('connection_type', { length: 20 }).notNull(), // 'usb' | 'network' | 'serial' | 'os_printer'
  connectionAddress: text('connection_address'), // IP/device path — null kalau 'os_printer' (A4 lewat dialog print browser)
  paperSize: varchar('paper_size', { length: 10 }).notNull(), // '58mm' | '80mm' | 'A4' | dst — properti fisik printer ini
}, (table) => ({
  branchIdx: index('printer_devices_branch_idx').on(table.branchId),
}));

export const printerTemplates = pgTable('printer_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  name: text('name').notNull(), // "Struk Default 80mm", "Label Garansi", "Invoice Resmi A4"
  documentType: varchar('document_type', { length: 30 }).notNull(), // 'receipt' | 'label' | 'invoice_a4' | dst
  paperSize: varchar('paper_size', { length: 10 }).notNull(),
  layoutConfig: jsonb('layout_config').notNull(), // field mana ditampilkan & urutannya — TIDAK PERNAH berisi nilai data transaksi asli
  isDefault: boolean('is_default').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('printer_templates_tenant_idx').on(table.tenantId),
}));

export const printerAssignments = pgTable('printer_assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  branchId: uuid('branch_id').notNull().references(() => branches.id),
  documentType: varchar('document_type', { length: 30 }).notNull(), // samakan dengan printerTemplates.documentType
  printerDeviceId: uuid('printer_device_id').notNull().references(() => printerDevices.id),
  printerTemplateId: uuid('printer_template_id').notNull().references(() => printerTemplates.id),
}, (table) => ({
  branchDocUnique: unique('printer_assignments_branch_doc_unique').on(table.branchId, table.documentType),
}));
