import {
  pgTable,
  uuid,
  text,
  varchar,
  integer,
  timestamp,
  boolean,
  jsonb,
  unique,
  index,
  uniqueIndex,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

import { tenants, branches, users } from './core';
import { serviceTickets } from './tickets';
import { inventoryItems } from './inventory';
import { partBrands } from './product_catalog';
import { invoiceStatusEnum, paymentMethodEnum, paymentStatusEnum } from './enums';
import { money } from './columns';


export const posInvoices = pgTable('pos_invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  branchId: uuid('branch_id').notNull().references(() => branches.id),
  invoiceNumber: varchar('invoice_number', { length: 50 }).notNull(),
  customerName: text('customer_name'), // Opsional untuk walk-in tunai, wajib untuk tempo
  serviceTicketId: uuid('service_ticket_id').references(() => serviceTickets.id),
  subtotal: money('subtotal').notNull().default('0'),
  discountAmount: money('discount_amount').notNull().default('0'),
  taxAmount: money('tax_amount').notNull().default('0'),
  grandTotal: money('grand_total').notNull().default('0'),
  status: invoiceStatusEnum('status').notNull().default('active'), // document lifecycle — separate from payment
  paymentStatus: paymentStatusEnum('payment_status').notNull(),
  paymentMethod: paymentMethodEnum('payment_method').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid('created_by').references(() => users.id),
}, (table) => ({
  branchIdx: index('pos_invoices_branch_idx').on(table.branchId),
  ticketIdx: index('pos_invoices_ticket_idx').on(table.serviceTicketId),
  // Per-tenant uniqueness, not global — two tenants issuing the same day's
  // sequence number is expected, not a collision. See invoiceSequences below.
  tenantInvoiceNumberUnique: unique('pos_invoices_tenant_invoice_number_unique').on(table.tenantId, table.invoiceNumber),
}));

export const posInvoiceLines = pgTable('pos_invoice_lines', {
  id: uuid('id').primaryKey().defaultRandom(),
  posInvoiceId: uuid('pos_invoice_id').notNull().references(() => posInvoices.id),
  inventoryItemId: uuid('inventory_item_id').notNull().references(() => inventoryItems.id),
  partBrandId: uuid('part_brand_id').references(() => partBrands.id),
  quantity: integer('quantity').notNull(),
  unitPrice: money('unit_price').notNull(),
  subtotal: money('subtotal').notNull(),
});

// Per-tenant, per-day counter for invoice numbering. Allocated with
// INSERT ... ON CONFLICT DO UPDATE ... RETURNING inside the checkout
// transaction — atomic, so concurrent checkouts can never receive the same
// number without needing extra row locking.
export const invoiceSequences = pgTable('invoice_sequences', {
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  dateKey: varchar('date_key', { length: 8 }).notNull(), // YYYYMMDD
  lastNumber: integer('last_number').notNull().default(0),
}, (table) => ({
  pk: primaryKey({ columns: [table.tenantId, table.dateKey] }),
}));

export const posDrafts = pgTable('pos_drafts', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  branchId: uuid('branch_id').notNull().references(() => branches.id),
  name: varchar('name', { length: 100 }).notNull(),
  cartItems: jsonb('cart_items').notNull(), // array of { inventoryItemId, quantity, unitPrice, name, sku }
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
