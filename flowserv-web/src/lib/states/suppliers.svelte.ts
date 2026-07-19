export class SuppliersState {
  data: any;
  showAddModal = $state(false);
  form = $state<any>({
    name: '',
    email: '',
    photoUrl: '',
    contactInfo: '',
    type: 'wholesale',
    paymentType: 'cash',
    paymentTermDays: 0,
    returnPolicyDays: 0,
    warrantyPolicyDays: 0,
    returnWarrantyNotes: ''
  });
  loading = $state(false);
  errorMsg = $state('');

  constructor(data: any) {
    this.data = data;
  }

  get suppliers() {
    return this.data.suppliers || [];
  }

  resetForm() {
    this.form = {
      name: '',
      email: '',
      photoUrl: '',
      contactInfo: '',
      type: 'wholesale',
      paymentType: 'cash',
      paymentTermDays: 0,
      returnPolicyDays: 0,
      warrantyPolicyDays: 0,
      returnWarrantyNotes: ''
    };
  }

  async addSupplier() {
    this.loading = true;
    this.errorMsg = '';
    
    try {
      const payload = { ...this.form };
      if (payload.returnPolicyDays === 0) delete (payload as any).returnPolicyDays;
      if (payload.warrantyPolicyDays === 0) delete (payload as any).warrantyPolicyDays;
      if (payload.paymentType === 'cash') payload.paymentTermDays = 0;
      delete (payload as any).paymentType;
      
      const res = await fetch('http://localhost:3001/v1/suppliers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.data.token}`
        },
        body: JSON.stringify(payload)
      });
      
      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.error?.message || 'Failed to add supplier');
      }
      
      window.location.reload();
    } catch (err: any) {
      this.errorMsg = err.message;
      this.loading = false;
    }
  }

  async deleteSupplier(id: string) {
    if (!confirm('Are you sure you want to delete this supplier? This action cannot be undone if there are no linked transactions.')) return;
    
    try {
      const res = await fetch(`http://localhost:3001/v1/suppliers/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.data.token}`
        }
      });
      
      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.error?.message || 'Failed to delete supplier');
      }
      
      window.location.reload();
    } catch (err: any) {
      alert(err.message);
    }
  }
}
