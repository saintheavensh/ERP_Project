<script lang="ts">
  import type { PageData } from './$types';

  let { data } = $props();
  let flows = $derived(data.flows);
</script>

<svelte:head>
  <title>Flow Templates | FlowServ</title>
</svelte:head>

<div class="p-6">
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-2xl font-bold text-slate-900">Flow Templates</h1>
    <button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
      Create Template
    </button>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {#each flows as flow}
      <a href={`/flows/${flow.id}`} class="block bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all">
        <div class="flex justify-between items-start mb-4">
          <div>
            <span class="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded uppercase tracking-wider mb-2">
              {flow.domain}
            </span>
            <h3 class="font-bold text-lg text-slate-900">{flow.name}</h3>
          </div>
          {#if flow.isDefault}
            <span class="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">Default</span>
          {/if}
        </div>
        
        <div class="text-sm text-slate-500 mb-4">
          Version {flow.version}
        </div>

        <div class="text-blue-600 text-sm font-medium flex items-center">
          View Details
          <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </div>
      </a>
    {:else}
      <div class="col-span-full py-12 text-center text-slate-500 bg-white rounded-xl border border-dashed border-gray-300">
        No flow templates found.
      </div>
    {/each}
  </div>
</div>
