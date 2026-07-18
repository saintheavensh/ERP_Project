<script lang="ts">
  import { goto } from '$app/navigation';
  
  let { data } = $props();
  
  // Data lists
  let invoices = $derived(data.invoices);
  let branches = $derived(data.branches);
  
  // State
  let selectedBranchId = $state('');

  let selectedInvoiceDetail: any = $state(null);
  let loadingDetail = $state(false);

  $effect(() => {
    if (data.selectedBranch && !selectedBranchId) {
      selectedBranchId = data.selectedBranch;
    }
  });

  function handleFilter() {
    if (selectedBranchId) {
      goto(`?branchId=${selectedBranchId}`);
    } else {
      goto('?');
    }
  }

  async function viewDetail(inv: any) {
    loadingDetail = true;
    selectedInvoiceDetail = inv; // set initial data
    try {
      const res = await fetch(`http://localhost:3001/v1/pos/invoices/${inv.id}`, {
        headers: { 'Authorization': `Bearer ${data.token}` }
      });
      if (res.ok) {
        selectedInvoiceDetail = (await res.json()).data;
      }
    } catch (e) {
      console.error(e);
    } finally {
      loadingDetail = false;
    }
  }

  async function handleVoid(id: string) {
    if (!confirm('Apakah Anda yakin ingin melakukan VOID transaksi ini? Stok akan dikembalikan ke gudang.')) return;
    
    try {
      const res = await fetch(`http://localhost:3001/v1/pos/invoices/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${data.token}` }
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

  async function handleEdit(invoice: any) {
    if (!confirm('Transaksi ini akan di-VOID dan isi keranjangnya akan disalin ke halaman Kasir. Lanjutkan?')) return;
    
    try {
      const res = await fetch(`http://localhost:3001/v1/pos/invoices/${invoice.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${data.token}` }
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

  const formatRp = (num: string | number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(Number(num));
  };
  
  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };
</script>

<div class="p-6 max-w-7xl mx-auto">
  <div class="flex justify-between items-center mb-6">
    <div>
      <h1 class="text-2xl font-bold text-slate-800">Riwayat Penjualan (POS)</h1>
      <p class="text-slate-500 text-sm mt-1">Daftar transaksi kasir yang telah selesai</p>
    </div>
    
    <div class="flex items-center space-x-3">
      <select bind:value={selectedBranchId} onchange={handleFilter} class="border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-blue-500 focus:border-blue-500">
        <option value="">Semua Cabang</option>
        {#each branches as branch}
          <option value={branch.id}>{branch.name}</option>
        {/each}
      </select>
      
      <a href="/pos" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center">
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
        Kasir Baru
      </a>
    </div>
  </div>

  <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
            <th class="p-4 font-medium">Tanggal</th>
            <th class="p-4 font-medium">No. Invoice</th>
            <th class="p-4 font-medium">Pelanggan</th>
            <th class="p-4 font-medium">Pembayaran</th>
            <th class="p-4 font-medium text-right">Total</th>
            <th class="p-4 font-medium text-center">Status</th>
            <th class="p-4 font-medium">Kasir</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          {#if invoices.length === 0}
            <tr>
              <td colspan="7" class="p-8 text-center text-slate-500">
                Belum ada transaksi
              </td>
            </tr>
          {/if}
          
          {#each invoices as inv}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <tr class="hover:bg-blue-50 cursor-pointer transition-colors" onclick={() => viewDetail(inv)}>
              <td class="p-4 text-sm text-slate-600">{formatDate(inv.createdAt)}</td>
              <td class="p-4 text-sm font-medium text-slate-800">{inv.invoiceNumber}</td>
              <td class="p-4 text-sm text-slate-700">{inv.customerName || '-'}</td>
              <td class="p-4 text-sm text-slate-600 capitalize">{inv.paymentMethod}</td>
              <td class="p-4 text-sm font-bold text-slate-800 text-right">{formatRp(inv.grandTotal)}</td>
              <td class="p-4 text-center">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {
                  inv.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                  inv.paymentStatus === 'voided' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }">
                  {inv.paymentStatus === 'paid' ? 'Lunas' : inv.paymentStatus === 'voided' ? 'Batal (Void)' : 'Belum Lunas'}
                </span>
              </td>
              <td class="p-4 text-sm text-slate-500">{inv.creator?.name || 'Sistem'}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>

<!-- Invoice Detail Modal -->
{#if selectedInvoiceDetail}
  <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
      <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h3 class="text-lg font-bold text-slate-800">Detail Invoice: {selectedInvoiceDetail.invoiceNumber}</h3>
        <button aria-label="Tutup" onclick={() => selectedInvoiceDetail = null} class="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
      
      <div class="p-6 overflow-y-auto">
        <div class="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div>
            <p class="text-slate-500">Tanggal Transaksi</p>
            <p class="font-medium text-slate-800">{formatDate(selectedInvoiceDetail.createdAt)}</p>
          </div>
          <div>
            <p class="text-slate-500">Pelanggan</p>
            <p class="font-medium text-slate-800">{selectedInvoiceDetail.customerName || 'Umum'}</p>
          </div>
          <div>
            <p class="text-slate-500">Metode Pembayaran</p>
            <p class="font-medium text-slate-800 capitalize">{selectedInvoiceDetail.paymentMethod}</p>
          </div>
          <div>
            <p class="text-slate-500">Kasir</p>
            <p class="font-medium text-slate-800">{selectedInvoiceDetail.creator?.name || '-'}</p>
          </div>
        </div>

        <h4 class="font-semibold text-slate-800 mb-3 border-b pb-2">Item Pembelian</h4>
        
        {#if loadingDetail}
          <div class="py-8 text-center text-slate-500">
            <svg class="animate-spin h-6 w-6 mx-auto mb-2 text-blue-600" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            Memuat item...
          </div>
        {:else if selectedInvoiceDetail.lines && selectedInvoiceDetail.lines.length > 0}
          <div class="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
            <table class="w-full text-left text-sm">
              <thead class="bg-slate-100 border-b border-slate-200">
                <tr>
                  <th class="p-3 font-medium text-slate-600">Item</th>
                  <th class="p-3 font-medium text-slate-600 text-center">Qty</th>
                  <th class="p-3 font-medium text-slate-600 text-right">Harga Satuan</th>
                  <th class="p-3 font-medium text-slate-600 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200">
                {#each selectedInvoiceDetail.lines as line}
                  <tr>
                    <td class="p-3">
                      <p class="font-medium text-slate-800">{line.inventoryItem?.name || 'Unknown Item'}</p>
                      <p class="text-xs text-slate-500">{line.inventoryItem?.sku || '-'}</p>
                    </td>
                    <td class="p-3 text-center">{line.quantity}</td>
                    <td class="p-3 text-right">{formatRp(line.unitPrice)}</td>
                    <td class="p-3 text-right font-medium">{formatRp(line.subtotal)}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
          
          <div class="mt-4 space-y-1 text-sm flex flex-col items-end border-t border-dashed pt-4">
            <div class="flex justify-between w-64">
              <span class="text-slate-600">Subtotal:</span>
              <span class="font-medium text-slate-800">{formatRp(selectedInvoiceDetail.subtotal)}</span>
            </div>
            <div class="flex justify-between w-64">
              <span class="text-slate-600">Diskon:</span>
              <span class="font-medium text-slate-800">{formatRp(selectedInvoiceDetail.discountAmount)}</span>
            </div>
            <div class="flex justify-between w-64 pt-2 border-t mt-1 text-base">
              <span class="font-bold text-slate-800">Total:</span>
              <span class="font-bold text-blue-600">{formatRp(selectedInvoiceDetail.grandTotal)}</span>
            </div>
          </div>
        {:else}
          <p class="text-slate-500 italic">Tidak ada detail item yang ditemukan.</p>
        {/if}
      </div>
      
      <div class="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
        <div>
          {#if selectedInvoiceDetail.paymentStatus !== 'voided'}
            <button onclick={() => handleVoid(selectedInvoiceDetail.id)} class="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-medium rounded-lg transition-colors border border-red-200 mr-2">
              Void (Batal)
            </button>
            <button onclick={() => handleEdit(selectedInvoiceDetail)} class="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 font-medium rounded-lg transition-colors border border-amber-200">
              Edit & Re-Cart
            </button>
          {/if}
        </div>
        <button onclick={() => selectedInvoiceDetail = null} class="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium rounded-lg transition-colors">
          Tutup
        </button>
      </div>
    </div>
  </div>
{/if}
