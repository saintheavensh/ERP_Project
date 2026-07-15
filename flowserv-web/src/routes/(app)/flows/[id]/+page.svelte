<script lang="ts">
  import type { PageData } from './$types';

  let { data } = $props();
  let template = $derived(data.template);
  let nodes = $derived(data.nodes);
  let transitions = $derived(data.transitions);

  // Helper to find next nodes
  const getNextNodes = (nodeId: string) => {
    const nextTransitions = transitions.filter((t: any) => t.fromNodeId === nodeId);
    return nextTransitions.map((t: any) => {
      const nextNode = nodes.find((n: any) => n.id === t.toNodeId);
      return { transition: t, node: nextNode };
    }).filter((x: any) => x.node);
  };
</script>

<svelte:head>
  <title>{template?.name || 'Flow Detail'} | FlowServ</title>
</svelte:head>

<div class="p-6">
  <div class="mb-6 flex items-center gap-4">
    <a href="/flows" class="text-slate-500 hover:text-slate-800 transition-colors" aria-label="Back to flows">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
      </svg>
    </a>
    <div>
      <h1 class="text-2xl font-bold text-slate-900">{template?.name || 'Unknown Template'}</h1>
      <p class="text-slate-500 text-sm">Domain: {template?.domain} | Version {template?.version}</p>
    </div>
  </div>

  {#if !template}
    <div class="bg-red-50 text-red-600 p-4 rounded-lg border border-red-100">
      Template not found.
    </div>
  {:else}
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-8 overflow-x-auto">
      <div class="flex items-start gap-8 min-w-max pb-8">
        {#each nodes as node (node.id)}
          <div class="flex flex-col items-center relative group">
            
            <!-- Node Card -->
            <div class="w-48 bg-white border-2 border-slate-200 rounded-lg p-4 shadow-sm z-10 hover:border-blue-400 transition-colors">
              <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                {node.nodeType}
              </div>
              <div class="font-bold text-slate-800 text-center">
                {node.name}
              </div>
              {#if node.requiredPermissionId}
                <div class="mt-2 text-[10px] bg-amber-50 text-amber-700 px-2 py-1 rounded border border-amber-200 truncate" title="Requires Permission">
                  🔒 RBAC Guarded
                </div>
              {/if}
            </div>

            <!-- Transitions lines (visual only, simplistic for linear mostly) -->
            {#if getNextNodes(node.id).length > 0}
              <div class="h-8 w-px bg-slate-300 my-2"></div>
              <div class="flex gap-4">
                {#each getNextNodes(node.id) as next}
                   <div class="flex flex-col items-center">
                     <div class="text-[10px] text-slate-400 bg-slate-50 px-2 rounded mb-2 border border-slate-200">
                        {next.transition.conditionExpression || 'Always'}
                     </div>
                     <!-- Arrow pointer -->
                     <svg class="w-4 h-4 text-slate-300 -mt-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
                     </svg>
                   </div>
                {/each}
              </div>
            {/if}

          </div>
        {/each}
      </div>
      
      {#if nodes.length === 0}
        <div class="text-center text-slate-500 py-12 border-2 border-dashed border-gray-200 rounded-xl">
          This template has no nodes yet.
        </div>
      {/if}
    </div>
  {/if}
</div>
