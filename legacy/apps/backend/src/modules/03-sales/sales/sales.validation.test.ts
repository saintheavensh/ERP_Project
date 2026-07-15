import { describe, it, expect } from 'vitest';
import { createSaleSchema } from '@repo/shared';

describe('Sales Validation Schema (Strict Data Integrity)', () => {

    it('should accept a valid sale payload', () => {
        const validPayload = {
            userId: "USR-001",
            items: [
                { productId: "PRD-001", qty: 2, price: 50000, variant: "Standard" }
            ],
            payments: [
                { method: "cash", amount: 100000 }
            ],
            totalAmount: 100000 // Note: totalAmount is NOT in the schema currently, logic calculates it? 
            // Wait, let me check strict mode. Zod strips unknowns by default unless strict().
            // The schema definition in index.ts DOES NOT include totalAmount.
            // This implies the Controller or Service calculates it, which is good for integrity.
        };

        const result = createSaleSchema.safeParse(validPayload);
        expect(result.success).toBe(true);
    });

    it('should reject payload with missing required fields (userId)', () => {
        const invalidPayload = {
            // userId missing
            items: [{ productId: "PRD-001", qty: 1, price: 10000 }],
            payments: [{ method: "cash", amount: 10000 }]
        };

        const result = createSaleSchema.safeParse(invalidPayload);
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].path).toContain('userId');
        }
    });

    it('should reject payload with empty items array (min 1)', () => {
        const invalidPayload = {
            userId: "USR-001",
            items: [], // Empty
            payments: [{ method: "cash", amount: 10000 }]
        };

        const result = createSaleSchema.safeParse(invalidPayload);
        expect(result.success).toBe(false);
        if (!result.success) {
            // Zod error for min(1) on array
            expect(result.error.issues.some(i => i.path.includes('items'))).toBe(true);
        }
    });

    it('should reject payload with negative quantity or price', () => {
        const invalidPayload = {
            userId: "USR-001",
            items: [
                { productId: "PRD-001", qty: -5, price: 50000 }
            ],
            payments: [{ method: "cash", amount: 10000 }]
        };

        const result = createSaleSchema.safeParse(invalidPayload);
        expect(result.success).toBe(false);
        if (!result.success) {
            // Check for items error
            expect(result.error.issues.some(i => i.path.includes('items') && i.path.includes('qty'))).toBe(true);
        }
    });

    it('should reject payload with negative payment amount', () => {
        const invalidPayload = {
            userId: "USR-001",
            items: [{ productId: "PRD-001", qty: 1, price: 50000 }],
            payments: [{ method: "cash", amount: -100 }]
        };

        const result = createSaleSchema.safeParse(invalidPayload);
        expect(result.success).toBe(false);
    });
});
