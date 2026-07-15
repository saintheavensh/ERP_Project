<script lang="ts">
  import '../app.css';
  import { page } from '$app/stores';
  let { children } = $props();

  const isActive = (path: string) => $page.url.pathname === path;
</script>

<div class="min-h-screen bg-slate-50 selection:bg-primary-200 flex flex-col">
  <!-- Navbar Modern -->
  <nav class="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <div class="flex items-center gap-8">
          <!-- Logo/Brand -->
          <div class="shrink-0 flex items-center gap-2">
            <span class="text-2xl">🏪</span>
            <span class="font-black text-xl tracking-tight bg-linear-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent">POS ME</span>
          </div>

          <!-- Nav Links -->
          <div class="hidden sm:flex sm:space-x-1">
            <a 
              href="/" 
              class="px-4 py-2 rounded-lg text-sm font-bold transition-all {isActive('/') ? 'bg-primary-50 text-primary-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}"
            >
              🛒 KASIR
            </a>
            <a 
              href="/history" 
              class="px-4 py-2 rounded-lg text-sm font-bold transition-all {isActive('/history') ? 'bg-primary-50 text-primary-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}"
            >
              📜 RIWAYAT
            </a>
            <a 
              href="/products" 
              class="px-4 py-2 rounded-lg text-sm font-bold transition-all {isActive('/products') ? 'bg-primary-50 text-primary-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}"
            >
              📦 PRODUK
            </a>
            <a 
              href="/suppliers" 
              class="px-4 py-2 rounded-lg text-sm font-bold transition-all {isActive('/suppliers') ? 'bg-primary-50 text-primary-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}"
            >
              🏢 SUPPLIER
            </a>
            <a 
              href="/reports" 
              class="px-4 py-2 rounded-lg text-sm font-bold transition-all {isActive('/reports') ? 'bg-primary-50 text-primary-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}"
            >
              📊 LAPORAN
            </a>
          </div>
        </div>

        <!-- Right Side: Info/Clock (Optional) -->
        <div class="flex items-center gap-4 text-xs font-bold text-slate-400">
           <span class="hidden md:inline">VERSION 2.0 (DEV)</span>
        </div>
      </div>
    </div>
    
    <!-- Mobile Nav (Bottom/Simplified) -->
    <div class="sm:hidden flex border-t border-slate-100 divide-x divide-slate-100 overflow-x-auto whitespace-nowrap">
      <a href="/" class="flex-1 px-4 py-3 text-center text-[10px] font-black {isActive('/') ? 'text-primary-600' : 'text-slate-400'}">KASIR</a>
      <a href="/history" class="flex-1 px-4 py-3 text-center text-[10px] font-black {isActive('/history') ? 'text-primary-600' : 'text-slate-400'}">RIWAYAT</a>
      <a href="/products" class="flex-1 px-4 py-3 text-center text-[10px] font-black {isActive('/products') ? 'text-primary-600' : 'text-slate-400'}">PRODUK</a>
      <a href="/suppliers" class="flex-1 px-4 py-3 text-center text-[10px] font-black {isActive('/suppliers') ? 'text-primary-600' : 'text-slate-400'}">SUPPLIER</a>
      <a href="/reports" class="flex-1 px-4 py-3 text-center text-[10px] font-black {isActive('/reports') ? 'text-primary-600' : 'text-slate-400'}">LAPORAN</a>
    </div>
  </nav>

  <main class="flex-1">
    {@render children()}
  </main>
</div>
