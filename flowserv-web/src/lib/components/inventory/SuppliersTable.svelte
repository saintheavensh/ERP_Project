<script lang="ts">
  import type { SuppliersState } from '$lib/states/inventory/suppliers.svelte';

  let { state } = $props<{ state: SuppliersState }>();
</script>

<div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
 <div class="overflow-x-auto">
  <table class="w-full min-w-[900px] text-left border-collapse">
    <thead>
      <tr class="bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-500">
        <th class="p-4">Name</th>
        <th class="p-4">Contact Info</th>
        <th class="p-4">Type</th>
        <th class="p-4">Payment</th>
        <th class="p-4">Return Policy</th>
        <th class="p-4">Warranty</th>
        <th class="p-4 text-right">Actions</th>
      </tr>
    </thead>
    <tbody class="divide-y divide-slate-100">
      {#each state.suppliers as supplier}
        <tr class="hover:bg-slate-50 transition-colors">
          <td class="p-4 font-medium text-slate-900">{supplier.name}</td>
          <td class="p-4 text-slate-600">{supplier.contactInfo || '-'}</td>
          <td class="p-4 text-slate-600 capitalize">{supplier.type}</td>
          <td class="p-4 text-slate-600">
            {#if supplier.paymentTermDays === 0}
              <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-emerald-100 text-emerald-700">Cash / COD</span>
            {:else}
              <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">Tempo {supplier.paymentTermDays} Days</span>
            {/if}
          </td>
          <td class="p-4 text-slate-600">{supplier.returnPolicyDays ? `${supplier.returnPolicyDays} Days` : 'N/A'}</td>
          <td class="p-4 text-slate-600">{supplier.warrantyPolicyDays ? `${supplier.warrantyPolicyDays} Days` : 'N/A'}</td>
          <td class="p-4 text-right">
            <div class="flex items-center justify-end gap-3">
              <a href="/inventory/suppliers/{supplier.id}" class="text-blue-600 hover:text-blue-800 text-sm font-medium">View & Edit</a>
              <button type="button" class="text-red-500 hover:text-red-700 text-sm font-medium" onclick={() => state.deleteSupplier(supplier.id)}>Delete</button>
            </div>
          </td>
        </tr>
      {:else}
        <tr>
          <td colspan="7" class="p-8 text-center text-slate-500">
            No suppliers found. Add a new supplier to get started.
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
 </div>
</div>
