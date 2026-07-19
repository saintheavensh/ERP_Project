import { goto } from '$app/navigation';
import { untrack } from 'svelte';

export class PosHistoryState {
  data: any;
  token: string;

  selectedBranchId = $state('');
  selectedInvoiceDetail: any = $state(null);
  loadingDetail = $state(false);

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
      const res = await fetch(`http://localhost:3001/v1/pos/invoices/${inv.id}`, {
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
      const res = await fetch(`http://localhost:3001/v1/pos/invoices/${id}`, {
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
      const res = await fetch(`http://localhost:3001/v1/pos/invoices/${invoice.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      if (!res.ok) throw new Error('Gagal membatalkan transaksi lama');
      
      if (invoice.lines) {
        const cartToRestore = invoice.lines.map((l: any) => ({
          inventoryItemId: l.inventoryItemId,
          quantity: l.quantity,
          unitPrice: Number(l.unitPrice),
          name: l.inventoryItem?.name || 'Unknown',
          sku: l.inventoryItem?.sku || ''
        }));
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
