import { untrack } from 'svelte';

export class BrandPricingState {
  item: any;
  token: string;
  onOpenSimulator: (brandId: string, name: string, currentPrice: number) => void;

  editingBrandId = $state<string | null>(null);
  editBrandPrice = $state<number>(0);
  savingBrand = $state(false);

  constructor(
    item: any,
    token: string,
    onOpenSimulator: (brandId: string, name: string, currentPrice: number) => void
  ) {
    this.item = item;
    this.token = token;
    this.onOpenSimulator = onOpenSimulator;
  }

  get brandData() {
    if (!this.item) return [];
    
    const costs: Record<string, { totalCost: number, totalQty: number, name: string, maxCost: number, minCost: number }> = {};
    if (this.item.stockBatches) {
      this.item.stockBatches.forEach((b: any) => {
        if (b.quantityRemaining > 0 && b.partBrandId) {
          if (!costs[b.partBrandId]) {
            costs[b.partBrandId] = { totalCost: 0, totalQty: 0, name: b.partBrand?.name || 'Tanpa Merk', maxCost: -Infinity, minCost: Infinity };
          }
          const uCost = parseFloat(b.unitCost);
          costs[b.partBrandId].totalCost += uCost * b.quantityRemaining;
          costs[b.partBrandId].totalQty += b.quantityRemaining;
          costs[b.partBrandId].maxCost = Math.max(costs[b.partBrandId].maxCost, uCost);
          costs[b.partBrandId].minCost = Math.min(costs[b.partBrandId].minCost, uCost);
        }
      });
    }

    const merged: Record<string, any> = {};
    Object.keys(costs).forEach(bId => {
      merged[bId] = {
        id: bId,
        name: costs[bId].name,
        unitCostAvg: costs[bId].totalCost / costs[bId].totalQty,
        maxCost: costs[bId].maxCost,
        minCost: costs[bId].minCost,
        stock: costs[bId].totalQty,
        sellingPrice: parseFloat(this.item.sellingPrice) // fallback
      };
    });

    if (this.item.brandPricing) {
      this.item.brandPricing.forEach((bp: any) => {
        if (!merged[bp.partBrandId]) {
           merged[bp.partBrandId] = {
             id: bp.partBrandId,
             name: bp.partBrand?.name || 'Tanpa Merk',
             unitCostAvg: 0,
             maxCost: 0,
             minCost: 0,
             stock: 0
           };
        }
        merged[bp.partBrandId].sellingPrice = parseFloat(bp.sellingPrice);
      });
    }
    
    return Object.values(merged);
  }

  getBrandMargin(cost: number, price: number) {
    if (!cost) return { pct: 0, color: 'text-slate-400', text: 'No Cost Data', bg: 'bg-slate-100' };
    const pct = ((price - cost) / cost) * 100;
    let color = pct < 0 ? 'text-red-700' : pct < 15 ? 'text-orange-700' : 'text-green-700';
    let bg = pct < 0 ? 'bg-red-100' : pct < 15 ? 'bg-orange-100' : 'bg-green-100';
    return { pct, color, bg, text: `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%` };
  }

  startEditBrand(brandId: string, currentPrice: number) {
    this.editingBrandId = brandId;
    this.editBrandPrice = currentPrice;
  }

  cancelEditBrand() {
    this.editingBrandId = null;
  }

  async saveBrandPrice(brandId: string, customPrice?: number) {
    this.savingBrand = true;
    const finalPrice = customPrice !== undefined ? customPrice : this.editBrandPrice;
    try {
      const res = await fetch(`http://localhost:3001/v1/inventory/${this.item.id}/brands/${brandId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({ sellingPrice: finalPrice })
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || 'Failed to save');
      }
      window.location.reload();
    } catch (err: any) {
      alert(err.message);
      this.savingBrand = false;
    }
  }
}
