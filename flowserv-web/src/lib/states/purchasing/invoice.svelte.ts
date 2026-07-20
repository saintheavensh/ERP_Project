import { untrack } from 'svelte';
import { API_BASE } from '$lib/api/config';

export class PurchaseInvoiceState {
  data: any;
  
  invoiceNumber = $state('');
  invoiceDate = $state('');
  invoiceDueDate = $state('');
  paymentMethod = $state('cash');
  
  batches = $state<any[]>([]);
  loading = $state(false);
  errorMsg = $state('');

  constructor(data: any) {
    this.data = data;
    this.invoiceNumber = untrack(() => this.order.invoiceNumber || '');
    this.invoiceDate = untrack(() => this.order.invoiceDate ? new Date(this.order.invoiceDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    this.invoiceDueDate = untrack(() => this.order.invoiceDueDate ? new Date(this.order.invoiceDueDate).toISOString().split('T')[0] : '');
    
    this.batches = untrack(() => {
      const allBatches: any[] = [];
      this.data.order.purchaseOrderLines.forEach((l: any) => {
        if (l.stockBatches) {
          l.stockBatches.forEach((b: any) => {
            if (b.quantityReceived > 0) {
              allBatches.push({
                batchId: b.id,
                name: l.inventoryItem.name,
                sku: l.inventoryItem.sku,
                brandName: b.partBrand ? b.partBrand.name : 'Tanpa Merk',
                receivedQuantity: b.quantityReceived,
                actualUnitCost: b.unitCost ? parseFloat(b.unitCost) : 0,
                sellingPrice: l.inventoryItem.sellingPrice ? parseFloat(l.inventoryItem.sellingPrice) : 0,
                marginStrategy: l.inventoryItem.marginStrategy || (l.inventoryItem.category ? l.inventoryItem.category.marginStrategy : 'markup'),
                targetMargin: l.inventoryItem.targetMargin ? parseFloat(l.inventoryItem.targetMargin) : (l.inventoryItem.category && l.inventoryItem.category.targetMargin ? parseFloat(l.inventoryItem.category.targetMargin) : 0)
              });
            }
          });
        }
      });
      return allBatches;
    });
  }

  get order() {
    return this.data.order;
  }

  get actualTotal() {
    return this.batches.reduce((sum: number, batch: any) => sum + (batch.receivedQuantity * batch.actualUnitCost), 0);
  }

  updateDueDate() {
    if (this.paymentMethod === 'tempo' && this.order?.supplier?.paymentTermDays) {
      const d = new Date(this.invoiceDate);
      d.setDate(d.getDate() + this.order.supplier.paymentTermDays);
      this.invoiceDueDate = d.toISOString().split('T')[0];
    } else if (this.paymentMethod !== 'tempo') {
      this.invoiceDueDate = '';
    }
  }

  getRecommendedPrice(actualCost: number, strategy: string, margin: number) {
    if (!actualCost || !margin) return 0;
    if (strategy === 'gross_margin') {
      if (margin >= 100) return actualCost; // Prevent division by zero or negative
      return Math.ceil(actualCost / (1 - (margin / 100)));
    }
    // markup
    return Math.ceil(actualCost * (1 + (margin / 100)));
  }

  getMarginWarning(batch: any) {
    const recPrice = this.getRecommendedPrice(batch.actualUnitCost, batch.marginStrategy, batch.targetMargin);
    if (recPrice === 0) return null;
    
    if (batch.sellingPrice < recPrice) {
      return `Target jual Rp ${recPrice.toLocaleString('id-ID')} (${batch.targetMargin}% ${batch.marginStrategy === 'gross_margin' ? 'GM' : 'Markup'})`;
    }
    return null;
  }

  async submitInvoice() {
    if (!this.invoiceNumber) {
      this.errorMsg = 'Invoice number is required.';
      return;
    }
    
    for (const batch of this.batches) {
      if (!batch.actualUnitCost || batch.actualUnitCost <= 0) {
        this.errorMsg = `Harga beli untuk item ${batch.name} (${batch.brandName}) belum di set atau bernilai 0.`;
        return;
      }
      if (!batch.sellingPrice || batch.sellingPrice <= 0) {
        this.errorMsg = `Harga jual untuk item ${batch.name} (${batch.brandName}) belum di set atau bernilai 0.`;
        return;
      }
    }
    
    const hasLoss = this.batches.some(b => b.sellingPrice < b.actualUnitCost);
    if (hasLoss) {
      const confirmLoss = confirm('Peringatan: Ada item dengan Harga Jual di bawah Harga Beli! Apakah Anda yakin ingin menyimpan?');
      if (!confirmLoss) return;
    } else {
      const confirmNormal = confirm('Apakah Harga Beli aktual dan Harga Jual baru sudah sesuai? Data HPP akan otomatis dihitung ulang setelah ini.');
      if (!confirmNormal) return;
    }
    
    this.loading = true;
    this.errorMsg = '';
    
    try {
      const payload = {
        invoiceNumber: this.invoiceNumber,
        invoiceDate: this.invoiceDate,
        invoiceDueDate: this.invoiceDueDate || undefined,
        paymentMethod: this.paymentMethod,
        batches: this.batches.map((b: any) => ({ 
          batchId: b.batchId, 
          actualUnitCost: b.actualUnitCost,
          sellingPrice: b.sellingPrice
        }))
      };
      
      const res = await fetch(`${API_BASE}/purchasing/orders/${this.order.id}/invoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.data.token}`
        },
        body: JSON.stringify(payload)
      });
      
      const result = await res.json();
      
      if (!res.ok) throw new Error(result.error?.message || 'Failed to submit invoice');
      
      window.location.href = `/inventory/purchasing/${this.order.id}`;
    } catch (err: any) {
      this.errorMsg = err.message;
      this.loading = false;
    }
  }
}
