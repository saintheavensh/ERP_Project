<script lang="ts">
  import PatternPad from './PatternPad.svelte';
  import { isPattern } from '$lib/utils/pattern';

  let { value = '', onchange, id = 'passcode' }:
    { value?: string; onchange: (v: string) => void; id?: string } = $props();

  // Mode mengikuti nilai (pola vs PIN) sampai user memilih sendiri lewat
  // tombol. Pindah mode mengosongkan nilai karena PIN dan pola dua
  // representasi berbeda.
  let userMode = $state<'pin' | 'pola' | null>(null);
  const mode = $derived<'pin' | 'pola'>(userMode ?? (isPattern(value) ? 'pola' : 'pin'));
  function setMode(m: 'pin' | 'pola') {
    if (m === mode) return;
    userMode = m;
    onchange('');
  }

  // R1.5C — peringatan panjang minimum, ditampilkan sambil mengetik.
  // Backend tetap gerbangnya (400 PASSCODE_TOO_SHORT); ini supaya kasir tahu
  // SEBELUM menekan simpan, bukan sesudah unitnya sudah di rak. Aturannya
  // harus sama dengan flowserv-api/src/lib/passcode.ts.
  const MIN = 4;
  const terlaluPendek = $derived.by(() => {
    if (!value) return false; // kosong sah — tidak semua unit terkunci
    if (isPattern(value)) {
      const titik = value.slice('pola:'.length);
      return titik.length > 0 && titik.split('-').length < MIN;
    }
    return value.trim().length < MIN;
  });
</script>

<div>
  <div class="flex gap-1 mb-2">
    <button type="button" onclick={() => setMode('pin')}
      class="px-3 py-1 text-xs rounded-lg font-medium {mode === 'pin' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">Sandi / PIN</button>
    <button type="button" onclick={() => setMode('pola')}
      class="px-3 py-1 text-xs rounded-lg font-medium {mode === 'pola' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">Pola</button>
  </div>
  {#if mode === 'pin'}
    <input {id} type="text" value={value} oninput={(e) => onchange(e.currentTarget.value)}
      class="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="mis. 1234" />
  {:else}
    <PatternPad {value} {onchange} />
  {/if}

  {#if terlaluPendek}
    <p class="mt-1.5 text-sm text-amber-700" role="alert">
      {mode === 'pola' ? `Pola minimal ${MIN} titik.` : `Sandi/PIN minimal ${MIN} karakter.`}
    </p>
  {/if}
</div>
