// P10 — Product Catalog (5.5 / SUP-009). Same list data the main inventory
// table already fetches (category, brandPricing, totalAvailable) — this is a
// browse-first view over it, not a new data source.
export class CatalogState {
  data: any = $state({});
  searchQuery = $state('');
  selectedCategoryId = $state('');

  constructor(data: any) {
    this.data = data;
  }

  get inventory() { return this.data.inventory || []; }
  get categories() { return this.data.categories || []; }

  get filteredInventory() {
    let items = this.inventory;
    if (this.selectedCategoryId) {
      items = items.filter((i: any) => i.categoryId === this.selectedCategoryId);
    }
    const q = this.searchQuery.trim().toLowerCase();
    if (q) {
      items = items.filter(
        (i: any) => i.name?.toLowerCase().includes(q) || i.sku?.toLowerCase().includes(q)
      );
    }
    return items;
  }

  // Grouped for the browse-by-category layout — items with no category land
  // in a trailing "Tanpa Kategori" bucket rather than being dropped silently.
  get groupedByCategory(): Array<{ id: string; name: string; items: any[] }> {
    const byId = new Map<string, { id: string; name: string; items: any[] }>();
    const uncategorized: any[] = [];

    for (const item of this.filteredInventory) {
      if (!item.categoryId) {
        uncategorized.push(item);
        continue;
      }
      if (!byId.has(item.categoryId)) {
        const cat = this.categories.find((c: any) => c.id === item.categoryId);
        byId.set(item.categoryId, { id: item.categoryId, name: cat?.name || 'Kategori', items: [] });
      }
      byId.get(item.categoryId)!.items.push(item);
    }

    const groups = [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
    if (uncategorized.length > 0) {
      groups.push({ id: '', name: 'Tanpa Kategori', items: uncategorized });
    }
    return groups;
  }

  priceLabel(item: any): string {
    const prices: number[] = (item.brandPricing || []).map((bp: any) => parseFloat(bp.sellingPrice || 0));
    if (prices.length === 0) {
      return `Rp ${parseFloat(item.sellingPrice || 0).toLocaleString('id-ID')}`;
    }
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    if (min === max) return `Rp ${min.toLocaleString('id-ID')}`;
    return `Rp ${min.toLocaleString('id-ID')} - Rp ${max.toLocaleString('id-ID')}`;
  }

  stockBadge(item: any): { label: string; tone: 'ok' | 'low' | 'out' } {
    const available = item.totalAvailable ?? 0;
    if (available <= 0) return { label: 'Stok Habis', tone: 'out' };
    if (available <= item.reorderPoint) return { label: `Stok Menipis (${available})`, tone: 'low' };
    return { label: `Stok: ${available}`, tone: 'ok' };
  }
}
