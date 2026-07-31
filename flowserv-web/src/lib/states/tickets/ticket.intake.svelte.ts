import { goto } from '$app/navigation';
import { API_BASE } from '$lib/api/config';
import { autoPrint, summarizeAutoPrint, DOCUMENT_LABELS, type AutoPrintDocumentType } from '$lib/api/auto-print';

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

  // R1.5D — kasir TIDAK lagi dilempar ke halaman detail setelah simpan.
  // Pemilik (uji-R1 A9): "jangan langsung ke halaman detail, buat saja toast
  // notifikasi tiket baru berhasil dibuat". Alasannya operasional — saat toko
  // ramai, unit diterima berturut-turut, dan tiap lemparan ke detail memaksa
  // kasir menekan "kembali" sebelum bisa melayani orang berikutnya.
  sukses = $state<{ id: string; ticketNumber: string } | null>(null);
  printMessage = $state('');

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
    
    // Tahap B — flowTemplateId tak lagi wajib: alur ditentukan setelah
    // diagnosis, dan backend memakai template default toko bila tak dikirim.
    if (!this.form.customerName || !this.form.assetType) {
      this.errorMsg = 'Nama pelanggan dan jenis perangkat wajib diisi.';
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
        // R1.5D — tetap di form. Cetak otomatis TIDAK hilang: dulu ia dipicu
        // oleh `?autoprint=intake` di halaman detail, jadi menghapus lemparan
        // itu tanpa memindahkan pemicunya akan diam-diam mematikan label —
        // tepat hal yang pemilik minta ada (uji-R1 A7). Sekarang dipicu dari
        // sini, lewat helper `autoPrint()` yang SAMA, jadi tak ada jalur cetak
        // kedua yang bisa berbeda perilaku.
        this.sukses = {
          id: result.data.id,
          ticketNumber: result.data.ticketNumber ?? result.data.id.slice(0, 8),
        };
        this.resetForNextCustomer();
        void this.autoPrintIntakeDocuments(result.data.id);
      } else {
        this.errorMsg = result.error?.message || 'Failed to create intake';
      }
    } catch (e) {
      this.errorMsg = 'Network error';
    } finally {
      this.loading = false;
    }
  }

  /**
   * Kosongkan form untuk pelanggan berikutnya.
   *
   * `branchId` dan `flowTemplateId` sengaja TIDAK direset: keduanya properti
   * konter tempat kasir berdiri, bukan properti pelanggan. Mengosongkannya
   * akan memaksa kasir memilih ulang cabang yang sama tiap unit — persis
   * kerepotan yang task ini ada untuk menghapus.
   */
  resetForNextCustomer() {
    this.form.customerId = '';
    this.form.customerName = '';
    this.form.customerPhone = '';
    this.form.customerEmail = '';
    this.form.assetId = '';
    this.form.assetType = '';
    this.form.assetBrand = '';
    this.form.assetModel = '';
    this.form.assetSn = '';
    this.form.devicePasscode = '';
    this.form.reportedComplaint = '';
    this.form.deviceModelId = '';
    this.selectedDeviceModel = null;
    this.selectedBrandId = '';
    this.showDropdown = false;
    this.showDeviceDropdown = false;
    this.showBrandDropdown = false;
    this.errorMsg = '';
  }

  /**
   * Cetak dokumen yang dikonfigurasi pada tahap awal tiket yang baru dibuat.
   *
   * Dokumen mana yang keluar tetap dibaca dari `flow_nodes.autoPrintDocuments`
   * (bukan daftar tertanam di sini), sama seperti halaman detail — toko yang
   * mengubah templatenya langsung berubah juga di sini.
   */
  async autoPrintIntakeDocuments(ticketId: string) {
    this.printMessage = '';
    try {
      const res = await fetch(`${API_BASE}/tickets/${ticketId}`, {
        headers: { Authorization: `Bearer ${this.token}` },
      });
      if (!res.ok) return;
      const docs = (await res.json()).data?.node?.autoPrintDocuments;
      if (!Array.isArray(docs) || docs.length === 0) return;

      // Berurutan, bukan paralel: satu printer thermal memproses satu job pada
      // satu waktu, dan urutan konfigurasi menentukan urutan kertas keluar.
      const results = [];
      for (const doc of docs) {
        results.push({
          label: DOCUMENT_LABELS[doc] ?? doc,
          result: await autoPrint(this.token, doc as AutoPrintDocumentType, ticketId),
        });
      }
      this.printMessage = summarizeAutoPrint(results) ?? '';
    } catch {
      // Cetak gagal tidak boleh menghapus bukti bahwa tiketnya BERHASIL dibuat.
      this.printMessage = 'Tiket tersimpan, tapi cetak label gagal. Cetak manual dari halaman tiket.';
    }
  }
}
