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

import { tenants, branches, users } from './core';
import { serviceTickets } from './tickets';
import { inventoryItems } from './inventory';
import { partBrands } from './product_catalog';


export const posInvoices = pgTable('pos_invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  branchId: uuid('branch_id').notNull().references(() => branches.id),
  invoiceNumber: varchar('invoice_number', { length: 50 }).notNull().unique(),
  customerName: text('customer_name'), // Opsional untuk walk-in tunai, wajib untuk tempo
  serviceTicketId: uuid('service_ticket_id').references(() => serviceTickets.id),
  subtotal: numeric('subtotal').notNull().default('0'),
  discountAmount: numeric('discount_amount').notNull().default('0'),
  taxAmount: numeric('tax_amount').notNull().default('0'),
  grandTotal: numeric('grand_total').notNull().default('0'),
  paymentStatus: varchar('payment_status', { length: 20 }).notNull(), // 'unpaid', 'partial', 'paid'
  paymentMethod: varchar('payment_method', { length: 20 }).notNull(), // 'cash', 'transfer', 'qris', 'split', 'tempo'
  createdAt: timestamp('created_at').notNull().defaultNow(),
  createdBy: uuid('created_by').references(() => users.id),
}, (table) => ({
  branchIdx: index('pos_invoices_branch_idx').on(table.branchId),
  ticketIdx: index('pos_invoices_ticket_idx').on(table.serviceTicketId),
}));

export const posInvoiceLines = pgTable('pos_invoice_lines', {
  id: uuid('id').primaryKey().defaultRandom(),
  posInvoiceId: uuid('pos_invoice_id').notNull().references(() => posInvoices.id),
  inventoryItemId: uuid('inventory_item_id').notNull().references(() => inventoryItems.id),
  partBrandId: uuid('part_brand_id').references(() => partBrands.id),
  quantity: integer('quantity').notNull(),
  unitPrice: decimal('unit_price', { precision: 12, scale: 2 }).notNull(),
  subtotal: decimal('subtotal', { precision: 12, scale: 2 }).notNull(),
});

export const posDrafts = pgTable('pos_drafts', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  branchId: uuid('branch_id').notNull().references(() => branches.id),
  name: varchar('name', { length: 100 }).notNull(),
  cartItems: jsonb('cart_items').notNull(), // array of { inventoryItemId, quantity, unitPrice, name, sku }
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
