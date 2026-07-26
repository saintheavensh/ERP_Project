<script lang="ts">
  import { API_BASE } from '$lib/api/config';

  let { data } = $props<{ data: any }>();

  // svelte-ignore state_referenced_locally
  let mode = $state<'detailed' | 'summary' | 'flexible'>(data.salesSettings?.invoiceDisplayMode ?? 'detailed');
  let loading = $state(false);
  let errorMsg = $state('');
  let successMsg = $state('');

  const OPTIONS: Array<{ value: 'detailed' | 'summary' | 'flexible'; label: string; description: string }> = [
    { value: 'detailed', label: 'Detailed (Sparepart & Jasa Terpisah)', description: 'Sparepart dan jasa ditampilkan per baris.' },
    { value: 'summary', label: 'Summary (Satu Total)', description: 'Semua sparepart dan jasa digabung jadi satu baris.' },
    { value: 'flexible', label: 'Flexible (Bisa Diganti Saat Cetak)', description: 'Invoice bisa ditukar Detailed/Summary saat pratinjau cetak A4 (default Detailed).' },
  ];

  async function save() {
    loading = true;
    errorMsg = '';
    successMsg = '';
    try {
      const res = await fetch(`${API_BASE}/settings/sales`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.token}` },
        body: JSON.stringify({ invoiceDisplayMode: mode }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error?.message || 'Gagal menyimpan');
      successMsg = 'Perubahan tersimpan.';
    } catch (err: any) {
      errorMsg = err.message;
    } finally {
      loading = false;
    }
  }
</script>

<div class="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6 max-w-lg">
  <h2 class="font-semibold text-slate-800 mb-1">Mode Tampilan Invoice</h2>
  <p class="text-sm text-slate-500 mb-4">Atur bagaimana rincian sparepart & jasa ditampilkan di struk/invoice.</p>

  {#if errorMsg}
    <div class="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">{errorMsg}</div>
  {/if}
  {#if successMsg}
    <div class="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded-lg border border-green-100">{successMsg}</div>
  {/if}

  <form onsubmit={(e) => { e.preventDefault(); save(); }} class="space-y-3">
    {#each OPTIONS as opt}
      <label class="flex items-start gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 has-[:checked]:border-blue-400 has-[:checked]:bg-blue-50">
        <input type="radio" name="invoice-display-mode" value={opt.value} bind:group={mode} class="mt-1">
        <div>
          <p class="text-sm font-medium text-slate-900">{opt.label}</p>
          <p class="text-xs text-slate-500 mt-0.5">{opt.description}</p>
        </div>
      </label>
    {/each}

    <div class="pt-2">
      <button
        type="submit"
        disabled={loading}
        class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
      >
        {loading ? 'Menyimpan...' : 'Simpan'}
      </button>
    </div>
  </form>
</div>
