import { goto } from '$app/navigation';
import { untrack } from 'svelte';
import { API_BASE } from '$lib/api/config';

export class PosHistoryState {
  data: any;
  token: string;

  selectedBranchId = $state('');
  selectedInvoiceDetail: any = $state(null);
  loadingDetail = $state(false);

  // H14 — payment modal for a tempo invoice, opened from InvoiceDetailModal.
  payingInvoice: any = $state(null);
  payAmount = $state(0);
  payMethod = $state('cash');
  payReferenceNumber = $state('');
  paySubmitting = $state(false);
  payError = $state('');
  // Minted when the modal opens (a new action), reused across retries of
  // submitPayment for this same modal session — never regenerated on retry.
  payIdempotencyKey = $state('');

  constructor(data: any, token: string) {
    this.data = data;
    this.token = token;

    $effect.root(() => {
      $effect(() => {
        if (this.data.selectedBranch && !this.selectedBranchId) {
          this.selectedBranchId = this.data.selectedBranch;
        }
      });
    });
  }

  get invoices() { return this.data.invoices; }
  get branches() { return this.data.branches; }

  handleFilter() {
    if (this.selectedBranchId) {
      goto(`?branchId=${this.selectedBranchId}`);
    } else {
      goto('?');
    }
  }

  async viewDetail(inv: any) {
    this.loadingDetail = true;
    this.selectedInvoiceDetail = inv; 
    try {
      const res = await fetch(`${API_BASE}/pos/invoices/${inv.id}`, {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      if (res.ok) {
        this.selectedInvoiceDetail = (await res.json()).data;
      }
    } catch (e) {
      console.error(e);
    } finally {
      this.loadingDetail = false;
    }
  }

  async handleVoid(id: string) {
    if (!confirm('Apakah Anda yakin ingin melakukan VOID transaksi ini? Stok akan dikembalikan ke gudang.')) return;
    
    try {
      const res = await fetch(`${API_BASE}/pos/invoices/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      if (res.ok) {
        alert('Transaksi berhasil dibatalkan (VOID).');
        window.location.reload();
      } else {
        const err = await res.json();
        alert('Gagal void: ' + err.error?.message);
      }
    } catch (e) {
      alert('Gagal menghubungi server');
    }
  }

  async handleEdit(invoice: any) {
    if (!confirm('Transaksi ini akan di-VOID dan isi keranjangnya akan disalin ke halaman Kasir. Lanjutkan?')) return;
    
    try {
      const res = await fetch(`${API_BASE}/pos/invoices/${invoice.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      if (!res.ok) throw new Error('Gagal membatalkan transaksi lama');
      
      if (invoice.lines) {
        const cartToRestore = invoice.lines.map((l: any) =>
          l.sourceType === 'labor' || l.sourceType === 'fee'
            ? {
                sourceType: l.sourceType,
                description: l.description,
                quantity: l.quantity,
                unitPrice: Number(l.unitPrice),
                name: l.description
              }
            : {
                sourceType: 'part',
                inventoryItemId: l.inventoryItemId,
                partBrandId: l.partBrandId || undefined,
                quantity: l.quantity,
                unitPrice: Number(l.unitPrice),
                name: l.inventoryItem?.name || l.description || 'Unknown',
                sku: l.inventoryItem?.sku || ''
              }
        );
        localStorage.setItem('pos_restore_cart', JSON.stringify({
          branchId: invoice.branchId,
          items: cartToRestore
        }));
      }
      
      window.location.href = '/pos';
    } catch (e: any) {
      alert('Gagal edit: ' + e.message);
    }
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
          'Authorization': `Bearer ${this.token}`,
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

  formatRp(num: string | number) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(Number(num));
  }
  
  formatDate(isoString: string) {
    return new Date(isoString).toLocaleString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }
}
