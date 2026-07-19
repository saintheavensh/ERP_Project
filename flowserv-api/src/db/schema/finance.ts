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
import { serviceTickets } from './tickets';


export const posTransactions = pgTable('pos_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  branchId: uuid('branch_id').notNull().references(() => branches.id),
  serviceTicketId: uuid('service_ticket_id').unique().references(() => serviceTickets.id), // null = retail langsung
  status: varchar('status', { length: 20 }).notNull().default('draft'),
  totalAmount: decimal('total_amount', { precision: 14, scale: 2 }).notNull().default('0'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  tenantBranchIdx: index('pos_transactions_tenant_branch_idx').on(table.tenantId, table.branchId),
}));

export const invoiceLines = pgTable('invoice_lines', {
  id: uuid('id').primaryKey().defaultRandom(),
  posTransactionId: uuid('pos_transaction_id').notNull().references(() => posTransactions.id),
  description: text('description').notNull(),
  quantity: integer('quantity').notNull().default(1),
  unitPrice: decimal('unit_price', { precision: 14, scale: 2 }).notNull(),
  sourceType: varchar('source_type', { length: 20 }).notNull(), // "part" | "labor" | "fee"
});

export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  posTransactionId: uuid('pos_transaction_id').notNull().references(() => posTransactions.id),
  method: varchar('method', { length: 20 }).notNull(), // cash, qris, card, transfer
  amount: decimal('amount', { precision: 14, scale: 2 }).notNull(),
  paidAt: timestamp('paid_at').notNull().defaultNow(),
});

export const financeLedgerEntries = pgTable('finance_ledger_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  branchId: uuid('branch_id').notNull().references(() => branches.id),
  entryType: varchar('entry_type', { length: 20 }).notNull(), // "cogs" | "revenue" | "adjustment" | "loss"
  amount: decimal('amount', { precision: 14, scale: 2 }).notNull(),
  referenceType: varchar('reference_type', { length: 30 }),
  referenceId: uuid('reference_id'),
  postedAt: timestamp('posted_at').notNull().defaultNow(),
}, (table) => ({
  tenantBranchIdx: index('finance_ledger_entries_tenant_branch_idx').on(table.tenantId, table.branchId),
}));
