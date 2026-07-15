<script lang="ts">
  import { onMount } from 'svelte';
  import { apiFetch } from '$lib/api/client';

  let status = $state('Checking...');
  let database = $state('Unknown');
  let error = $state('');

  onMount(async () => {
    try {
      const res = await apiFetch<{ status: string, database: string }>('/health');
      status = res.data?.status || 'Unknown';
      database = res.data?.database || 'Unknown';
    } catch (e: any) {
      status = 'Error';
      error = e.message;
    }
  });
</script>

<div class="bg-white p-6 rounded-lg shadow-sm border border-gray-100 max-w-xl">
  <h2 class="text-2xl font-bold mb-4">System Status</h2>
  
  <div class="space-y-4">
    <div class="flex justify-between items-center p-3 bg-gray-50 rounded-md">
      <span class="font-medium text-gray-700">API Connection</span>
      <span class="px-3 py-1 rounded-full text-sm font-semibold {status === 'ok' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
        {status === 'ok' ? 'API Connected' : status}
      </span>
    </div>

    <div class="flex justify-between items-center p-3 bg-gray-50 rounded-md">
      <span class="font-medium text-gray-700">Database Connection</span>
      <span class="px-3 py-1 rounded-full text-sm font-semibold {database === 'connected' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
        {database === 'connected' ? 'Connected' : database}
      </span>
    </div>

    {#if error}
      <div class="p-3 bg-red-50 text-red-600 rounded-md text-sm border border-red-200">
        {error}
      </div>
    {/if}
  </div>
</div>
