<script lang="ts">
  let { order } = $props<{ order: any }>();
</script>

<div class="p-6 border-b border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-6">
  <div>
    <p class="text-sm text-slate-500">Tanggal Pemesanan</p>
    <p class="font-medium text-slate-900 mt-1">{new Date(order?.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
  </div>
  <div>
    <p class="text-sm text-slate-500">Estimasi Kedatangan</p>
    <p class="font-medium text-slate-900 mt-1">{order?.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Belum diset'}</p>
  </div>
  {#if order?.status === 'completed'}
    {@const invoiceDetail = order?.supplierInvoices?.[0]}
    <div>
      <p class="text-sm text-slate-500">Nomor Nota Supplier</p>
      <p class="font-medium text-slate-900 mt-1">{order?.invoiceNumber || '-'}</p>
    </div>
    <div>
      <p class="text-sm text-slate-500">Info Pembayaran</p>
      <p class="font-medium text-slate-900 mt-1">
        {#if invoiceDetail?.paymentMethod === 'tempo' && invoiceDetail?.dueDate}
          <span class="text-orange-600">Jatuh Tempo: {new Date(invoiceDetail.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        {:else}
          <span class="text-green-600">Tunai (Cash)</span>
        {/if}
      </p>
    </div>
  {:else if order?.status === 'received'}
    <div class="col-span-2">
      <p class="text-sm text-slate-500">Status Barang</p>
      <p class="font-medium text-blue-600 mt-1">Menunggu penetapan Harga & Nota dari Supplier</p>
    </div>
  {/if}
</div>
