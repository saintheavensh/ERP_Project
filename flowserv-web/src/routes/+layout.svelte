<script lang="ts">
  import '../app.css';
  import favicon from "$lib/assets/favicon.svg";

  let { children } = $props();
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<div class="flex h-screen w-full bg-gray-50">
  <!-- Sidebar Placeholder -->
  <aside class="w-64 bg-slate-900 text-white flex flex-col">
    <div class="h-16 flex items-center px-6 font-bold text-xl border-b border-slate-800">
      FlowServ
    </div>
    <nav class="flex-1 p-4 space-y-2">
      <div class="px-4 py-2 bg-slate-800 rounded-md">Dashboard</div>
      <div class="px-4 py-2 text-slate-400 hover:text-white">Tickets</div>
      <div class="px-4 py-2 text-slate-400 hover:text-white">Inventory</div>
    </nav>
  </aside>

  <!-- Main Content -->
  <main class="flex-1 flex flex-col overflow-hidden">
    <header class="h-16 bg-white border-b flex items-center px-6 shadow-sm">
      <h1 class="font-semibold text-lg">System Dashboard</h1>
    </header>
    <div class="flex-1 overflow-auto p-6">
      {@render children()}
    </div>
  </main>
</div>
