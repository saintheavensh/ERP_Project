<script lang="ts">
  // 6B.4 — the "Cetak" trigger. Fetches the real render (6A.4), then shows
  // whichever preview matches the resolved paperSize: ThermalPreview (58/80mm,
  // 6B.2) or A4Invoice (6B.3) -- never both, per spec rule 2 (A4 never touches
  // blocks or the agent). Thermal actually sends to the local Python agent
  // (6C); if it's not running (the default case until 6C is built, or simply
  // not started), the button degrades to a clear "agent not detected"
  // message instead of hanging or throwing an unhandled error.

  import { API_BASE } from '$lib/api/config';
  import { PRINTER_AGENT_URL } from '$lib/api/printer-agent';
  import ThermalPreview from './ThermalPreview.svelte';
  import A4Invoice from './A4Invoice.svelte';

  let { token, documentType, invoiceId, label = 'Cetak' }: {
    token: string;
    documentType: 'receipt' | 'invoice_a4' | 'label' | 'tanda_terima';
    invoiceId: string;
    label?: string;
  } = $props();

  let open = $state(false);
  let loading = $state(false);
  let error = $state('');
  let rendered = $state<any>(null);

  type AgentStatus = 'idle' | 'sending' | 'sent' | 'offline';
  let agentStatus = $state<AgentStatus>('idle');

  async function openPrint() {
    open = true;
    loading = true;
    error = '';
    rendered = null;
    agentStatus = 'idle';
    try {
      const res = await fetch(`${API_BASE}/print/documents/${documentType}/${invoiceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error?.message || 'Gagal memuat pratinjau cetak');
      rendered = result.data;
    } catch (err: any) {
      error = err.message;
    } finally {
      loading = false;
    }
  }

  function close() {
    open = false;
  }

  function printA4() {
    window.print();
  }

  async function sendToAgent() {
    if (!rendered?.blocks) return;
    agentStatus = 'sending';
    try {
      const res = await fetch(`${PRINTER_AGENT_URL}/print`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paperSize: rendered.paperSize,
          blocks: rendered.blocks,
          device: rendered.assignment,
        }),
      });
      agentStatus = res.ok ? 'sent' : 'offline';
    } catch {
      // Local agent not running -- expected until 6C exists, or simply
      // not started on this machine. Not an error the user needs a stack
      // trace for.
      agentStatus = 'offline';
    }
  }
</script>

<button
  onclick={openPrint}
  class="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium rounded-lg transition-colors border border-slate-200"
  data-testid="print-button"
>
  {label}
</button>

{#if open}
  <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4 print:bg-white print:backdrop-blur-none">
    <div class="bg-white rounded-xl shadow-xl w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col print:max-h-none print:shadow-none print:rounded-none">
      <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0 print:hidden">
        <h3 class="font-semibold text-lg text-slate-900">Cetak Dokumen</h3>
        <button class="text-slate-400 hover:text-slate-600" aria-label="Tutup" onclick={close}>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>

      <div class="p-6 overflow-y-auto bg-slate-100 print:p-0 print:bg-white">
        {#if loading}
          <p class="text-center text-slate-500 py-8">Memuat pratinjau...</p>
        {:else if error}
          <div class="p-4 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100" data-testid="print-error">
            {error}
          </div>
        {:else if rendered}
          {#if rendered.paperSize === 'A4'}
            <A4Invoice data={rendered.data} />
          {:else}
            <ThermalPreview blocks={rendered.blocks} paperSize={rendered.paperSize} />
          {/if}
        {/if}
      </div>

      {#if rendered && !loading && !error}
        <div class="p-4 border-t border-slate-100 bg-slate-50 flex flex-wrap justify-between items-center gap-2 print:hidden">
          <div>
            {#if rendered.paperSize !== 'A4'}
              {#if agentStatus === 'sent'}
                <span class="text-sm text-green-700" data-testid="agent-status">Terkirim ke printer.</span>
              {:else if agentStatus === 'offline'}
                <span class="text-sm text-amber-700" data-testid="agent-status">
                  Printer agent tidak terdeteksi di komputer ini. Pastikan aplikasi agent cetak berjalan.
                </span>
              {:else if !rendered.assignment}
                <span class="text-sm text-slate-500">Pratinjau ukuran {rendered.paperSize} (belum ada printer diatur untuk cabang ini).</span>
              {/if}
            {/if}
          </div>
          <div class="flex gap-2">
            <button class="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors" onclick={close}>Tutup</button>
            {#if rendered.paperSize === 'A4'}
              <button class="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors" onclick={printA4}>
                Cetak (Print Dialog)
              </button>
            {:else}
              <button
                class="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                disabled={agentStatus === 'sending'}
                onclick={sendToAgent}
                data-testid="send-to-agent"
              >
                {agentStatus === 'sending' ? 'Mengirim...' : 'Kirim ke Printer'}
              </button>
            {/if}
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}
