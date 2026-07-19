export class InventoryState {
  data: any = $state({});
  showAddModal = $state(false);
  form = $state({
    sku: `SKU-${Math.floor(Math.random() * 100000)}`,
    universalCode: '',
    name: '',
    categoryId: '',
    partBrandId: '',
    unitOfMeasure: 'pcs',
    sellingPrice: 0,
    reorderPoint: 5
  });
  loading = $state(false);
  errorMsg = $state('');

  constructor(data: any) {
    this.data = data;
  }

  get inventory() { return this.data.inventory || []; }
  get categories() { return this.data.categories || []; }
  get brands() { return this.data.brands || []; }

  resetForm() {
    this.form = {
      sku: `SKU-${Math.floor(Math.random() * 1000000)}`,
      universalCode: '',
      name: '',
      categoryId: '',
      partBrandId: '',
      unitOfMeasure: 'pcs',
      sellingPrice: 0,
      reorderPoint: 5
    };
  }

  getCategoryName(id: string) {
    if (!id) return '-';
    const cat = this.categories.find((c: any) => c.id === id);
    return cat ? cat.name : '-';
  }

  generateUniversalCode() {
    if (!this.form.categoryId || !this.form.name) {
      this.errorMsg = 'Harap isi Kategori dan Item Name terlebih dahulu untuk men-generate Universal Code.';
      return;
    }
    const catName = this.getCategoryName(this.form.categoryId);
    const code = `${catName}-${this.form.name}`.toUpperCase().replace(/[^A-Z0-9]/g, '-').replace(/-+/g, '-');
    this.form.universalCode = code;
    this.errorMsg = '';
  }

  async addItem() {
    this.loading = true;
    this.errorMsg = '';
    
    try {
      const payload: any = { ...this.form };
      if (!payload.categoryId) delete payload.categoryId;
      if (!payload.partBrandId) delete payload.partBrandId;
      if (!payload.universalCode) delete payload.universalCode;
      
      const res = await fetch('http://localhost:3001/v1/inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.data.token}`
        },
        body: JSON.stringify(payload)
      });
      
      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.error?.message || 'Failed to add item');
      }
      
      window.location.reload();
    } catch (err: any) {
      this.errorMsg = err.message;
      this.loading = false;
    }
  }

  async deleteItem(id: string) {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
      const res = await fetch(`http://localhost:3001/v1/inventory/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.data.token}`
        }
      });
      
      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.error?.message || 'Failed to delete item');
      }
      
      window.location.reload();
    } catch (err: any) {
      alert(err.message);
    }
  }

  getMarginInfo(item: any) {
    if (!item.brandPricing || item.brandPricing.length === 0) {
      // Single price mode
      const cost = parseFloat(item.unitCostAvg || 0);
      const price = parseFloat(item.sellingPrice || 0);
      if (!cost || cost <= 0) return { type: 'single', costText: `HPP: Rp ${cost.toLocaleString('id-ID')}`, priceText: `Rp ${price.toLocaleString('id-ID')}`, pct: 0, text: 'No Cost Data', color: 'text-slate-400', bg: 'bg-slate-100' };
      const marginPct = ((price - cost) / cost) * 100;
      let color = marginPct < 0 ? 'text-red-700' : marginPct < 15 ? 'text-orange-700' : 'text-green-700';
      let bg = marginPct < 0 ? 'bg-red-100' : marginPct < 15 ? 'bg-orange-100' : 'bg-green-100';
      return {
        type: 'single',
        priceText: `Rp ${price.toLocaleString('id-ID')}`,
        costText: `HPP: Rp ${cost.toLocaleString('id-ID')}`,
        pct: marginPct,
        text: `${marginPct > 0 ? '+' : ''}${marginPct.toFixed(1)}%`,
        color, bg
      };
    }
    
    // Range mode
    const brandCosts: Record<string, { totalCost: number, totalQty: number }> = {};
    if (item.stockBatches) {
      item.stockBatches.forEach((b: any) => {
        if (b.quantityRemaining > 0 && b.partBrandId) {
          if (!brandCosts[b.partBrandId]) brandCosts[b.partBrandId] = { totalCost: 0, totalQty: 0 };
          brandCosts[b.partBrandId].totalCost += parseFloat(b.unitCost) * b.quantityRemaining;
          brandCosts[b.partBrandId].totalQty += b.quantityRemaining;
        }
      });
    }

    let minPrice = Infinity;
    let maxPrice = -Infinity;
    let minMargin = Infinity;
    let maxMargin = -Infinity;

    item.brandPricing.forEach((bp: any) => {
      const price = parseFloat(bp.sellingPrice || 0);
      minPrice = Math.min(minPrice, price);
      maxPrice = Math.max(maxPrice, price);
      
      const bCostData = brandCosts[bp.partBrandId];
      if (bCostData && bCostData.totalQty > 0) {
        const cost = bCostData.totalCost / bCostData.totalQty;
        const marginPct = ((price - cost) / cost) * 100;
        minMargin = Math.min(minMargin, marginPct);
        maxMargin = Math.max(maxMargin, marginPct);
      }
    });

    if (minPrice === Infinity) {
      const p = parseFloat(item.sellingPrice || 0);
      minPrice = p; maxPrice = p;
    }

    let priceText = minPrice === maxPrice ? `Rp ${minPrice.toLocaleString('id-ID')}` : `Rp ${minPrice.toLocaleString('id-ID')} - Rp ${maxPrice.toLocaleString('id-ID')}`;
    
    if (minMargin === Infinity) {
       return { type: 'range', priceText, costText: 'HPP: Multi-brand', text: 'No Cost Data', color: 'text-slate-400', bg: 'bg-slate-100' };
    }

    let marginText = minMargin.toFixed(1) === maxMargin.toFixed(1) ? `${minMargin > 0 ? '+' : ''}${minMargin.toFixed(1)}%` : `${minMargin.toFixed(1)}% s/d ${maxMargin.toFixed(1)}%`;
    let color = minMargin < 0 ? 'text-red-700' : minMargin < 15 ? 'text-orange-700' : 'text-green-700';
    let bg = minMargin < 0 ? 'bg-red-100' : minMargin < 15 ? 'bg-orange-100' : 'bg-green-100';

    return {
      type: 'range',
      priceText,
      costText: `HPP: Multi-brand`,
      text: marginText,
      color,
      bg
    };
  }
}
