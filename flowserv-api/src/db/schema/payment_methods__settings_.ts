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

import { tenants } from './core';


export const paymentMethods = pgTable('payment_methods', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  name: varchar('name', { length: 50 }).notNull(), // e.g., "Tunai", "BCA", "QRIS", "Tempo"
  type: varchar('type', { length: 20 }).notNull(), // "cash", "transfer", "qris", "tempo"
  isActive: boolean('is_active').notNull().default(true),
});
