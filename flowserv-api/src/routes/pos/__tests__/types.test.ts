import { describe, it, expect } from 'vitest';
import { posCheckoutSchema } from '../types';

const branchId = 'b0000000-0000-4000-8000-000000000001';
const inventoryItemId = '30000000-0000-4000-8000-000000000001';

function checkoutWith(items: unknown[]) {
  return posCheckoutSchema.safeParse({
    branchId,
    paymentMethod: 'cash',
    items,
  });
}

describe('posCheckoutSchema — H6: labor/fee lines vs part lines', () => {
  it('accepts an invoice containing only a labor line, with no inventory item', () => {
    const result = checkoutWith([
      { sourceType: 'labor', description: 'Jasa ganti LCD', quantity: 1, unitPrice: 150000 },
    ]);
    expect(result.success).toBe(true);
  });

  it('accepts a fee line the same way as a labor line', () => {
    const result = checkoutWith([
      { sourceType: 'fee', description: 'Biaya survey lokasi', quantity: 1, unitPrice: 25000 },
    ]);
    expect(result.success).toBe(true);
  });

  it('accepts a mixed cart: one part line, one labor line', () => {
    const result = checkoutWith([
      { sourceType: 'part', inventoryItemId, quantity: 2, unitPrice: 200000 },
      { sourceType: 'labor', description: 'Jasa pasang', quantity: 1, unitPrice: 50000 },
    ]);
    expect(result.success).toBe(true);
  });

  it('rejects a part line with no inventoryItemId', () => {
    const result = checkoutWith([
      { sourceType: 'part', quantity: 1, unitPrice: 200000 },
    ]);
    expect(result.success).toBe(false);
  });

  it('rejects a labor line with no description', () => {
    const result = checkoutWith([
      { sourceType: 'labor', quantity: 1, unitPrice: 50000 },
    ]);
    expect(result.success).toBe(false);
  });

  it('rejects the reserved "discount" source type — not implemented yet (H6 "Watch out")', () => {
    const result = checkoutWith([
      { sourceType: 'discount', description: 'Diskon member', quantity: 1, unitPrice: 10000 },
    ]);
    expect(result.success).toBe(false);
  });

  it('defaults a labor/fee line quantity to 1 when omitted', () => {
    const result = checkoutWith([
      { sourceType: 'labor', description: 'Jasa cek unit', unitPrice: 20000 },
    ]);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.items[0]).toMatchObject({ quantity: 1 });
    }
  });

  it('rejects an empty cart', () => {
    const result = checkoutWith([]);
    expect(result.success).toBe(false);
  });
});
