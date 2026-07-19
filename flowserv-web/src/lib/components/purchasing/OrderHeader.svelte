<script lang="ts">
  let { order, loading, onDelete } = $props<{ 
    order: any, 
    loading: boolean, 
    onDelete: () => void 
  }>();
</script>

<div class="flex items-center justify-between">
  <div class="flex items-center gap-4">
    <a href="/inventory/purchasing" class="text-slate-500 hover:text-slate-800" aria-label="Back">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
    </a>
    <div>
      <h1 class="text-2xl font-bold text-slate-900">Purchase Order: {order?.poNumber}</h1>
      <p class="text-slate-500 mt-1">Supplier: {order?.supplier?.name}</p>
    </div>
  </div>
  
  <div>
    <button disabled={loading} onclick={onDelete} class="text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
      Delete PO
    </button>
  </div>
</div>
