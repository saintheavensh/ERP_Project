import { pgTable, uuid, text, integer, jsonb, timestamp, primaryKey } from 'drizzle-orm/pg-core';

import { tenants } from './core';

// H13 — one row per (tenant, client-supplied key). The response is recorded
// as the LAST write inside the same transaction that produced it, so a
// transaction rollback discards the key too — a failed request never burns
// its key and a legitimate retry can still succeed. See lib/idempotency.ts.
export const idempotencyKeys = pgTable('idempotency_keys', {
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  key: text('key').notNull(),
  endpoint: text('endpoint').notNull(),
  responseStatus: integer('response_status').notNull(),
  responseBody: jsonb('response_body').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.tenantId, table.key] }),
}));
