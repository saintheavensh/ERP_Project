import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { API_BASE } from '$lib/api/config';

// H14/FIN-003 — mirrors PayablesState exactly (customer-side symmetry with
// supplier-side), pointed at pos_invoices instead of supplier_invoices.
export class ReceivablesState {
  data: any;

  // Pay modal
  payingInvoice: any = $state(null);
  payAmount = $state(0);
  payMethod = $state('cash');
  payReferenceNumber = $state('');
  paySubmitting = $state(false);
  payError = $state('');
  payIdempotencyKey = $state('');

  // R1.8-T2 — rincian satu tagihan (uji-R1.7 A1). Pemilik: "lebih baik jika
  // kasir bisa melihat detail transaksi piutangnya". Alasannya operasional:
  // kasir yang menagih perlu tahu tagihan ini isinya apa sebelum menerima uang.
  detailInvoice: any = $state(null);
  loadingDetail = $state(false);
  detailError = $state('');

  constructor(data: any) {
    this.data = data;
  }

  get receivables() {
    return this.data.receivables || [];
  }

  /**
   * Daftar piutang tidak membawa baris item maupun riwayat pembayaran — jadi
   * rinciannya diambil saat dibuka, bukan ikut di setiap baris tabel. Selain
   * lebih ringan, itu juga menjaga daftar tetap sekadar daftar.
   *
   * Endpoint-nya `GET /v1/pos/invoices/:id`, yang memang sudah boleh dipanggil
   * kasir (digerbangi login saja, bukan izin keuangan). Tidak ada izin baru
   * yang ditambahkan di sini — /finance, /finance/ledger, dan /finance/payables
   * tetap tertutup untuk kasir.
   */
  async openDetail(invoice: any) {
    this.detailInvoice = invoice;
    this.detailError = '';
    this.loadingDetail = true;
    try {
      const res = await fetch(`${API_BASE}/pos/invoices/${invoice.id}`, {
        headers: { Authorization: `Bearer ${this.data.token}` },
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error?.message || 'Gagal memuat rincian tagihan');
      // Hasil dari server menimpa baris daftar, bukan menggantikannya mentah:
      // baris daftar sudah membawa nama pelanggan hasil join yang tidak selalu
      // ikut di respons detail.
      this.detailInvoice = { ...invoice, ...result.data };
    } catch (err: any) {
      this.detailError = err.message;
    } finally {
      this.loadingDetail = false;
    }
  }

  closeDetail() {
    this.detailInvoice = null;
    this.detailError = '';
  }

  outstandingBalance(inv: any) {
    return Number(inv.grandTotal) - Number(inv.amountPaid);
  }

  openPayModal(invoice: any) {
    this.payingInvoice = invoice;
    this.payAmount = this.outstandingBalance(invoice);
    this.payMethod = 'cash';
    this.payReferenceNumber = '';
    this.payError = '';
    this.payIdempotencyKey = crypto.randomUUID();
  }

  closePayModal() {
    this.payingInvoice = null;
  }

  async submitPayment() {
    if (!this.payingInvoice) return;
    this.paySubmitting = true;
    this.payError = '';

    try {
      const res = await fetch(`${API_BASE}/pos/invoices/${this.payingInvoice.id}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.data.token}`,
          'Idempotency-Key': this.payIdempotencyKey
        },
        body: JSON.stringify({
          amount: this.payAmount,
          method: this.payMethod,
          referenceNumber: this.payReferenceNumber || undefined
        })
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error?.message || 'Gagal mencatat pembayaran');
      }

      window.location.reload();
    } catch (err: any) {
      this.payError = err.message;
      this.paySubmitting = false;
    }
  }

  formatMoney(amount: number | string) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(amount));
  }

  formatDate(date: string) {
    return format(new Date(date), 'dd MMM yyyy', { locale: id });
  }
}
