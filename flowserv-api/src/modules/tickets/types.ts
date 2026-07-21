import { z } from 'zod';

// A 'part' charge references real inventory. unitPrice defaults from the item's selling
// price (looked up in the service) but stays editable — technicians negotiate — so it is
// optional here. Stock is NOT touched at estimate time; that is H9.
export const partChargeSchema = z.object({
  sourceType: z.literal('part'),
  inventoryItemId: z.string().uuid(),
  partBrandId: z.string().uuid().optional(),
  description: z.string().min(1).optional(), // defaults to inventory_items.name if omitted
  quantity: z.coerce.number().int().positive().default(1),
  unitPrice: z.coerce.number().min(0).optional(),
});

// 'labor' and 'fee' charges carry their own description and price — there is no inventory
// item behind a service charge, so both are required.
export const laborFeeChargeSchema = z.object({
  sourceType: z.enum(['labor', 'fee']),
  description: z.string().min(1),
  quantity: z.coerce.number().int().positive().default(1),
  unitPrice: z.coerce.number().min(0),
});

export const createChargeInput = z.discriminatedUnion('sourceType', [
  partChargeSchema,
  laborFeeChargeSchema,
]);

// Editing is allowed only while a charge is 'estimated' (enforced in the service).
// sourceType and the linked item are fixed once created — only price/qty/description move.
export const updateChargeInput = z.object({
  description: z.string().min(1).optional(),
  quantity: z.coerce.number().int().positive().optional(),
  unitPrice: z.coerce.number().min(0).optional(),
});

export type CreateChargeInput = z.infer<typeof createChargeInput>;
export type UpdateChargeInput = z.infer<typeof updateChargeInput>;
