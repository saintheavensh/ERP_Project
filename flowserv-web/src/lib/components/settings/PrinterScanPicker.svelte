<script lang="ts">
  // "Scan and pick" for win32-mode printers (6C follow-up): the browser asks
  // the LOCAL agent (127.0.0.1:9100, same one that already handles "Kirim ke
  // Printer") which Windows printers are installed on THIS machine, so the
  // cashier/admin picks a name from a real list instead of typing a USB
  // vendor/product ID or IP address by hand. Picking a printer also asks the
  // agent to remember it (POST /config) so the very next print already uses
  // it -- no separate config-file step.
  import { PRINTER_AGENT_URL } from '$lib/api/printer-agent';

  let { connectionAddress = $bindable(''), deviceName = $bindable(''), paperSize = '80mm' }: {
    connectionAddress?: string;
    deviceName?: string;
    paperSize?: string;
  } = $props();

  interface ScannedPrinter {
    name: string;
    driver: string;
    port: string;
    isDefault: boolean;
    recommended: boolean;
  }

  let scanning = $state(false);
  let scanned = $state(false);
  let scanErrorMsg = $state('');
  let results = $state<ScannedPrinter[]>([]);
  let pickedName = $state('');

  type TestPrintStatus = 'idle' | 'printing' | 'printed' | 'failed';
  let testPrintStatus = $state<TestPrintStatus>('idle');
  let testPrintErrorMsg = $state('');

  async function scan() {
    scanning = true;
    scanErrorMsg = '';
    try {
      const res = await fetch(`${PRINTER_AGENT_URL}/printers`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Pemindaian gagal');
      results = body.data ?? [];
      scanned = true;
    } catch {
      // Same "agent not running" reality PrintButton already handles --
      // most likely this browser isn't on the cashier's own computer, or
      // the agent (6C) just isn't started yet.
      scanErrorMsg = 'Agent printer tidak terdeteksi di komputer ini. Pastikan aplikasi agent cetak berjalan di komputer kasir ini, lalu coba lagi.';
    } finally {
      scanning = false;
    }
  }

  async function pick(printer: ScannedPrinter) {
    connectionAddress = printer.name;
    if (!deviceName) deviceName = printer.name;
    pickedName = printer.name;
    testPrintStatus = 'idle';
    testPrintErrorMsg = '';
    try {
      // Best-effort: lock this choice into the agent's local config.json
      // immediately. If the agent goes offline between the scan above and
      // this click, the address is already filled in above regardless --
      // this call is a convenience, not the source of truth for the field.
      await fetch(`${PRINTER_AGENT_URL}/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'win32', win32: { printerName: printer.name } }),
      });
    } catch {
      // Agent went offline between scan and pick -- the form field is
      // already filled, nothing further to do here.
    }
  }

  async function testPrint() {
    testPrintStatus = 'printing';
    testPrintErrorMsg = '';
    try {
      const res = await fetch(`${PRINTER_AGENT_URL}/test-print`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paperSize }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Test cetak gagal');
      testPrintStatus = 'printed';
    } catch (err: any) {
      testPrintStatus = 'failed';
      testPrintErrorMsg = err.message || 'Agent printer tidak terdeteksi.';
    }
  }
</script>

<div class="space-y-2">
  <button
    type="button"
    onclick={scan}
    disabled={scanning}
    class="text-sm text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
    data-testid="scan-printers-button"
  >
    {scanning ? 'Memindai...' : 'Pindai Printer di Komputer Ini'}
  </button>

  {#if scanErrorMsg}
    <p class="text-xs text-amber-700">{scanErrorMsg}</p>
  {/if}

  {#if scanned}
    {#if results.length === 0}
      <p class="text-xs text-slate-500">Tidak ada printer terpasang ditemukan di komputer ini.</p>
    {:else}
      <ul class="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-40 overflow-y-auto" data-testid="scanned-printers-list">
        {#each results as printer (printer.name)}
          <li>
            <button
              type="button"
              class="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center justify-between gap-2 transition-colors"
              class:bg-blue-50={pickedName === printer.name}
              onclick={() => pick(printer)}
              data-testid="scanned-printer-option"
            >
              <span class="text-slate-700">
                {printer.name}
                {#if printer.isDefault}<span class="text-xs text-slate-400"> (default)</span>{/if}
              </span>
              {#if printer.recommended}
                <span class="text-xs font-medium px-1.5 py-0.5 rounded bg-green-100 text-green-700 shrink-0">disarankan</span>
              {/if}
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  {/if}

  {#if pickedName}
    <div class="flex items-center gap-2 flex-wrap">
      <p class="text-xs text-green-700" data-testid="picked-printer-confirmation">Dipilih: {pickedName}</p>
      <button
        type="button"
        onclick={testPrint}
        disabled={testPrintStatus === 'printing'}
        class="text-xs font-medium text-blue-600 hover:text-blue-800 underline disabled:opacity-50"
        data-testid="test-print-button"
      >
        {testPrintStatus === 'printing' ? 'Mencetak...' : 'Test Cetak'}
      </button>
      {#if testPrintStatus === 'printed'}
        <span class="text-xs text-green-700" data-testid="test-print-status">Terkirim ke printer — cek hasil cetak fisik.</span>
      {:else if testPrintStatus === 'failed'}
        <span class="text-xs text-red-700" data-testid="test-print-status">Gagal: {testPrintErrorMsg}</span>
      {/if}
    </div>
  {/if}
</div>
