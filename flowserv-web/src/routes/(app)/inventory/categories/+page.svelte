<script lang="ts">
  import { API_BASE } from '$lib/api/config';

  let { data } = $props();
  let categories = $derived(data.categories);

  type MarginStrategy = 'markup' | 'gross_margin';
  interface CategoryForm {
    name: string;
    description: string;
    marginStrategy: MarginStrategy | '';
    targetMargin: string; // kept as string for the input; '' means "inherit / not set"
  }

  const emptyForm = (): CategoryForm => ({ name: '', description: '', marginStrategy: '', targetMargin: '' });

  let showAddModal = $state(false);
  let form = $state<CategoryForm>(emptyForm());
  let loading = $state(false);
  let errorMsg = $state('');

  // Edit state (4C.1 margin config) — reuses the same form shape.
  let editingId = $state<string | null>(null);
  let editForm = $state<CategoryForm>(emptyForm());
  let editLoading = $state(false);
  let editErrorMsg = $state('');

  // Build the JSON payload from a form: '' → omit/null so we never send NaN.
  function toPayload(f: CategoryForm) {
    const payload: Record<string, unknown> = { name: f.name, description: f.description };
    payload.marginStrategy = f.marginStrategy === '' ? null : f.marginStrategy;
    payload.targetMargin = f.targetMargin.trim() === '' ? null : Number(f.targetMargin);
    return payload;
  }

  function strategyLabel(s: string | null): string {
    if (s === 'markup') return 'Markup';
    if (s === 'gross_margin') return 'Gross Margin';
    return '—';
  }

  async function addCategory() {
    loading = true;
    errorMsg = '';
    try {
      const res = await fetch(`${API_BASE}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${data.token}` },
        body: JSON.stringify(toPayload(form))
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error?.message || 'Failed to add category');
      window.location.reload();
    } catch (err: any) {
      errorMsg = err.message;
      loading = false;
    }
  }

  function openEdit(cat: any) {
    editingId = cat.id;
    editErrorMsg = '';
    editForm = {
      name: cat.name ?? '',
      description: cat.description ?? '',
      marginStrategy: (cat.marginStrategy ?? '') as MarginStrategy | '',
      targetMargin: cat.targetMargin != null ? String(Number(cat.targetMargin)) : ''
    };
  }

  async function saveEdit() {
    if (!editingId) return;
    editLoading = true;
    editErrorMsg = '';
    try {
      const res = await fetch(`${API_BASE}/categories/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${data.token}` },
        body: JSON.stringify(toPayload(editForm))
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error?.message || 'Failed to update category');
      window.location.reload();
    } catch (err: any) {
      editErrorMsg = err.message;
      editLoading = false;
    }
  }
</script>

<svelte:head>
  <title>Categories - FlowServ</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-6">
  <div class="flex flex-wrap items-center gap-4">
    <a href="/inventory" class="text-slate-500 hover:text-slate-800" aria-label="Back to inventory">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
    </a>
    <div class="flex-1 min-w-[200px]">
      <h1 class="text-2xl font-bold text-slate-900">Inventory Categories</h1>
      <p class="text-slate-500 mt-1">Manage master data & default margin strategy per category.</p>
    </div>
    <button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors" onclick={() => { form = emptyForm(); errorMsg = ''; showAddModal = true; }}>
      New Category
    </button>
  </div>

  <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
   <div class="overflow-x-auto">
    <table class="w-full min-w-[720px] text-left border-collapse">
      <thead>
        <tr class="bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-500">
          <th class="p-4">Name</th>
          <th class="p-4">Description</th>
          <th class="p-4">Margin Strategy</th>
          <th class="p-4 text-right">Target %</th>
          <th class="p-4 text-right">Actions</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100">
        {#each categories as cat}
          <tr class="hover:bg-slate-50 transition-colors">
            <td class="p-4 font-medium text-slate-900">{cat.name}</td>
            <td class="p-4 text-slate-600">{cat.description || '-'}</td>
            <td class="p-4 text-slate-600">{strategyLabel(cat.marginStrategy)}</td>
            <td class="p-4 text-right text-slate-600">{cat.targetMargin != null ? `${Number(cat.targetMargin)}%` : '—'}</td>
            <td class="p-4 text-right">
              <button class="text-blue-600 hover:text-blue-800 text-sm font-medium" onclick={() => openEdit(cat)}>Edit</button>
            </td>
          </tr>
        {:else}
          <tr>
            <td colspan="5" class="p-8 text-center text-slate-500">
              No categories found. Add a new category to get started.
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
   </div>
  </div>
</div>

{#snippet marginFields(f: CategoryForm, idPrefix: string)}
  <div class="grid grid-cols-2 gap-4">
    <div>
      <label class="block text-sm font-medium text-slate-700 mb-1" for="{idPrefix}-strategy">Margin Strategy</label>
      <select id="{idPrefix}-strategy" bind:value={f.marginStrategy} class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
        <option value="">Inherit / none</option>
        <option value="markup">Markup (price = cost × (1 + m%))</option>
        <option value="gross_margin">Gross Margin (price = cost ÷ (1 − m%))</option>
      </select>
    </div>
    <div>
      <label class="block text-sm font-medium text-slate-700 mb-1" for="{idPrefix}-target">Target Margin %</label>
      <input id="{idPrefix}-target" type="number" min="0" step="0.01" bind:value={f.targetMargin} class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. 30">
    </div>
  </div>
  <p class="text-xs text-slate-400">Gross margin must be below 100%. Leave both blank to inherit the system default (30% markup).</p>
{/snippet}

{#if showAddModal}
  <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
      <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
        <h3 class="font-semibold text-lg text-slate-900">Add New Category</h3>
        <button class="text-slate-400 hover:text-slate-600" aria-label="Close Modal" onclick={() => showAddModal = false}>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>

      <form onsubmit={(e) => { e.preventDefault(); addCategory(); }} class="p-6 space-y-4">
        {#if errorMsg}
          <div class="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">{errorMsg}</div>
        {/if}

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="name">Category Name *</label>
          <input id="name" type="text" bind:value={form.name} required class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Screen">
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="desc">Description (Optional)</label>
          <textarea id="desc" bind:value={form.description} rows="2" class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"></textarea>
        </div>

        {@render marginFields(form, 'add')}

        <div class="pt-4 flex justify-end gap-3">
          <button type="button" class="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors" onclick={() => showAddModal = false}>Cancel</button>
          <button type="submit" disabled={loading} class="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
            {loading ? 'Saving...' : 'Save Category'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

{#if editingId}
  <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
      <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
        <h3 class="font-semibold text-lg text-slate-900">Edit Category</h3>
        <button class="text-slate-400 hover:text-slate-600" aria-label="Close Modal" onclick={() => editingId = null}>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>

      <form onsubmit={(e) => { e.preventDefault(); saveEdit(); }} class="p-6 space-y-4">
        {#if editErrorMsg}
          <div class="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">{editErrorMsg}</div>
        {/if}

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="edit-name">Category Name *</label>
          <input id="edit-name" type="text" bind:value={editForm.name} required class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1" for="edit-desc">Description (Optional)</label>
          <textarea id="edit-desc" bind:value={editForm.description} rows="2" class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"></textarea>
        </div>

        {@render marginFields(editForm, 'edit')}

        <div class="pt-4 flex justify-end gap-3">
          <button type="button" class="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors" onclick={() => editingId = null}>Cancel</button>
          <button type="submit" disabled={editLoading} class="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
            {editLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
