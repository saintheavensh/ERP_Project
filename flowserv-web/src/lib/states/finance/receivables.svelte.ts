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

  constructor(data: any) {
    this.data = data;
  }

  get receivables() {
    return this.data.receivables || [];
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
