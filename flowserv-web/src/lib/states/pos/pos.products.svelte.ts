export class PosProductsState {
  data: any = $state({});
  selectedBranchId = $state('');
  searchQuery = $state('');

  constructor(data: any) {
    this.data = data;
    
    $effect(() => {
      if (this.branches.length > 0 && !this.selectedBranchId) {
        this.selectedBranchId = this.branches[0].id;
      }
    });
  }

  get branches() {
    return this.data.branches || [];
  }

  get products() {
    return this.data.products || [];
  }

  get flattenedProducts() {
    const flat = [];
    for (const p of this.products) {
      if (p.brandPricing && p.brandPricing.length > 0) {
        for (const bp of p.brandPricing) {
          flat.push({
            ...p,
            inventoryItemId: p.id,
            partBrandId: bp.partBrandId,
            name: p.name,
            brandName: bp.partBrand?.name || 'Unknown',
            categoryName: p.category?.name || 'Uncategorized',
            sellingPrice: bp.sellingPrice,
          });
        }
      } else {
        flat.push({ 
          ...p, 
          inventoryItemId: p.id, 
          partBrandId: null, 
          brandName: p.partBrand?.name || 'General', 
          categoryName: p.category?.name || 'Uncategorized' 
        });
      }
    }
    return flat;
  }

  get filteredProducts() {
    if (!this.searchQuery) return this.flattenedProducts;
    const terms = this.searchQuery.toLowerCase().split(' ').filter(t => t);
    return this.flattenedProducts.filter(p => {
      const searchableStr = `${p.name} ${p.brandName} ${p.categoryName} ${p.sku}`.toLowerCase();
      return terms.every(term => searchableStr.includes(term));
    });
  }

  // H10 — sellable = available − reserved. This is what POS must check: a part
  // held by a service ticket's reservation is physically on the shelf but not
  // sellable to a walk-in. Reservation is tracked per item+branch, not per brand
  // (stock_levels has no partBrandId column — see H10 "Design"), so the
  // branded-product path below can't subtract a brand-specific reserved amount;
  // it still uses the raw batch count. The backend enforces the real (item+branch)
  // sellable limit regardless of which brand tile the sale came from.
  getStockForBranch(product: any, branchId: string) {
    if (product.partBrandId !== undefined) {
      if (!product.brandStock || !product.brandStock[branchId]) return 0;
      const bId = product.partBrandId || 'generic';
      return product.brandStock[branchId][bId] || 0;
    }

    if (!product.stockLevels) return 0;
    const level = product.stockLevels.find((l: any) => l.branchId === branchId);
    if (!level) return 0;
    return level.quantityAvailable - level.quantityReserved;
  }

  getReservedForBranch(product: any, branchId: string) {
    if (!product.stockLevels) return 0;
    const level = product.stockLevels.find((l: any) => l.branchId === branchId);
    return level ? level.quantityReserved : 0;
  }
}
