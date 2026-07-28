<script lang="ts">
  // 6B.3 — spec rule 2: A4 never goes through blocks or the Python agent.
  // This renders `data` (buildDocumentData()'s output, 6A.2) directly with
  // HTML/CSS. The on-screen preview below IS the exact markup window.print()
  // sends — no second render path, per the spec's WYSIWYG rule.

  interface DocumentData {
    documentType: string;
    header: { storeName: string; address?: string; phone?: string };
    items: Array<{ description: string; quantity: number; unitPrice: number; subtotal: number }>;
    totals: { subtotal: number; discountAmount: number; taxAmount: number; grandTotal: number };
    extra: { cashierName?: string; customerName?: string; invoiceNumber?: string; createdAt?: string; technicianName?: string };
    footer: { note?: string; warrantyPolicy?: string };
    display: { showLineSubtotal: boolean; showLogo: boolean; showSignature: boolean };
    // Tahap A — invoice display mode. Only receipt/invoice_a4 (pos_invoice-
    // sourced) documents carry this; undefined elsewhere.
    displayMode?: 'detailed' | 'summary' | 'flexible';
    summaryItems?: Array<{ description: string; quantity: number; unitPrice: number; subtotal: number }>;
  }

  let { data }: { data: DocumentData } = $props();

  // Tahap A — 'flexible' tenants get an on-screen toggle (client-side only,
  // no reprint/refetch): default Detailed, per the settings tab's own
  // description. 'detailed'/'summary' tenants get a FIXED view matching their
  // setting, with no toggle — 'summary' must actually show the collapsed row,
  // not fall through to the detailed one.
  let viewMode = $state<'detailed' | 'summary'>('detailed');
  const displayedItems = $derived.by(() => {
    if (data.displayMode === 'summary') return data.summaryItems ?? data.items;
    if (data.displayMode === 'flexible') return viewMode === 'summary' ? (data.summaryItems ?? data.items) : data.items;
    return data.items;
  });

  function formatRp(n: number): string {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(n);
  }

  function formatDate(iso?: string): string {
    if (!iso) return '-';
    return new Date(iso).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
</script>

<div id="print-area" class="bg-white mx-auto shadow-sm" style="width: 210mm; min-height: 148mm; padding: 16mm;" data-testid="a4-invoice">
  <div class="flex justify-between items-start border-b-2 border-slate-800 pb-4 mb-4">
    <div>
      {#if data.display.showLogo}
        <div class="w-16 h-16 bg-slate-100 border border-slate-300 rounded flex items-center justify-center text-[10px] text-slate-400 mb-2">LOGO</div>
      {/if}
      <h1 class="text-xl font-bold text-slate-900">{data.header.storeName}</h1>
      {#if data.header.address}<p class="text-sm text-slate-600">{data.header.address}</p>{/if}
      {#if data.header.phone}<p class="text-sm text-slate-600">{data.header.phone}</p>{/if}
    </div>
    <div class="text-right text-sm">
      <p class="font-semibold text-slate-900">INVOICE</p>
      <p class="text-slate-600">{data.extra.invoiceNumber}</p>
      <p class="text-slate-600">{formatDate(data.extra.createdAt)}</p>
    </div>
  </div>

  <div class="grid grid-cols-2 gap-4 mb-6 text-sm">
    <div>
      <p class="text-slate-500">Pelanggan</p>
      <p class="font-medium text-slate-900">{data.extra.customerName ?? 'Umum'}</p>
    </div>
    {#if data.extra.cashierName}
      <div>
        <p class="text-slate-500">Kasir</p>
        <p class="font-medium text-slate-900">{data.extra.cashierName}</p>
      </div>
    {/if}
    {#if data.extra.technicianName}
      <div>
        <p class="text-slate-500">Teknisi</p>
        <p class="font-medium text-slate-900">{data.extra.technicianName}</p>
      </div>
    {/if}
  </div>

  {#if data.displayMode === 'flexible'}
    <div class="flex justify-end mb-2 print:hidden">
      <div class="inline-flex rounded-lg border border-slate-200 overflow-hidden text-xs" data-testid="invoice-view-mode-toggle">
        <button
          type="button"
          class="px-3 py-1.5 font-medium transition-colors {viewMode === 'detailed' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}"
          onclick={() => viewMode = 'detailed'}
        >Detailed</button>
        <button
          type="button"
          class="px-3 py-1.5 font-medium transition-colors {viewMode === 'summary' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}"
          onclick={() => viewMode = 'summary'}
        >Summary</button>
      </div>
    </div>
  {/if}

  <table class="w-full text-sm border-collapse mb-6">
    <thead>
      <tr class="border-b border-slate-300 text-left text-slate-500">
        <th class="py-2">Deskripsi</th>
        <th class="py-2 text-center">Jumlah</th>
        <th class="py-2 text-right">Harga</th>
        {#if data.display.showLineSubtotal}<th class="py-2 text-right">Subtotal</th>{/if}
      </tr>
    </thead>
    <tbody>
      {#each displayedItems as item}
        <tr class="border-b border-slate-100">
          <td class="py-2">{item.description}</td>
          <td class="py-2 text-center">{item.quantity}</td>
          <td class="py-2 text-right">{formatRp(item.unitPrice)}</td>
          {#if data.display.showLineSubtotal}<td class="py-2 text-right">{formatRp(item.subtotal)}</td>{/if}
        </tr>
      {/each}
    </tbody>
  </table>

  <div class="flex justify-end mb-6">
    <div class="w-64 text-sm space-y-1">
      <div class="flex justify-between"><span class="text-slate-600">Subtotal</span><span>{formatRp(data.totals.subtotal)}</span></div>
      {#if data.totals.discountAmount > 0}
        <div class="flex justify-between"><span class="text-slate-600">Diskon</span><span>-{formatRp(data.totals.discountAmount)}</span></div>
      {/if}
      {#if data.totals.taxAmount > 0}
        <div class="flex justify-between"><span class="text-slate-600">Pajak</span><span>{formatRp(data.totals.taxAmount)}</span></div>
      {/if}
      <div class="flex justify-between font-bold text-base border-t border-slate-800 pt-1 mt-1">
        <span>Total</span><span>{formatRp(data.totals.grandTotal)}</span>
      </div>
    </div>
  </div>

  {#if data.footer.warrantyPolicy}
    <p class="text-xs text-slate-500 border-t border-slate-200 pt-3 mb-6">{data.footer.warrantyPolicy}</p>
  {/if}

  {#if data.display.showSignature}
    <div class="flex justify-end mt-12">
      <div class="text-center text-sm">
        <p class="text-slate-500 mb-16">Tanda Tangan</p>
        <p class="border-t border-slate-400 pt-1 w-40">{data.extra.customerName ?? ''}</p>
      </div>
    </div>
  {/if}
</div>

<style>
  @media print {
    :global(body *) { visibility: hidden; }
    #print-area, #print-area * { visibility: visible; }
    #print-area { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none; }
  }
</style>
