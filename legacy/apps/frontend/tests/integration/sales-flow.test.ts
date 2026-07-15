import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SalesService } from '$lib/features/sales/components/sales.service';
import { productsService } from '$lib/features/inventory/services/products.service';
import { api } from '$lib/shared/lib/api-client';

vi.mock('$lib/shared/lib/api-client', () => ({
    api: {
        get: vi.fn(),
        post: vi.fn()
    }
}));

describe('Sales Flow Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should complete full sale flow', async () => {
        // Setup mock data
        const mockProductResponse = { items: [{ id: 'prod_1', name: 'Test LCD', price: 150000, stock: 10, sku: 'SKU1', category: 'LCD', createdAt: '', updatedAt: '' }], total: 1, limit: 10, page: 1 };
        vi.mocked(api.get).mockResolvedValue({ data: { data: mockProductResponse } } as any);

        const mockSaleResponse = { id: 'sale_1', message: 'Success', change: 0 };
        vi.mocked(api.post).mockResolvedValue({ data: { data: mockSaleResponse } } as any);

        // 1. Get products (simulate browsing/searching)
        const productsList = await productsService.getProducts();
        expect(productsList.items.length).toBeGreaterThan(0);
        expect(productsList.items[0].name).toBe('Test LCD');

        // 2. Create cart payload
        const cart = [{
            productId: productsList.items[0].id,
            variant: 'default',
            qty: 2,
            price: productsList.items[0].price
        }];

        // 3. Process the sale/payment
        const sale = await SalesService.create({
            userId: 'user_1',
            items: cart,
            payments: [{
                method: 'CASH',
                amount: 300000
            }]
        });

        expect(sale).toHaveProperty('id', 'sale_1');
        expect(api.post).toHaveBeenCalledWith('/sales', expect.objectContaining({
            userId: 'user_1',
            items: cart
        }));
    });
});
