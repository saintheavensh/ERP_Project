import { untrack } from 'svelte';
import { invalidateAll } from '$app/navigation';
import { API_BASE } from '$lib/api/config';

export class TicketDetailState {
  data: any;
  token: string;

  loading = $state(false);
  errorMsg = $state('');

  // Transition form
  selectedTransition = $state('');
  transitionNotes = $state('');

  // Customer Edit
  showEditWarning = $state(false);
  showEditForm = $state(false);
  editCustomerData = $state({ name: '', phone: '', email: '' });

  constructor(data: any, token: string) {
    this.data = data;
    this.token = token;
  }

  get ticket() { return this.data.data?.ticket; }
  get customer() { return this.data.data?.customer; }
  get asset() { return this.data.data?.asset; }
  get history() { return this.data.data?.history || []; }
  get currentNode() { return this.data.data?.node; }
  get template() { return this.data.template; }

  // H7 — Charges
  chargeForm = $state<{ sourceType: 'part' | 'labor' | 'fee'; inventoryItemId: string; description: string; quantity: number; unitPrice: string }>({
    sourceType: 'part', inventoryItemId: '', description: '', quantity: 1, unitPrice: ''
  });
  chargeLoading = $state(false);

  get charges() { return this.data.charges?.charges || []; }
  get chargeTotals() { return this.data.charges?.totals || { estimated: 0, approved: 0, consumed: 0 }; }
  get chargeMargin() { return this.data.charges?.margin || { revenue: 0, cost: 0, margin: 0 }; }
  get inventoryItems() { return this.data.inventoryItems || []; }
  // A quote has already been requested once the ticket carries an approved total.
  get isQuoted() { return this.ticket?.approvedTotal != null; }

  resetChargeForm() {
    this.chargeForm = { sourceType: 'part', inventoryItemId: '', description: '', quantity: 1, unitPrice: '' };
  }

  private chargeHeaders() {
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.token}` };
  }

  async addCharge() {
    const f = this.chargeForm;
    const payload: any = { sourceType: f.sourceType, quantity: Number(f.quantity) };
    if (f.sourceType === 'part') {
      if (!f.inventoryItemId) { this.errorMsg = 'Pilih sparepart terlebih dahulu'; return; }
      payload.inventoryItemId = f.inventoryItemId;
      if (f.description) payload.description = f.description;
      if (f.unitPrice !== '') payload.unitPrice = Number(f.unitPrice); // else backend defaults from selling price
    } else {
      if (!f.description) { this.errorMsg = 'Isi deskripsi jasa/biaya'; return; }
      payload.description = f.description;
      payload.unitPrice = Number(f.unitPrice || 0);
    }

    this.chargeLoading = true;
    this.errorMsg = '';
    try {
      const res = await fetch(`${API_BASE}/tickets/${this.ticket.id}/charges`, {
        method: 'POST', headers: this.chargeHeaders(), body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (res.ok) { this.resetChargeForm(); await invalidateAll(); }
      else this.errorMsg = result.error?.message || 'Gagal menambah biaya';
    } catch { this.errorMsg = 'Network error'; }
    finally { this.chargeLoading = false; }
  }

  async deleteCharge(id: string) {
    this.chargeLoading = true;
    this.errorMsg = '';
    try {
      const res = await fetch(`${API_BASE}/tickets/${this.ticket.id}/charges/${id}`, {
        method: 'DELETE', headers: this.chargeHeaders()
      });
      const result = await res.json();
      if (res.ok) await invalidateAll();
      else this.errorMsg = result.error?.message || 'Gagal menghapus biaya';
    } catch { this.errorMsg = 'Network error'; }
    finally { this.chargeLoading = false; }
  }

  // H9 — physically deduct/restore an approved part charge from FIFO stock
  async consumeCharge(id: string) {
    this.chargeLoading = true;
    this.errorMsg = '';
    try {
      const res = await fetch(`${API_BASE}/tickets/${this.ticket.id}/charges/${id}/consume`, {
        method: 'POST', headers: this.chargeHeaders()
      });
      const result = await res.json();
      if (res.ok) await invalidateAll();
      else this.errorMsg = result.error?.message || 'Gagal memakai sparepart';
    } catch { this.errorMsg = 'Network error'; }
    finally { this.chargeLoading = false; }
  }

  async returnCharge(id: string) {
    this.chargeLoading = true;
    this.errorMsg = '';
    try {
      const res = await fetch(`${API_BASE}/tickets/${this.ticket.id}/charges/${id}/return`, {
        method: 'POST', headers: this.chargeHeaders()
      });
      const result = await res.json();
      if (res.ok) await invalidateAll();
      else this.errorMsg = result.error?.message || 'Gagal mengembalikan sparepart';
    } catch { this.errorMsg = 'Network error'; }
    finally { this.chargeLoading = false; }
  }

  async requestApproval() {
    this.chargeLoading = true;
    this.errorMsg = '';
    try {
      const res = await fetch(`${API_BASE}/tickets/${this.ticket.id}/quotation`, {
        method: 'POST', headers: this.chargeHeaders()
      });
      const result = await res.json();
      if (res.ok) await invalidateAll();
      else this.errorMsg = result.error?.message || 'Gagal meminta persetujuan';
    } catch { this.errorMsg = 'Network error'; }
    finally { this.chargeLoading = false; }
  }

  get availableTransitions() {
    if (!this.template || !this.currentNode) return [];
    return this.template.transitions
      .filter((t: any) => t.fromNodeId === this.currentNode.id)
      .map((t: any) => {
        const target = this.template.nodes.find((n: any) => n.id === t.toNodeId);
        return { ...t, targetNodeName: target?.name || 'Unknown' };
      });
  }

  async executeTransition() {
    if (!this.selectedTransition) return;
    this.loading = true;
    this.errorMsg = '';
    
    try {
      const res = await fetch(`${API_BASE}/tickets/${this.ticket.id}/transition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({
          targetNodeId: this.selectedTransition,
          notes: this.transitionNotes
        })
      });
      
      const result = await res.json();
      if (res.ok) {
        this.selectedTransition = '';
        this.transitionNotes = '';
        await invalidateAll();
      } else {
        this.errorMsg = result.error?.message || 'Transition failed. You might not have the required role.';
      }
    } catch (e) {
      this.errorMsg = 'Network error';
    } finally {
      this.loading = false;
    }
  }

  openEditCustomer() {
    this.editCustomerData = { name: this.customer.name, phone: this.customer.phone || '', email: this.customer.email || '' };
    this.showEditWarning = true;
  }
  
  proceedToEdit() {
    this.showEditWarning = false;
    this.showEditForm = true;
  }

  async saveCustomer() {
    this.loading = true;
    this.errorMsg = '';
    try {
      const res = await fetch(`${API_BASE}/customers/${this.customer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify(this.editCustomerData)
      });
      
      const result = await res.json();
      if (res.ok) {
        this.showEditForm = false;
        await invalidateAll();
      } else {
        this.errorMsg = result.error?.message || 'Failed to update customer';
      }
    } catch (e) {
      this.errorMsg = 'Network error';
    } finally {
      this.loading = false;
    }
  }
}
