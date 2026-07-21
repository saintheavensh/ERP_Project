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

import { tenants, branches } from './core';
import { flowTemplates, flowNodes } from './flow';
import { ticketStatusEnum } from './enums';
import { money } from './columns';


export const customers = pgTable('customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  name: text('name').notNull(),
  phone: text('phone'),
  email: text('email'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('customers_tenant_idx').on(table.tenantId),
}));

export const customerAssets = pgTable('customer_assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerId: uuid('customer_id').notNull().references(() => customers.id),
  assetType: text('asset_type').notNull(), // "HP", "Motor", "Kulkas", dst — bebas per tenant
  brand: text('brand'),
  model: text('model'),
  serialNumber: text('serial_number'),
});

export const serviceTickets = pgTable('service_tickets', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  branchId: uuid('branch_id').notNull().references(() => branches.id),
  customerId: uuid('customer_id').notNull().references(() => customers.id),
  customerAssetId: uuid('customer_asset_id').notNull().references(() => customerAssets.id),
  flowTemplateId: uuid('flow_template_id').notNull().references(() => flowTemplates.id),
  currentNodeId: uuid('current_node_id').references(() => flowNodes.id),
  status: ticketStatusEnum('status').notNull().default('open'),
  // H7 — denormalized totals for list views that must not aggregate ticket_charges.
  // Kept in sync by the tickets service inside the same transaction as every charge write.
  estimatedTotal: money('estimated_total').notNull().default('0'),
  approvedTotal: money('approved_total'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  closedAt: timestamp('closed_at', { withTimezone: true }),
}, (table) => ({
  tenantBranchIdx: index('service_tickets_tenant_branch_idx').on(table.tenantId, table.branchId),
}));

export const ticketStageHistory = pgTable('ticket_stage_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  ticketId: uuid('ticket_id').notNull().references(() => serviceTickets.id),
  nodeId: uuid('node_id').notNull().references(() => flowNodes.id),
  actorId: uuid('actor_id'),
  notes: text('notes'),
  enteredAt: timestamp('entered_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  ticketIdx: index('ticket_stage_history_ticket_idx').on(table.ticketId),
}));

export const approvalRequests = pgTable('approval_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  ticketId: uuid('ticket_id').notNull().references(() => serviceTickets.id),
  requestedAt: timestamp('requested_at', { withTimezone: true }).notNull().defaultNow(),
  respondedAt: timestamp('responded_at', { withTimezone: true }),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  amount: money('amount'),
  magicToken: text('magic_token').unique(), // dipakai untuk link approval customer
});

export const warrantyRecords = pgTable('warranty_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  ticketId: uuid('ticket_id').notNull().unique().references(() => serviceTickets.id),
  customerAssetId: uuid('customer_asset_id').notNull().references(() => customerAssets.id),
  warrantyStart: timestamp('warranty_start', { withTimezone: true }).notNull(),
  warrantyEnd: timestamp('warranty_end', { withTimezone: true }).notNull(),
});
