import { productsService } from '../services/products.service';
import type { Product } from '../types/products.types';

export class ManagerInventoryLogic {
    // Manager bisa lihat semua data + analisis
    async getManagementView() {
        const response = await productsService.getProducts({ limit: 1000 }); // load all or max limit for analysis
        const products = response.items;

        return {
            products,
            totalValue: products.reduce((sum, p) => sum + (p.price * p.stock), 0),
            lowStockItems: products.filter(p => p.stock < (p.minStock || 0)),
            profitMargin: products.map(p => ({
                name: p.name,
                // Assuming buyPrice doesn't exist yet based on type, using a mock calc or safely handling it
                margin: ((p.price - ((p as any).buyPrice || (p.price * 0.7))) / p.price) * 100
            })),
            // Mocking these for now as they aren't in productsService yet
            bestSellers: [],
            supplierStats: []
        };
    }

    async bulkUpdatePrices(productIds: string[], newPrice: number) {
        // Hanya manager yang bisa bulk update
        return productsService.bulkUpdate(productIds, { price: newPrice });
    }

    async deleteProduct(id: string) {
        // Manager bisa hapus (dengan validasi)
        const product = await productsService.getProduct(id);
        if (product.stock > 0) {
            throw new Error('Cannot delete product with existing stock');
        }
        return productsService.deleteProduct(id);
    }
}
