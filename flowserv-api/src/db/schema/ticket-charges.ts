import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';

import { tenants, users } from './core';
import { serviceTickets } from './tickets';
import { inventoryItems, stockMovements } from './inventory';
import { partBrands } from './product_catalog';
import { lineSourceEnum, chargeStatusEnum } from './enums';
import { money } from './columns';

// H7 — a service ticket's parts, labor, and fees. Holds both estimates and actuals in
// one table: a quotation is simply the charges in 'estimated' state. This is the table
// that lets a ticket answer "did we make money on this repair?".
//
// Deliberately does NOT store a `total` — it is quantity × unitPrice; storing it invites
// the two disagreeing. Denormalized per-ticket totals live on service_tickets instead.
export const ticketCharges = pgTable('ticket_charges', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  ticketId: uuid('ticket_id').notNull().references(() => serviceTickets.id),

  sourceType: lineSourceEnum('source_type').notNull(), // reuse H6's enum: part | labor | fee
  description: text('description').notNull(),

  inventoryItemId: uuid('inventory_item_id').references(() => inventoryItems.id),
  partBrandId: uuid('part_brand_id').references(() => partBrands.id),

  quantity: integer('quantity').notNull(),
  unitPrice: money('unit_price').notNull(), // what the customer pays
  unitCost: money('unit_cost'),             // filled at consumption from FIFO batches (H9), null here

  status: chargeStatusEnum('status').notNull().default('estimated'),

  // Set when the charge is actually consumed (H9), linking to the real stock movement.
  stockMovementId: uuid('stock_movement_id').references(() => stockMovements.id),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid('created_by').references(() => users.id),
}, (t) => ({
  ticketIdx: index('ticket_charges_ticket_idx').on(t.ticketId),
}));
