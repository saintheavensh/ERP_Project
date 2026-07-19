export function createPosProducts(data: any) {
  let branches = $derived(data.branches);
  let products = $derived(data.products);
  let flattenedProducts = $derived.by(() => {
    const flat = [];
    for (const p of products) {
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
  });

  let selectedBranchId = $state('');
  let searchQuery = $state('');

  let filteredProducts = $derived.by(() => {
    if (!searchQuery) return flattenedProducts;
    const terms = searchQuery.toLowerCase().split(' ').filter((t: string) => t);
    return flattenedProducts.filter((p: any) => {
      const searchableStr = `${p.name} ${p.brandName} ${p.categoryName} ${p.sku}`.toLowerCase();
      return terms.every((term: string) => searchableStr.includes(term));
    });
  });

  $effect(() => {
    if (branches.length > 0 && !selectedBranchId) {
      selectedBranchId = branches[0].id;
    }
  });

  function getStockForBranch(product: any, branchId: string) {
    if (product.partBrandId !== undefined) {
      if (!product.brandStock || !product.brandStock[branchId]) return 0;
      const bId = product.partBrandId || 'generic';
      return product.brandStock[branchId][bId] || 0;
    }
    
    if (!product.stockLevels) return 0;
    const level = product.stockLevels.find((l: any) => l.branchId === branchId);
    return level ? level.quantityAvailable : 0;
  }

  return {
    get branches() { return branches; },
    get selectedBranchId() { return selectedBranchId; },
    set selectedBranchId(val) { selectedBranchId = val; },
    get searchQuery() { return searchQuery; },
    set searchQuery(val) { searchQuery = val; },
    get filteredProducts() { return filteredProducts; },
    getStockForBranch
  };
}
