import { productsService } from '../services/products.service';

export class TeknisiInventoryLogic {
    // Teknisi hanya lihat sparepart
    async getPartsView() {
        // Menggunakan endpoint khusus spareparts yang sudah ada
        const products = await productsService.getSpareparts();

        // Filter hanya sparepart (seharusnya sudah difilter oleh backend, tapi untuk keamanan ganda)
        return products
            .filter(p => p.category === 'sparepart')
            .map(p => ({
                id: p.id,
                name: p.name,
                sku: p.sku,
                stock: p.stock,
                price: p.price
                // TIDAK ADA info batch, supplier, dll!
            }));
    }

    async requestPart(productId: string, quantity: number) {
        // Teknisi bisa request part menggunakan service yang ada
        return productsService.requestPart(productId, quantity);
    }

    // Teknisi TIDAK BISA edit atau hapus apapun!
}
