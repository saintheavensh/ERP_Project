export class ProductManager {
    products = $state<any[]>([]);
    searchTerm = $state("");
    selectedCategory = $state("all");

    get processedProducts() {
        return this.products.map((p: any) => {
            const variantMap = new Map();

            const sortedBatches = (p.batches || []).sort(
                (a: any, b: any) =>
                    new Date(a.createdAt).getTime() -
                    new Date(b.createdAt).getTime(),
            );

            for (const b of sortedBatches) {
                if (b.currentStock <= 0) continue;

                const vName =
                    b.variant && b.variant !== "Standard" ? b.variant : "";
                if (!variantMap.has(vName)) {
                    variantMap.set(vName, {
                        name: vName,
                        stock: 0,
                        price: b.sellPrice,
                    });
                }
                const v = variantMap.get(vName);
                v.stock += b.currentStock;
            }

            return {
                ...p,
                variants: Array.from(variantMap.values()),
            };
        });
    }

    get filteredProducts() {
        return this.processedProducts.filter((p: any) => {
            const term = this.searchTerm.toLowerCase();
            const matchesSearch =
                p.name.toLowerCase().includes(term) ||
                (p.code && p.code.toLowerCase().includes(term));

            const matchesCategory =
                this.selectedCategory === "all" || p.categoryId === this.selectedCategory;

            return matchesSearch && matchesCategory;
        });
    }
}
