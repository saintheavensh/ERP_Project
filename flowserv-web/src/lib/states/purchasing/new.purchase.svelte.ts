import { untrack } from 'svelte';
import { API_BASE } from '$lib/api/config';

export class NewPurchaseState {
  data: any;
  
  branchId = $state('');
  supplierId = $state('');
  expectedDeliveryDate = $state('');
  allowedBrands = $state<any[]>([]);
  
  categoryGroups = $state([{ 
    categoryId: '', 
    lines: [{ brandId: '', inventoryItemId: '', quantity: 1, unitPrice: 0 }] 
  }]);
  
  loading = $state(false);
  errorMsg = $state('');

  constructor(data: any) {
    this.data = data;
    this.branchId = untrack(() => this.data.branches[0]?.id || '');

    $effect.root(() => {
      $effect(() => {
        if (this.supplierId) {
          fetch(`${API_BASE}/suppliers/${this.supplierId}`, {
            headers: { 'Authorization': `Bearer ${this.data.token}` }
          })
          .then(r => r.json())
          .then(res => {
            if (res.data && res.data.supplierBrands) {
              this.allowedBrands = res.data.supplierBrands.map((sb: any) => sb.partBrand);
            } else {
              this.allowedBrands = [];
            }
          })
          .catch(() => this.allowedBrands = []);
        } else {
          this.allowedBrands = [];
        }
      });
    });
  }

  get estimatedTotal() {
    return this.categoryGroups.reduce((groupSum, group) => {
      return groupSum + group.lines.reduce((lineSum, line) => lineSum + (line.quantity * line.unitPrice), 0);
    }, 0);
  }

  addCategoryGroup() {
    this.categoryGroups = [...this.categoryGroups, { categoryId: '', lines: [{ brandId: '', inventoryItemId: '', quantity: 1, unitPrice: 0 }] }];
  }
  
  addLineToGroup(groupIndex: number) {
    this.categoryGroups[groupIndex].lines = [...this.categoryGroups[groupIndex].lines, { brandId: '', inventoryItemId: '', quantity: 1, unitPrice: 0 }];
  }
  
  removeCategoryGroup(index: number) {
    if (this.categoryGroups.length > 1) {
      this.categoryGroups = this.categoryGroups.filter((_, i) => i !== index);
    }
  }
  
  removeLineFromGroup(groupIndex: number, lineIndex: number) {
    if (this.categoryGroups[groupIndex].lines.length > 1) {
      this.categoryGroups[groupIndex].lines = this.categoryGroups[groupIndex].lines.filter((_, i) => i !== lineIndex);
    }
  }
  
  async submitOrder() {
    if (!this.branchId || !this.supplierId) {
      this.errorMsg = 'Please select a branch and a supplier.';
      return;
    }
    
    const validLines = this.categoryGroups.flatMap(group => 
      group.lines
        .filter(l => l.inventoryItemId && l.quantity > 0)
        .map(l => ({
          inventoryItemId: l.inventoryItemId,
          quantity: l.quantity,
          unitPrice: l.unitPrice
        }))
    );
    
    if (validLines.length === 0) {
      this.errorMsg = 'Please add at least one valid item to order.';
      return;
    }
    
    this.loading = true;
    this.errorMsg = '';
    
    try {
      const payload = {
        branchId: this.branchId,
        supplierId: this.supplierId,
        expectedDeliveryDate: this.expectedDeliveryDate || undefined,
        lines: validLines
      };
      
      const res = await fetch(`${API_BASE}/purchasing/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.data.token}`
        },
        body: JSON.stringify(payload)
      });
      
      const result = await res.json();
      
      if (!res.ok) throw new Error(result.error?.message || 'Failed to create order');
      
      window.location.href = `/inventory/purchasing/${result.data.id}`;
    } catch (err: any) {
      this.errorMsg = err.message;
      this.loading = false;
    }
  }
}
