<script lang="ts">
  import CompanyTab from '$lib/components/settings/CompanyTab.svelte';
  import BranchesTab from '$lib/components/settings/BranchesTab.svelte';
  import UsersTab from '$lib/components/settings/UsersTab.svelte';
  import PaymentMethodsTab from '$lib/components/settings/PaymentMethodsTab.svelte';
  import PrinterTab from '$lib/components/settings/PrinterTab.svelte';

  let { data } = $props();

  const TABS: Array<{ id: string; label: string }> = [
    { id: 'company', label: 'Perusahaan' },
    { id: 'branches', label: 'Cabang' },
    { id: 'users', label: 'Pengguna & Peran' },
    { id: 'payment-methods', label: 'Metode Pembayaran' },
    { id: 'printers', label: 'Printer' },
  ];
</script>

<svelte:head>
  <title>Pengaturan - FlowServ</title>
</svelte:head>

<div class="max-w-5xl mx-auto space-y-6">
  <h1 class="text-2xl font-bold text-slate-900">Pengaturan</h1>

  <!-- Mobile-first: tabs scroll horizontally rather than wrapping/shrinking
       into unreadable pills at 375px (same idiom as the ticket board's
       horizontal-scroll columns, P2). -->
  <div class="border-b border-slate-200 overflow-x-auto">
    <nav class="flex gap-1 min-w-max">
      {#each TABS as t (t.id)}
        <a
          href="/settings?tab={t.id}"
          class="px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors {data.tab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}"
        >
          {t.label}
        </a>
      {/each}
    </nav>
  </div>

  {#if data.tab === 'company'}
    <CompanyTab {data} />
  {:else if data.tab === 'branches'}
    <BranchesTab {data} />
  {:else if data.tab === 'users'}
    <UsersTab {data} />
  {:else if data.tab === 'payment-methods'}
    <PaymentMethodsTab {data} />
  {:else if data.tab === 'printers'}
    <PrinterTab {data} />
  {/if}
</div>
