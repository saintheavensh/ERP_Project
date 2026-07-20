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

import { tenants, permissions } from './core';


export const flowTemplates = pgTable('flow_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  domain: varchar('domain', { length: 20 }).notNull(), // "service" | "inventory"
  name: text('name').notNull(),
  isDefault: boolean('is_default').notNull().default(false),
  version: integer('version').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('flow_templates_tenant_idx').on(table.tenantId),
}));

export const flowNodes = pgTable('flow_nodes', {
  id: uuid('id').primaryKey().defaultRandom(),
  flowTemplateId: uuid('flow_template_id').notNull().references(() => flowTemplates.id),
  name: text('name').notNull(),
  sequenceOrder: integer('sequence_order').notNull(),
  nodeType: varchar('node_type', { length: 20 }).notNull(), // "action" | "approval" | "system"
  requiredPermissionId: uuid('required_permission_id').references(() => permissions.id),
}, (table) => ({
  templateIdx: index('flow_nodes_template_idx').on(table.flowTemplateId),
}));

export const flowTransitions = pgTable('flow_transitions', {
  id: uuid('id').primaryKey().defaultRandom(),
  fromNodeId: uuid('from_node_id').notNull().references(() => flowNodes.id),
  toNodeId: uuid('to_node_id').notNull().references(() => flowNodes.id),
  conditionExpression: text('condition_expression'),
});
