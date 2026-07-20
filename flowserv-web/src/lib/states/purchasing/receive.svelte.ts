import { untrack } from 'svelte';
import { API_BASE } from '$lib/api/config';

export class PurchaseReceiveState {
  data: any;
  
  lines = $state<any[]>([]);
  loading = $state(false);
  errorMsg = $state('');

  constructor(data: any) {
    this.data = data;
    this.lines = untrack(() =>
      this.data.order.purchaseOrderLines.map((l: any) => {
        // A second delivery for a partially-received order must default to
        // what's still owed, not the original ordered quantity — otherwise
        // resubmitting the full amount double-counts what already arrived.
        const alreadyReceivedQty = l.receivedQuantity || 0;
        const remainingQty = Math.max(l.quantity - alreadyReceivedQty, 0);
        return {
          lineId: l.id,
          name: l.inventoryItem.name,
          sku: l.inventoryItem.sku,
          categoryName: l.inventoryItem.category?.name || '',
          orderedQty: l.quantity,
          alreadyReceivedQty,
          remainingQty,
          splits: [
            { partBrandId: '', receivedQuantity: remainingQty }
          ]
        };
      })
    );
  }

  get order() {
    return this.data.order;
  }

  get partBrands() {
    return this.data.partBrands || [];
  }

  isBrandRequired(categoryName: string) {
    const name = categoryName.toLowerCase();
    if (name.includes('baut') || name.includes('solatip') || name.includes('tools') || name.includes('aksesoris')) {
      return false;
    }
    return true; 
  }

  addSplit(lineIndex: number) {
    this.lines[lineIndex].splits = [...this.lines[lineIndex].splits, { partBrandId: '', receivedQuantity: 0 }];
  }
  
  removeSplit(lineIndex: number, splitIndex: number) {
    this.lines[lineIndex].splits = this.lines[lineIndex].splits.filter((_: any, i: number) => i !== splitIndex);
  }

  async submitReceiving() {
    this.loading = true;
    this.errorMsg = '';
    
    try {
      const payload = {
        lines: this.lines.map((l: any) => ({ 
          lineId: l.lineId, 
          splits: l.splits.map((s: any) => ({
            partBrandId: s.partBrandId || null,
            receivedQuantity: s.receivedQuantity
          }))
        }))
      };
      
      const res = await fetch(`${API_BASE}/purchasing/orders/${this.order.id}/receive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.data.token}`
        },
        body: JSON.stringify(payload)
      });
      
      const result = await res.json();
      
      if (!res.ok) throw new Error(result.error?.message || 'Failed to submit receiving');
      
      window.location.href = `/inventory/purchasing/${this.order.id}`;
    } catch (err: any) {
      this.errorMsg = err.message;
      this.loading = false;
    }
  }
}
