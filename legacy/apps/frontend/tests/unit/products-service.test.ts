import { describe, it, expect, vi, beforeEach } from 'vitest';
import { productsService } from '$lib/features/inventory/services/products.service';
import { api } from '$lib/shared/lib/api-client';

vi.mock('$lib/shared/lib/api-client', () => ({
    api: {
        get: vi.fn(),
        post: vi.fn()
    }
}));

describe('ProductsService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should fetch products', async () => {
        const mockProducts = [{ id: '1', name: 'Test Product' }];
        // The service does: response.data.data!
        vi.mocked(api.get).mockResolvedValue({ data: { data: mockProducts } } as any);

        const products = await productsService.getProducts();
        expect(products).toEqual(mockProducts);
        // Using objectContaining to handle possible undefined params
        expect(api.get).toHaveBeenCalledWith('/products', expect.objectContaining({ params: undefined }));
    });

    it('should create product', async () => {
        const newProduct = { name: 'New Product', price: 10000 };
        vi.mocked(api.post).mockResolvedValue({ data: { data: { id: '1', ...newProduct } } } as any);

        const result = await productsService.createProduct(newProduct);
        expect(result).toHaveProperty('id');
        expect(api.post).toHaveBeenCalledWith('/products', newProduct);
    });
});
