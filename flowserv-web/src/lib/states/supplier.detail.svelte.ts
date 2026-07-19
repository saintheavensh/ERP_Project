import { untrack } from 'svelte';

export class SupplierDetailState {
  data: any;
  form = $state<any>({});
  loading = $state(false);
  errorMsg = $state('');
  successMsg = $state('');
  
  selectedBrandId = $state('');
  newBrandName = $state('');
  newBrandGrade = $state('');

  constructor(data: any) {
    this.data = data;
    this.form = untrack(() => ({
      name: this.supplier?.name || '',
      email: this.supplier?.email || '',
      contactInfo: this.supplier?.contactInfo || '',
      photoUrl: this.supplier?.photoUrl || '',
      type: this.supplier?.type || 'wholesale',
      paymentType: this.supplier?.paymentTermDays > 0 ? 'tempo' : 'cash',
      paymentTermDays: this.supplier?.paymentTermDays || 0,
      returnPolicyDays: this.supplier?.returnPolicyDays || 0,
      warrantyPolicyDays: this.supplier?.warrantyPolicyDays || 0,
      returnWarrantyNotes: this.supplier?.returnWarrantyNotes || ''
    }));
  }

  get supplier() {
    return this.data.supplier;
  }

  get allBrands() {
    return this.data.allBrands || [];
  }

  async updateSupplier() {
    this.loading = true;
    this.errorMsg = '';
    this.successMsg = '';
    
    try {
      const payload = { ...this.form };
      if (payload.returnPolicyDays === 0) delete (payload as any).returnPolicyDays;
      if (payload.warrantyPolicyDays === 0) delete (payload as any).warrantyPolicyDays;
      if (payload.paymentType === 'cash') payload.paymentTermDays = 0;
      delete (payload as any).paymentType;
      
      const res = await fetch(`http://localhost:3001/v1/suppliers/${this.supplier.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.data.token}`
        },
        body: JSON.stringify(payload)
      });
      
      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.error?.message || 'Failed to update supplier');
      }
      
      this.successMsg = 'Supplier updated successfully!';
    } catch (err: any) {
      this.errorMsg = err.message;
    } finally {
      this.loading = false;
    }
  }

  async linkBrand() {
    if (!this.selectedBrandId) return;
    this.loading = true;
    this.errorMsg = '';
    
    try {
      const res = await fetch(`http://localhost:3001/v1/suppliers/${this.supplier.id}/brands`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.data.token}`
        },
        body: JSON.stringify({ brandId: this.selectedBrandId })
      });
      
      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.error?.message || 'Failed to link brand');
      }
      
      window.location.reload();
    } catch (err: any) {
      this.errorMsg = err.message;
      this.loading = false;
    }
  }

  async createAndLinkBrand() {
    if (!this.newBrandName) return;
    this.loading = true;
    this.errorMsg = '';
    
    try {
      const brandRes = await fetch('http://localhost:3001/v1/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.data.token}` },
        body: JSON.stringify({ name: this.newBrandName, qualityGrade: this.newBrandGrade || 'OEM' })
      });
      const brandResult = await brandRes.json();
      if (!brandRes.ok) throw new Error(brandResult.error?.message || 'Failed to create brand');
      
      const newBrandId = brandResult.data.id;
      
      const linkRes = await fetch(`http://localhost:3001/v1/suppliers/${this.supplier.id}/brands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.data.token}` },
        body: JSON.stringify({ brandId: newBrandId })
      });
      const linkResult = await linkRes.json();
      if (!linkRes.ok) throw new Error(linkResult.error?.message || 'Failed to link brand');
      
      window.location.reload();
    } catch (err: any) {
      this.errorMsg = err.message;
      this.loading = false;
    }
  }

  async unlinkBrand(brandId: string) {
    if (!confirm('Are you sure you want to remove this brand from this supplier?')) return;
    this.loading = true;
    this.errorMsg = '';
    
    try {
      const res = await fetch(`http://localhost:3001/v1/suppliers/${this.supplier.id}/brands/${brandId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.data.token}`
        }
      });
      
      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error?.message || 'Failed to unlink brand');
      }
      
      window.location.reload();
    } catch (err: any) {
      this.errorMsg = err.message;
      this.loading = false;
    }
  }
}
