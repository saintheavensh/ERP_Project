import { untrack } from 'svelte';

export class PricingSimulatorState {
  item: any;
  simBrandId: string;
  simBrandName: string;
  onApplyPrice: (brandId: string, price: number) => Promise<void>;
  onClose: () => void;

  simSellingPrice = $state(0);
  savingBrand = $state(false);

  constructor(
    item: any,
    simBrandId: string,
    simBrandName: string,
    initialSellingPrice: number,
    onApplyPrice: (brandId: string, price: number) => Promise<void>,
    onClose: () => void
  ) {
    this.item = item;
    this.simBrandId = simBrandId;
    this.simBrandName = simBrandName;
    this.onApplyPrice = onApplyPrice;
    this.onClose = onClose;
    
    this.simSellingPrice = untrack(() => initialSellingPrice);
  }

  get simData() {
    if (!this.simBrandId || !this.item.stockBatches) return null;
    const batches = this.item.stockBatches.filter((b: any) => b.partBrandId === this.simBrandId && b.quantityRemaining > 0);
    if (batches.length === 0) return null;

    let totalQty = 0;
    let totalOmzet = 0;
    let totalModal = 0;
    const batchDetails: any[] = [];
    
    let totalLabaPositif = 0;
    let totalBebanFluktuasi = 0;

    batches.forEach((b: any) => {
       const qty = b.quantityRemaining;
       const cost = parseFloat(b.unitCost);
       const revenue = qty * this.simSellingPrice;
       const cogs = qty * cost;
       const profit = revenue - cogs;
       
       totalQty += qty;
       totalOmzet += revenue;
       totalModal += cogs;

       if (profit > 0) totalLabaPositif += profit;
       if (profit < 0) totalBebanFluktuasi += Math.abs(profit);

       batchDetails.push({
         qty,
         cost,
         revenue,
         profit,
         receivedAt: b.receivedAt
       });
    });

    const netProfit = totalOmzet - totalModal;
    const netProfitPct = totalModal > 0 ? (netProfit / totalModal) * 100 : 0;
    
    const targetMarginPct = parseFloat(this.item.targetMargin || this.item.category?.targetMargin || '30');
    const targetMultiplier = 1 + (targetMarginPct / 100);
    
    const sortedBatches = batchDetails.sort((a,b) => new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime());
    
    const maxCost = batchDetails.reduce((max, b) => Math.max(max, b.cost), 0);
    const latestCost = sortedBatches.length > 0 ? sortedBatches[sortedBatches.length - 1].cost : 0;

    return {
      totalQty,
      totalOmzet,
      totalModal,
      netProfit,
      netProfitPct,
      totalLabaPositif,
      totalBebanFluktuasi,
      maxCost,
      latestCost,
      targetMarginPct,
      targetMultiplier,
      batchDetails: sortedBatches
    };
  }

  setRecommendedTotalNet() {
    const data = this.simData;
    if (data && data.totalQty > 0) {
      this.simSellingPrice = (data.totalModal * data.targetMultiplier) / data.totalQty;
    }
  }

  setRecommendedLatestCost() {
    const data = this.simData;
    if (data) {
      this.simSellingPrice = data.latestCost * data.targetMultiplier;
    }
  }

  async handleApply() {
    this.savingBrand = true;
    await this.onApplyPrice(this.simBrandId, this.simSellingPrice);
    this.savingBrand = false;
  }
}
