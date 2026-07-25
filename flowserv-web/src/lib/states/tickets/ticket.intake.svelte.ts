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
    // Tahap A — device catalog. Set only when the autocomplete below matched
    // an existing device_models row; cleared the instant the user edits
    // brand/model text manually (searchDeviceModel resets it first).
    deviceModelId: '',
    // Tahap A — go-live gap Tier-1 #2. Optional; recorded at intake, given
    // back at handover (QC Akhir).
    devicePasscode: '',
    // Tahap A — go-live gap Tier-1 #3. Feeds the label/tanda-terima print
    // documents ("kerusakan").
    reportedComplaint: '',
    flowTemplateId: '',
    branchId: '00000000-0000-0000-0000-000000000000'
  });

  loading = $state(false);
  errorMsg = $state('');

  showDropdown = $state(false);

  // Tahap A — device catalog autocomplete (brand/model → image/specs/saran
  // servis). Live backend search (debounced), unlike the customer dropdown
  // above which filters an already-fetched list — the catalog isn't preloaded
  // on this page.
  deviceModelResults = $state<any[]>([]);
  showDeviceDropdown = $state(false);
  selectedDeviceModel = $state<any | null>(null);
  private deviceSearchTimer: ReturnType<typeof setTimeout> | null = null;

  // Brand autocomplete: typing Brand suggests brands; picking one scopes the
  // Model search below to that brand only.
  brandResults = $state<any[]>([]);
  showBrandDropdown = $state(false);
  selectedBrandId = $state('');
  private brandSearchTimer: ReturnType<typeof setTimeout> | null = null;

  searchBrand() {
    // Editing the brand invalidates any prior brand/model selection.
    this.selectedBrandId = '';
    this.form.deviceModelId = '';
    this.selectedDeviceModel = null;
    this.showBrandDropdown = true;
    if (this.brandSearchTimer) clearTimeout(this.brandSearchTimer);
    const q = this.form.assetBrand.trim();
    if (q.length < 1) { this.brandResults = []; return; }
    this.brandSearchTimer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/device-catalog/brands?q=${encodeURIComponent(q)}`, {
          headers: { Authorization: `Bearer ${this.token}` },
        });
        if (res.ok) this.brandResults = (await res.json()).data || [];
      } catch {
        // Brand search failing must never block manual entry.
      }
    }, 250);
  }

  selectBrand(b: any) {
    this.form.assetBrand = b.name;
    this.selectedBrandId = b.id;
    this.brandResults = [];
    this.showBrandDropdown = false;
    // Model picks are now scoped to this brand — clear any stale one.
    this.form.deviceModelId = '';
    this.selectedDeviceModel = null;
  }

  searchDeviceModel() {
    this.form.deviceModelId = '';
    this.selectedDeviceModel = null;
    this.showDeviceDropdown = true;
    if (this.deviceSearchTimer) clearTimeout(this.deviceSearchTimer);
    const modelQ = this.form.assetModel.trim();
    // With a chosen brand we can list its models even before typing; without
    // one, require 2+ chars of model text to search across all brands.
    if (!this.selectedBrandId && modelQ.length < 2) { this.deviceModelResults = []; return; }
    const params = new URLSearchParams();
    if (this.selectedBrandId) params.set('brandId', this.selectedBrandId);
    if (modelQ) params.set('q', modelQ);
    this.deviceSearchTimer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/device-catalog/models?${params.toString()}`, {
          headers: { Authorization: `Bearer ${this.token}` },
        });
        if (res.ok) this.deviceModelResults = (await res.json()).data || [];
      } catch {
        // Catalog search failing must never block manual brand/model entry.
      }
    }, 250);
  }

  selectDeviceModel(m: any) {
    this.form.deviceModelId = m.id;
    this.form.assetBrand = m.brandName;
    this.form.assetModel = m.name;
    this.selectedBrandId = m.deviceBrandId ?? '';
    this.selectedDeviceModel = m;
    this.showDeviceDropdown = false;
    this.showBrandDropdown = false;
  }

  appendSuggestedService(text: string) {
    this.form.reportedComplaint = this.form.reportedComplaint
      ? `${this.form.reportedComplaint}, ${text}`
      : text;
  }

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
