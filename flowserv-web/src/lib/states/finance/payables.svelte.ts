import { differenceInDays, format } from 'date-fns';
import { id } from 'date-fns/locale';
import { API_BASE } from '$lib/api/config';

export class PayablesState {
  data: any;

  // Pay modal
  payingInvoice: any = $state(null);
  payAmount = $state(0);
  payMethod = $state('cash');
  payReferenceNumber = $state('');
  paySubmitting = $state(false);
  payError = $state('');
  // H13 — minted when the modal opens (a new action), reused across retries
  // of submitPayment for this same modal session.
  payIdempotencyKey = $state('');

  constructor(data: any) {
    this.data = data;
  }

  get payables() {
    return this.data.payables || [];
  }

  outstandingBalance(p: any) {
    return Number(p.totalAmount) - Number(p.amountPaid);
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
      const res = await fetch(`${API_BASE}/finance/payables/${this.payingInvoice.id}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.data.token}`,
          'Idempotency-Key': this.payIdempotencyKey
        },
        body: JSON.stringify({
          amount: this.payAmount,
          paymentMethod: this.payMethod,
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

  getStatusColor(dueDateStr: string | null) {
    if (!dueDateStr) return 'text-slate-500 bg-slate-100';
    const dueDate = new Date(dueDateStr);
    const today = new Date();
    const diff = differenceInDays(dueDate, today);

    if (diff < 0) return 'text-red-700 bg-red-100 font-bold'; 
    if (diff <= 3) return 'text-orange-700 bg-orange-100 font-medium'; 
    return 'text-green-700 bg-green-100'; 
  }

  getStatusText(dueDateStr: string | null) {
    if (!dueDateStr) return 'N/A';
    const dueDate = new Date(dueDateStr);
    const today = new Date();
    const diff = differenceInDays(dueDate, today);

    if (diff < 0) return `Jatuh Tempo (Lewat ${Math.abs(diff)} hari)`;
    if (diff === 0) return 'Jatuh Tempo Hari Ini';
    return `${diff} hari lagi`;
  }
  
  formatDate(date: string) {
    return format(new Date(date), 'dd MMM yyyy', { locale: id });
  }
}
