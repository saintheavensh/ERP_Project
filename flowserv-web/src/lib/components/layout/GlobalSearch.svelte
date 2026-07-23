<script lang="ts">
  import { API_BASE } from '$lib/api/config';
  import { goto } from '$app/navigation';

  // P8 — Global Search (5.7 / PLT-007). Desktop: inline input in the header
  // with a dropdown below it. Mobile: a bare icon that expands into a
  // full-screen overlay — there isn't room for an inline box next to the
  // hamburger + title at 375px, and a dropdown would run off-screen anyway.
  let { token }: { token: string | undefined } = $props();

  const TYPE_LABELS: Record<string, string> = {
    customer: 'Pelanggan',
    ticket: 'Tiket',
    inventory: 'Barang',
    supplier: 'Supplier',
  };

  let desktopQuery = $state('');
  let mobileQuery = $state('');
  let results = $state<Array<{ type: string; id: string; title: string; subtitle: string | null; href: string }>>([]);
  let loading = $state(false);
  let searched = $state(false); // a real (>=2 char) search has run — distinguishes "type more" from "no results"
  let desktopOpen = $state(false);
  let mobileOpen = $state(false);
  let mobileInputEl: HTMLInputElement | undefined = $state();
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;

  $effect(() => {
    if (mobileOpen) mobileInputEl?.focus();
  });

  function schedule(q: string, forMobile: boolean) {
    clearTimeout(debounceTimer);
    if (q.trim().length < 2) {
      results = [];
      searched = false;
      if (!forMobile) desktopOpen = false;
      return;
    }
    debounceTimer = setTimeout(() => runSearch(q, forMobile), 250);
  }

  // forMobile decides which of the two dropdowns is allowed to open — the
  // desktop and mobile inputs share this one `results` array (only one is
  // ever active at a time), but both `{#if}` blocks below read the same
  // `desktopOpen`/`mobileOpen` flags, so opening the wrong one renders the
  // same results a second time, off-screen but still in the DOM.
  async function runSearch(q: string, forMobile: boolean) {
    loading = true;
    try {
      const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(q)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json();
      results = res.ok ? (body.data?.results ?? []) : [];
    } catch {
      results = [];
    } finally {
      loading = false;
      searched = true;
      if (!forMobile) desktopOpen = true;
    }
  }

  function onDesktopInput(e: Event) {
    desktopQuery = (e.target as HTMLInputElement).value;
    schedule(desktopQuery, false);
  }

  function onMobileInput(e: Event) {
    mobileQuery = (e.target as HTMLInputElement).value;
    schedule(mobileQuery, true);
  }

  function openMobile() {
    mobileOpen = true;
  }

  function closeAll() {
    desktopOpen = false;
    mobileOpen = false;
    desktopQuery = '';
    mobileQuery = '';
    results = [];
    searched = false;
  }

  function select(href: string) {
    closeAll();
    goto(href);
  }

  let grouped = $derived.by(() => {
    const groups: Array<{ type: string; items: typeof results }> = [];
    for (const r of results) {
      let group = groups.find((g) => g.type === r.type);
      if (!group) {
        group = { type: r.type, items: [] };
        groups.push(group);
      }
      group.items.push(r);
    }
    return groups;
  });
</script>

{#snippet resultList()}
  {#if loading}
    <div class="px-4 py-6 text-sm text-slate-500 text-center">Mencari...</div>
  {:else if searched && results.length === 0}
    <div class="px-4 py-6 text-sm text-slate-500 text-center">Tidak ada hasil.</div>
  {:else if !searched}
    <div class="px-4 py-6 text-sm text-slate-400 text-center">Ketik minimal 2 karakter...</div>
  {:else}
    {#each grouped as group (group.type)}
      <div class="py-1">
        <div class="px-4 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wide">
          {TYPE_LABELS[group.type] ?? group.type}
        </div>
        {#each group.items as item (item.id)}
          <button
            type="button"
            onclick={() => select(item.href)}
            class="w-full text-left px-4 py-2 hover:bg-slate-100 transition-colors"
          >
            <div class="text-sm font-medium text-slate-800 truncate">{item.title}</div>
            {#if item.subtitle}
              <div class="text-xs text-slate-500 truncate">{item.subtitle}</div>
            {/if}
          </button>
        {/each}
      </div>
    {/each}
  {/if}
{/snippet}

<!-- Desktop / tablet: inline input + dropdown -->
<div class="relative hidden sm:block w-full max-w-sm">
  <input
    type="search"
    value={desktopQuery}
    oninput={onDesktopInput}
    onfocus={() => { if (results.length > 0 || searched) desktopOpen = true; }}
    placeholder="Cari pelanggan, tiket, barang, supplier..."
    class="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-300"
  />
  {#if desktopOpen}
    <button
      type="button"
      class="fixed inset-0 z-40 cursor-default"
      aria-label="Close search results"
      onclick={closeAll}
    ></button>
    <div class="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
      {@render resultList()}
    </div>
  {/if}
</div>

<!-- Mobile: icon trigger -->
<div class="sm:hidden flex justify-end">
  <button
    type="button"
    onclick={openMobile}
    aria-label="Open search"
    class="p-2 text-slate-500 hover:text-slate-800"
  >
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  </button>
</div>

{#if mobileOpen}
  <div class="fixed inset-0 z-50 bg-white flex flex-col sm:hidden">
    <div class="h-16 flex items-center gap-2 px-4 border-b shrink-0">
      <svg class="w-5 h-5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="search"
        bind:this={mobileInputEl}
        value={mobileQuery}
        oninput={onMobileInput}
        placeholder="Cari..."
        class="flex-1 text-sm focus:outline-none"
      />
      <button type="button" onclick={closeAll} class="text-sm text-slate-500 shrink-0">Batal</button>
    </div>
    <div class="flex-1 overflow-y-auto">
      {@render resultList()}
    </div>
  </div>
{/if}
