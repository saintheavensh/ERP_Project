import { invalidateAll } from '$app/navigation';
import { API_BASE } from '$lib/api/config';

export class CustomerDetailState {
  data: any;
  token: string;

  showModal = $state(false);
  newAsset = $state({ assetType: '', brand: '', model: '', serialNumber: '' });
  loading = $state(false);
  errorMsg = $state('');

  constructor(data: any, token: string) {
    this.data = data;
    this.token = token;
  }

  // Optimistic override for the tempo flag. The page builds this state once from
  // the load `data` and reads via getters, so invalidateAll() alone doesn't
  // re-render the flipped value in place; this local $state makes the toggle
  // reflect immediately. Null = show whatever the loaded customer says.
  tempoOverride = $state<boolean | null>(null);

  get customer() {
    const c = this.data.customer;
    if (c && this.tempoOverride !== null) return { ...c, allowTempo: this.tempoOverride };
    return c;
  }
  get assets() { return this.data.assets; }

  // D1 — grant/revoke tempo (utang) for this customer. Reuses PUT /customers/:id
  // (editCustomerSchema requires name), so we resend the current identity fields
  // alongside the flipped flag.
  tempoSaving = $state(false);
  async setAllowTempo(allow: boolean) {
    this.tempoSaving = true;
    this.errorMsg = '';
    try {
      const res = await fetch(`${API_BASE}/customers/${this.customer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.token}` },
        body: JSON.stringify({
          name: this.customer.name,
          phone: this.customer.phone || '',
          email: this.customer.email || '',
          allowTempo: allow,
        }),
      });
      const result = await res.json();
      if (res.ok) {
        this.tempoOverride = allow; // reflect immediately
        await invalidateAll();
      } else {
        this.errorMsg = result.error?.message || 'Gagal memperbarui izin tempo';
      }
    } catch {
      this.errorMsg = 'Network error';
    } finally {
      this.tempoSaving = false;
    }
  }

  async createAsset() {
    this.loading = true;
    this.errorMsg = '';
    try {
      const res = await fetch(`${API_BASE}/customers/${this.customer.id}/assets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify(this.newAsset)
      });
      
      const result = await res.json();
      if (res.ok) {
        this.showModal = false;
        this.newAsset = { assetType: '', brand: '', model: '', serialNumber: '' };
        await invalidateAll();
      } else {
        this.errorMsg = result.error?.message || 'Failed to create asset';
      }
    } catch (e) {
      this.errorMsg = 'Network error';
    } finally {
      this.loading = false;
    }
  }
}
