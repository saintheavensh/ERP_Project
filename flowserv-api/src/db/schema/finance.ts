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
