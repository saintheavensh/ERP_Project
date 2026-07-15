<script lang="ts">
  let { data, children } = $props();
  let user = $derived(data.user);

  // Dynamic menu based on role using $derived for reactivity
  let menuItems = $derived.by(() => {
    let items = [{ label: 'Dashboard', path: '/' }];
    
    if (user?.roleId === 'Super Admin' || user?.roleId === 'no-role') {
      items.push({ label: 'Customers', path: '/customers' });
      items.push({ label: 'Flow Templates', path: '/flows' });
      items.push({ label: 'Tickets', path: '/tickets' });
      items.push({ label: 'Inventory', path: '/inventory' });
    } else if (user?.roleId === 'Technician') {
      items.push({ label: 'My Jobs', path: '/tickets' });
    }
    
    return items;
  });
</script>

<div class="flex h-screen w-full bg-gray-50">
  <aside class="w-64 bg-slate-900 text-white flex flex-col">
    <div class="h-16 flex items-center px-6 font-bold text-xl border-b border-slate-800">
      FlowServ
    </div>
    
    <div class="px-6 py-4 border-b border-slate-800 text-sm">
      <div class="text-slate-400">Logged in as:</div>
      <div class="font-medium truncate">{user?.name}</div>
      <div class="text-xs text-slate-500 mt-1 capitalize border border-slate-700 bg-slate-800 inline-block px-2 py-0.5 rounded">{user?.roleId}</div>
    </div>

    <nav class="flex-1 p-4 space-y-2">
      {#each menuItems as item}
        <a href={item.path} class="block px-4 py-2 bg-slate-800 rounded-md hover:bg-slate-700 transition-colors">
          {item.label}
        </a>
      {/each}
    </nav>
    
    <div class="p-4 border-t border-slate-800">
      <form method="POST" action="/logout">
        <button type="submit" class="w-full text-left px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors flex items-center">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
          </svg>
          Sign Out
        </button>
      </form>
    </div>
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
