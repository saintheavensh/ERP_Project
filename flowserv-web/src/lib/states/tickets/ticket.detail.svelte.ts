import { untrack } from 'svelte';
import { invalidateAll } from '$app/navigation';
import { API_BASE } from '$lib/api/config';

export class TicketDetailState {
  // $state so every getter that reads `this.data` (ticket, currentNode, charges…)
  // is reactive. Without this, invalidateAll() after an action (transition,
  // consume, invoice) updated the page's `data` prop but NOT this captured copy,
  // so the workspace showed stale state until a full reload. The +page.svelte
  // syncs this via $effect. (Found by the H15-gap-(b) Playwright walk.)
  data = $state<any>(undefined);
  token: string;

  loading = $state(false);
  errorMsg = $state('');
  successMsg = $state('');

  // Transition form
  selectedTransition = $state('');
  transitionNotes = $state('');
  // H13 — generated when a target stage is picked (a new action), reused
  // across retries of THIS action (see executeTransition), cleared once the
  // transition succeeds so the next action gets a fresh key.
  transitionIdempotencyKey = $state('');

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

  // F1 — technician assignment (wires H8's previously-orphaned POST /:id/assign)
  get assignedTechnician() { return this.data.data?.assignedTechnician; }
  get technicians() { return this.data.technicians || []; }
  assignLoading = $state(false);

  async assign(technicianId: string) {
    if (!technicianId) return;
    this.assignLoading = true;
    this.errorMsg = '';
    try {
      const res = await fetch(`${API_BASE}/tickets/${this.ticket.id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.token}`, 'Idempotency-Key': crypto.randomUUID() },
        body: JSON.stringify({ technicianId })
      });
      const result = await res.json();
      if (res.ok) await invalidateAll();
      else this.errorMsg = result.error?.message || 'Gagal menugaskan teknisi';
    } catch { this.errorMsg = 'Network error'; }
    finally { this.assignLoading = false; }
  }

  // Tahap A — go-live gap Tier-1 #2/#3. Sandi/pola + keluhan/kerusakan:
  // editable at any point, not just at intake (lets a mis-keyed value be
  // corrected, or sandi/pola cleared once handed back to the customer at QC
  // Akhir). Both fields share one PATCH endpoint but get independent edit
  // affordances in the UI, so editing one never touches the other.
  passcodeEditing = $state(false);
  passcodeDraft = $state('');
  passcodeLoading = $state(false);

  openPasscodeEdit() {
    this.passcodeDraft = this.ticket?.devicePasscode || '';
    this.passcodeEditing = true;
  }

  async savePasscode() {
    this.passcodeLoading = true;
    this.errorMsg = '';
    try {
      const res = await fetch(`${API_BASE}/tickets/${this.ticket.id}/intake-details`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.token}` },
        body: JSON.stringify({ devicePasscode: this.passcodeDraft || null })
      });
      const result = await res.json();
      if (res.ok) {
        this.passcodeEditing = false;
        await invalidateAll();
      } else {
        this.errorMsg = result.error?.message || 'Gagal menyimpan sandi/pola';
      }
    } catch { this.errorMsg = 'Network error'; }
    finally { this.passcodeLoading = false; }
  }

  complaintEditing = $state(false);
  complaintDraft = $state('');
  complaintLoading = $state(false);

  openComplaintEdit() {
    this.complaintDraft = this.ticket?.reportedComplaint || '';
    this.complaintEditing = true;
  }

  async saveComplaint() {
    this.complaintLoading = true;
    this.errorMsg = '';
    try {
      const res = await fetch(`${API_BASE}/tickets/${this.ticket.id}/intake-details`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.token}` },
        body: JSON.stringify({ reportedComplaint: this.complaintDraft || null })
      });
      const result = await res.json();
      if (res.ok) {
        this.complaintEditing = false;
        await invalidateAll();
      } else {
        this.errorMsg = result.error?.message || 'Gagal menyimpan keluhan';
      }
    } catch { this.errorMsg = 'Network error'; }
    finally { this.complaintLoading = false; }
  }

  // Tahap A — go-live gap Tier-1 #3 (print triggers). Print-button visibility
  // conditions, each tied to a real, already-tracked signal rather than the
  // current node's name (which would break the moment a tenant renames a
  // node) except where the document is inherently node-specific (tanda
  // terima only makes sense for a unit that actually went into storage).
  get canPrintLabel() {
    // "Diagnosis complete" is approximated as "left Intake" — true the
    // instant the ticket has been diagnosed, in every template (all three
    // seeded templates name their first node "Intake").
    return !!this.currentNode && this.currentNode.name !== 'Intake';
  }

  get hasEnteredUnitDisimpan() {
    return this.history.some((h: any) => h.nodeName === 'Unit Disimpan');
  }

  get invoice() { return this.data.data?.invoice ?? null; }

  // Tahap A — device catalog. Null when the asset isn't linked to a catalog
  // entry (the common case: freeform brand/model text with no match yet).
  get deviceModel() { return this.data.data?.deviceModel ?? null; }

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

  // H13 — one key per charge id, minted on the first attempt and reused by a
  // retry of that SAME attempt. Cleared on success so a later consume of the
  // same charge id (return → re-consume) mints a genuinely new key instead of
  // replaying the earlier, no-longer-applicable response.
  private consumeIdempotencyKeys = new Map<string, string>();

  // H9 — physically deduct/restore an approved part charge from FIFO stock
  async consumeCharge(id: string) {
    this.chargeLoading = true;
    this.errorMsg = '';
    if (!this.consumeIdempotencyKeys.has(id)) {
      this.consumeIdempotencyKeys.set(id, crypto.randomUUID());
    }
    try {
      const res = await fetch(`${API_BASE}/tickets/${this.ticket.id}/charges/${id}/consume`, {
        method: 'POST',
        headers: { ...this.chargeHeaders(), 'Idempotency-Key': this.consumeIdempotencyKeys.get(id)! }
      });
      const result = await res.json();
      if (res.ok) {
        this.consumeIdempotencyKeys.delete(id);
        await invalidateAll();
      }
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

  // H10 — cancel an approved charge before it's consumed, releasing its stock reservation
  async cancelCharge(id: string) {
    this.chargeLoading = true;
    this.errorMsg = '';
    try {
      const res = await fetch(`${API_BASE}/tickets/${this.ticket.id}/charges/${id}/cancel`, {
        method: 'POST', headers: this.chargeHeaders()
      });
      const result = await res.json();
      if (res.ok) await invalidateAll();
      else this.errorMsg = result.error?.message || 'Gagal membatalkan biaya';
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

  // H17 — service invoice from the ticket. A part is billable once consumed;
  // labor/fee once approved. Mirrors isBillableCharge() in the backend service.
  get canInvoice() {
    return this.charges.some((c: any) =>
      (c.sourceType === 'part' && c.status === 'consumed') ||
      ((c.sourceType === 'labor' || c.sourceType === 'fee') && c.status === 'approved')
    );
  }

  invoicePaymentMethod = $state<'cash' | 'transfer' | 'qris' | 'tempo'>('tempo');
  // H13 pattern — minted when the invoice action starts, reused across retries,
  // cleared on success so a later (blocked) retry doesn't replay a stale response.
  private invoiceIdempotencyKey = '';

  async generateInvoice() {
    this.chargeLoading = true;
    this.errorMsg = '';
    this.successMsg = '';
    if (!this.invoiceIdempotencyKey) this.invoiceIdempotencyKey = crypto.randomUUID();
    try {
      const res = await fetch(`${API_BASE}/tickets/${this.ticket.id}/invoice`, {
        method: 'POST',
        headers: { ...this.chargeHeaders(), 'Idempotency-Key': this.invoiceIdempotencyKey },
        body: JSON.stringify({ paymentMethod: this.invoicePaymentMethod })
      });
      const result = await res.json();
      if (res.ok) {
        this.invoiceIdempotencyKey = '';
        this.successMsg = `Faktur dibuat: ${result.data.invoiceNumber}`;
        await invalidateAll();
      } else {
        this.errorMsg = result.error?.message || 'Gagal membuat faktur';
      }
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

  // H13 — sets the target AND mints a fresh idempotency key: picking a
  // transition is "starting a new action". Executing (possibly retried) reuses it.
  selectTransition(nodeId: string) {
    this.selectedTransition = nodeId;
    this.transitionIdempotencyKey = nodeId ? crypto.randomUUID() : '';
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
          'Authorization': `Bearer ${this.token}`,
          'Idempotency-Key': this.transitionIdempotencyKey || crypto.randomUUID()
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
        this.transitionIdempotencyKey = '';
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

  // F3 — SVC-013: cancel the ticket. Mirrors canCancelTicket() in the backend
  // service (open-only) purely for UI gating; the API is the real guard.
  get canCancel() { return this.ticket?.status === 'open'; }
  showCancelModal = $state(false);
  cancelReason = $state('');
  cancelLoading = $state(false);

  openCancelModal() {
    this.cancelReason = '';
    this.errorMsg = '';
    this.showCancelModal = true;
  }

  async confirmCancelTicket() {
    if (!this.cancelReason.trim()) { this.errorMsg = 'Alasan pembatalan wajib diisi'; return; }
    this.cancelLoading = true;
    this.errorMsg = '';
    try {
      const res = await fetch(`${API_BASE}/tickets/${this.ticket.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.token}` },
        body: JSON.stringify({ reason: this.cancelReason })
      });
      const result = await res.json();
      if (res.ok) {
        this.showCancelModal = false;
        this.successMsg = result.data?.consumedPartsLeftBehind
          ? `Tiket dibatalkan. Perhatian: ${result.data.consumedPartsLeftBehind} sparepart yang sudah terpasang tidak otomatis dikembalikan ke stok.`
          : 'Tiket berhasil dibatalkan.';
        await invalidateAll();
      } else {
        this.errorMsg = result.error?.message || 'Gagal membatalkan tiket';
      }
    } catch { this.errorMsg = 'Network error'; }
    finally { this.cancelLoading = false; }
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
