import { productsService } from '../services/products.service';

export class WarehouseInventoryLogic {
    // Warehouse fokus pada stok fisik
    async getStockView() {
        const response = await productsService.getProducts({ limit: 1000 });
        const products = response.items;

        return products.map(p => ({
            id: p.id,
            name: p.name,
            sku: p.sku,
            location: p.location,
            stock: p.stock,
            batches: p.batches?.map(b => ({
                batchNumber: b.batchNumber,
                quantity: b.quantity,
                expiryDate: b.expiryDate,
                location: b.location
            }))
            // TIDAK ADA info harga di sini!
        }));
    }

    async adjustStock(productId: string, quantity: number, reason: string) {
        // Warehouse bisa adjust stok
        // Using a generic update for now based on available service methods
        const product = await productsService.getProduct(productId);
        const newStock = product.stock + quantity;
        return productsService.updateProduct(productId, { stock: newStock });
    }

    async moveStock(productId: string, fromLocation: string, toLocation: string) {
        // Warehouse bisa pindahin barang
        return productsService.updateProduct(productId, { location: toLocation });
    }

    async getExpiryAlert() {
        // Barang yang akan expired
        const response = await productsService.getProducts({ limit: 1000 });
        const products = response.items;

        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        return products.flatMap(p =>
            p.batches
                ?.filter(b => b.expiryDate && new Date(b.expiryDate) < thirtyDaysFromNow)
                .map(b => ({
                    productName: p.name,
                    batchNumber: b.batchNumber,
                    expiryDate: b.expiryDate,
                    quantity: b.quantity
                })) || []
        );
    }
}
