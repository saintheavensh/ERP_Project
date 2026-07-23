import { goto } from '$app/navigation';
import { API_BASE } from '$lib/api/config';

export class TicketIntakeState {
  data: any;
  token: string;

  form = $state({
    customerId: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    assetId: '',
    assetType: '',
    assetBrand: '',
    assetModel: '',
    assetSn: '',
    flowTemplateId: '',
    branchId: '00000000-0000-0000-0000-000000000000'
  });

  loading = $state(false);
  errorMsg = $state('');

  showDropdown = $state(false);

  constructor(data: any, token: string) {
    this.data = data;
    this.token = token;

    // F7 — arrived via "Create Ticket" on a customer's device: pre-fill and
    // lock the customer + device fields (IntakeForm.svelte reads assetId to
    // decide whether to show the read-only device summary or the create-new form).
    if (data.prefill) {
      this.form.customerId = data.prefill.customerId ?? '';
      this.form.customerName = data.prefill.customerName ?? '';
      this.form.customerPhone = data.prefill.customerPhone ?? '';
      this.form.customerEmail = data.prefill.customerEmail ?? '';
      if (data.prefill.assetId) {
        this.form.assetId = data.prefill.assetId;
        this.form.assetType = data.prefill.assetType ?? '';
        this.form.assetBrand = data.prefill.assetBrand ?? '';
        this.form.assetModel = data.prefill.assetModel ?? '';
        this.form.assetSn = data.prefill.assetSn ?? '';
      }
    }
  }

  get templates() { return this.data.templates; }
  get customersList() { return this.data.customers || []; }

  get filteredCustomers() {
    return this.form.customerName && !this.form.customerId 
      ? this.customersList.filter((c: any) => c.name.toLowerCase().includes(this.form.customerName.toLowerCase())).slice(0, 5)
      : [];
  }

  searchCustomer() {
    this.form.customerId = ''; 
    this.showDropdown = true;
  }

  selectCustomer(c: any) {
    this.form.customerId = c.id;
    this.form.customerName = c.name;
    this.form.customerPhone = c.phone || '';
    this.form.customerEmail = c.email || '';
    this.showDropdown = false;
  }

  async submitIntake() {
    this.loading = true;
    this.errorMsg = '';
    
    if (!this.form.customerName || !this.form.assetType || !this.form.flowTemplateId) {
      this.errorMsg = 'Name, Device Type, and Flow Template are required.';
      this.loading = false;
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/tickets/intake`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify(this.form)
      });
      
      const result = await res.json();
      if (res.ok) {
        goto(`/tickets/${result.data.id}`);
      } else {
        this.errorMsg = result.error?.message || 'Failed to create intake';
      }
    } catch (e) {
      this.errorMsg = 'Network error';
    } finally {
      this.loading = false;
    }
  }
}
