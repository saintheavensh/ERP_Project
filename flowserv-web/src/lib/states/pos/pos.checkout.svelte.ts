import { invalidateAll } from '$app/navigation';
import { API_BASE } from '$lib/api/config';
import { autoPrint, type AutoPrintStatus } from '$lib/api/auto-print';
import type { PosProductsState } from './pos.products.svelte';
import type { PosCartState } from './pos.cart.svelte';
import type { PosCommonState } from './pos.svelte';

export class PosCheckoutState {
  data: any = $state({});
  productsState: PosProductsState;
  cartState: PosCartState;
  commonState: PosCommonState;

  showCheckoutModal = $state(false);
  // Tahap A — the radio binds on the method's id, not its type, so several
  // methods sharing one type (Dana/OVO/GoPay are all 'ewallet') each render as
  // a distinct, selectable option. The backend still receives the derived
  // `type` string (see selectedType + processCheckout), so its contract is
  // unchanged.
  selectedMethodId = $state('');
  selectedCustomerId = $state('');
  customerNameInput = $state('');
  showCustomerDropdown = $state(false);
  // Tahap B — uang tunai yang diterima kasir. Tipenya `string | number | null`
  // karena `bind:value` pada <input type="number"> menulis balik number (atau
  // null saat field dikosongkan), bukan string — mengasumsikan string di sini
  // membuat parsing di bawah melempar. Yang penting dipertahankan: "belum
  // diketik" (null/'') berbeda dari "0" — yang pertama sah (uang pas), yang
  // kedua kurang bayar.
  amountTenderedInput = $state<string | number | null>('');

  // Tahap B — invoice terakhir yang berhasil dibuat, disimpan supaya kasir
  // bisa mencetak ulang tanpa harus membuka halaman Riwayat (persis keluhan
  // yang memicu fitur ini). Bertahan sampai transaksi berikutnya dimulai.
  printedInvoice = $state<{ id: string; invoiceNumber: string } | null>(null);
  printStatus = $state<'printing' | AutoPrintStatus | null>(null);
  printMessage = $state('');
  // H13 — generated once when the checkout modal opens, not per fetch. A
  // retry (network drop, double click on "Bayar") reuses this same key so
  // the backend can recognize it as the same action, not a new sale.
  idempotencyKey = $state('');

  constructor(data: any, productsState: PosProductsState, cartState: PosCartState, commonState: PosCommonState) {
    this.data = data;
    this.productsState = productsState;
    this.cartState = cartState;
    this.commonState = commonState;
  }

  // Only active methods are selectable at checkout (a method can be
  // deactivated via Settings without deleting its history).
  get paymentMethods() {
    return (this.data.paymentMethods || []).filter((m: any) => m.isActive);
  }

  // The finite category the backend keys off (cash/transfer/qris/ewallet/tempo).
  // Falls back to 'cash' when nothing is selected — the same safe default the
  // store used before, so a tenant with zero seeded methods can still check out.
  get selectedType(): string {
    const m = this.paymentMethods.find((pm: any) => pm.id === this.selectedMethodId);
    return m?.type ?? 'cash';
  }

  get customers() {
    return this.data.customers || [];
  }

  // Tahap B — hanya tunai yang punya konsep "uang diserahkan". Mencerminkan
  // evaluateCashTender() di backend (lib/cash.ts), yang tetap penjaga sebenarnya.
  get isCash() {
    return this.selectedType === 'cash';
  }

  /** null = kasir belum mengetik apa pun (sah: uang pas). */
  get amountTendered(): number | null {
    const raw = this.amountTenderedInput;
    if (raw === null || raw === undefined || String(raw).trim() === '') return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }

  get changeAmount(): number {
    const tendered = this.amountTendered;
    if (tendered === null) return 0;
    return Math.round(tendered - this.cartState.grandTotal);
  }

  /** Nominal diketik tapi kurang dari total — tombol proses dikunci. */
  get tenderShort(): boolean {
    const tendered = this.amountTendered;
    return this.isCash && tendered !== null && tendered < this.cartState.grandTotal;
  }

  /** Tombol nominal cepat: uang pas + pecahan di atas total. */
  get quickTenderOptions(): number[] {
    const total = this.cartState.grandTotal;
    if (total <= 0) return [];
    const denominations = [5000, 10000, 20000, 50000, 100000];
    const options = new Set<number>([Math.ceil(total)]);
    // Pembulatan ke atas ke kelipatan tiap pecahan — cara pelanggan benar-benar
    // membayar (mis. total 73.500 → 75.000 / 80.000 / 100.000).
    for (const d of denominations) {
      const rounded = Math.ceil(total / d) * d;
      if (rounded > total) options.add(rounded);
    }
    return [...options].sort((a, b) => a - b).slice(0, 4);
  }

  // Same "search as you type, pick from a dropdown" pattern used by ticket
  // intake — only shown while the typed text doesn't already match a selection.
  get filteredCustomers() {
    return this.customerNameInput && !this.selectedCustomerId
      ? this.customers
          .filter((c: any) => c.name.toLowerCase().includes(this.customerNameInput.toLowerCase()))
          .slice(0, 5)
      : [];
  }

  searchCustomer() {
    this.selectedCustomerId = '';
    this.showCustomerDropdown = true;
  }

  selectCustomer(customer: any) {
    this.selectedCustomerId = customer.id;
    this.customerNameInput = customer.name;
    this.showCustomerDropdown = false;
  }

  openCheckout() {
    if (this.cartState.cart.length === 0) return;
    this.commonState.errorMsg = '';
    // Tahap B — default ke TUNAI bila tenant punya metode tunai aktif.
    // Sebelumnya memakai metode aktif pertama, yang pada data seed adalah
    // "Dana" (e-wallet) hanya karena urut abjad — kasir jadi harus mengklik
    // "Tunai" di setiap transaksi tunai, yaitu mayoritas transaksi di toko
    // servis. Ditemukan oleh tes e2e Tahap B, bukan lewat pembacaan kode.
    const cashMethod = this.paymentMethods.find((m: any) => m.type === 'cash');
    this.selectedMethodId = (cashMethod ?? this.paymentMethods[0])?.id ?? '';
    this.amountTenderedInput = '';
    // New action → new key. A retry within this same checkout attempt
    // (see processCheckout) must reuse it instead of generating a fresh one.
    this.idempotencyKey = crypto.randomUUID();
    this.showCheckoutModal = true;
  }

  async processCheckout() {
    // customerId is the link that actually enables credit — the backend
    // requires it for 'tempo' too (Zod + a Postgres CHECK), this is just the
    // fast client-side echo of that rule.
    if (this.selectedType === 'tempo' && !this.selectedCustomerId) {
      this.commonState.errorMsg = 'Pelanggan wajib dipilih dari daftar untuk pembayaran tempo!';
      return;
    }

    // Tahap B — echo cepat dari INSUFFICIENT_TENDER di backend, supaya kasir
    // tahu sebelum request terkirim. Backend tetap penjaga sebenarnya.
    if (this.tenderShort) {
      this.commonState.errorMsg = 'Uang yang diterima kurang dari total tagihan!';
      return;
    }

    this.commonState.processing = true;
    this.commonState.errorMsg = '';

    try {
      const payload = {
        branchId: this.productsState.selectedBranchId,
        customerName: this.customerNameInput || undefined,
        customerId: this.selectedCustomerId || undefined,
        serviceTicketId: undefined,
        paymentMethod: this.selectedType,
        // Tahap B — hanya dikirim untuk tunai yang benar-benar diisi; backend
        // mengabaikannya untuk metode lain, tapi tak perlu mengirim yang tak berarti.
        amountTendered: this.isCash && this.amountTendered !== null ? this.amountTendered : undefined,
        discountAmount: this.cartState.discountAmount,
        items: this.cartState.cart.map((item: any) =>
          item.sourceType === 'labor' || item.sourceType === 'fee'
            ? {
                sourceType: item.sourceType,
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice
              }
            : {
                sourceType: 'part',
                inventoryItemId: item.inventoryItemId,
                partBrandId: item.partBrandId || undefined,
                quantity: item.quantity,
                unitPrice: item.unitPrice
              }
        )
      };

      const res = await fetch(`${API_BASE}/pos/invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.data.token}`,
          'Idempotency-Key': this.idempotencyKey
        },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.error?.message || 'Gagal memproses transaksi');
      }

      this.commonState.successMsg = `Transaksi berhasil! Invoice: ${result.data.invoiceNumber}`;

      this.cartState.clearCart();
      this.customerNameInput = '';
      this.selectedCustomerId = '';
      this.amountTenderedInput = '';
      this.cartState.discountAmount = 0;
      this.showCheckoutModal = false;

      // Tahap B — struk langsung dikirim ke printer, tanpa dialog. Dijalankan
      // SETELAH transaksi sukses dan sengaja tidak di-await bersama alur
      // pembersihan di atas: keranjang harus sudah kosong dan kasir bebas
      // melayani pelanggan berikutnya meski printer lambat/mati.
      this.printedInvoice = { id: result.data.id, invoiceNumber: result.data.invoiceNumber };
      void this.printReceipt(result.data.id);

      await invalidateAll();
      setTimeout(() => this.commonState.successMsg = '', 5000);

    } catch (err: any) {
      this.commonState.errorMsg = err.message;
    } finally {
      this.commonState.processing = false;
    }
  }

  /**
   * Tahap B — kirim struk ke printer agent. Dipakai untuk cetak otomatis
   * setelah checkout DAN untuk tombol "Cetak Ulang" bila cetak pertama gagal.
   * Tidak pernah melempar (autoPrint sudah menangkap semuanya), jadi aman
   * dipanggil tanpa await.
   */
  async printReceipt(invoiceId: string) {
    this.printStatus = 'printing';
    this.printMessage = '';
    const result = await autoPrint(this.data.token, 'receipt', invoiceId);
    this.printStatus = result.status;
    this.printMessage = result.message ?? '';
  }

  dismissPrintStatus() {
    this.printStatus = null;
    this.printMessage = '';
    this.printedInvoice = null;
  }
}
