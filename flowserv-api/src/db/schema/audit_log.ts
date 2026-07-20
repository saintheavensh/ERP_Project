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

import { tenants, users } from './core';


export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  actorId: uuid('actor_id').references(() => users.id), // null = aksi sistem/otomatis
  action: text('action').notNull(), // "ticket.transition", "stock.adjust", "role.permission_changed", dst
  entityType: varchar('entity_type', { length: 50 }).notNull(), // "service_ticket", "inventory_item", "role", dst
  entityId: uuid('entity_id'),
  changes: jsonb('changes'), // detail before/after, fleksibel per jenis aksi
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('audit_logs_tenant_idx').on(table.tenantId),
  entityIdx: index('audit_logs_entity_idx').on(table.entityType, table.entityId),
  actorIdx: index('audit_logs_actor_idx').on(table.actorId),
}));
