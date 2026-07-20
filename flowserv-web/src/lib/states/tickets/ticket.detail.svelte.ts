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
