<script lang="ts">
  import { afterNavigate } from '$app/navigation';
  import GlobalSearch from '$lib/components/layout/GlobalSearch.svelte';

  let { data, children } = $props();
  let user = $derived(data.user);

  // P1.5 (mobile shell fix) — the sidebar is an off-canvas drawer below the `md`
  // breakpoint, a static column above it. Closed by default on every viewport;
  // `md:translate-x-0` below makes it visually always-open on desktop regardless
  // of this flag, matching the original desktop behavior exactly.
  let mobileNavOpen = $state(false);
  afterNavigate(() => { mobileNavOpen = false; });

  /**
   * S2 (track penyederhanaan) — menu dibagi dua: pekerjaan HARIAN yang selalu
   * terlihat rata, dan "Lainnya" yang tertutup secara default.
   *
   * Aturannya "atur sekali, lalu menghilang": sebuah toko servis mengerjakan
   * empat hal tiap hari (terima/kerjakan servis, terima uang, cek stok, cari
   * pelanggan). Sisanya — beli barang, lihat uang masuk-keluar, ubah alur,
   * atur printer — disentuh mingguan atau sekali seumur pemasangan, jadi tidak
   * berhak memakan baris menu tiap hari.
   *
   * Menghilang dari menu BUKAN hilang: tiap tujuan di bawah tetap ada, dan
   * yang benar-benar sering dipakai juga terjangkau dari layar tempat ia
   * dibutuhkan (mis. tombol "Barang Masuk" ada di halaman Stok).
   */
  interface MenuItem {
    label: string;
    path?: string;
    /** Tertutup saat dimuat bila `false`. Hanya berarti untuk item bergrup. */
    open?: boolean;
    subItems?: Array<{ label: string; path: string }>;
  }

  let menuItems = $derived.by((): MenuItem[] => {
    const beranda: MenuItem = { label: 'Beranda', path: '/' };

    if (user?.roleName === 'Super Admin') {
      return [
        beranda,
        { label: 'Servis', path: '/tickets' },
        { label: 'Kasir', path: '/pos' },
        { label: 'Stok', path: '/inventory' },
        { label: 'Pelanggan', path: '/customers' },
        {
          label: 'Lainnya',
          open: false,
          subItems: [
            { label: 'Pembelian', path: '/inventory/purchasing' },
            { label: 'Keuangan', path: '/finance' },
            { label: 'Katalog Produk', path: '/inventory/catalog' },
            { label: 'Supplier', path: '/inventory/suppliers' },
            { label: 'Katalog Device', path: '/devices' },
            { label: 'Alur Servis', path: '/flows' },
            { label: 'Setelan', path: '/settings' }
          ]
        }
      ];
    }

    if (user?.roleName === 'Manager') {
      return [
        beranda,
        { label: 'Servis', path: '/tickets' },
        { label: 'Kasir', path: '/pos' },
        { label: 'Stok', path: '/inventory' },
        {
          label: 'Lainnya',
          open: false,
          subItems: [
            { label: 'Keuangan', path: '/finance' },
            { label: 'Katalog Produk', path: '/catalog' }
          ]
        }
      ];
    }

    if (user?.roleName === 'Technician') {
      // Tahap-B — katalog baca-saja supaya teknisi bisa mengecek harga & stok
      // sparepart tanpa akses admin inventory.
      return [
        beranda,
        { label: 'Pekerjaan Saya', path: '/tickets' },
        { label: 'Katalog Produk', path: '/catalog' }
      ];
    }

    if (user?.roleName === 'Cashier') {
      return [
        beranda,
        { label: 'Kasir', path: '/pos' },
        { label: 'Katalog Produk', path: '/catalog' }
      ];
    }

    return [beranda];
  });
</script>

<div class="flex h-screen w-full bg-gray-50">
  <!-- P1.5 — mobile backdrop: tap outside the drawer to close it. Desktop never
       shows this (mobileNavOpen only opens the drawer below the md breakpoint,
       and this element only renders in the DOM while it's open). -->
  {#if mobileNavOpen}
    <button
      type="button"
      class="fixed inset-0 bg-slate-900/60 z-40 md:hidden"
      onclick={() => mobileNavOpen = false}
      aria-label="Tutup menu (latar)"
    ></button>
  {/if}

  <aside class="
    fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col
    transform transition-transform duration-200 ease-in-out
    md:relative md:translate-x-0
    {mobileNavOpen ? 'translate-x-0' : '-translate-x-full'}
  ">
    <div class="h-16 flex items-center justify-between px-6 font-bold text-xl border-b border-slate-800">
      FlowServ
      <button
        type="button"
        class="md:hidden text-slate-400 hover:text-white"
        onclick={() => mobileNavOpen = false}
        aria-label="Tutup menu"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
      </button>
    </div>

    <div class="px-6 py-4 border-b border-slate-800 text-sm">
      <div class="text-slate-400">Masuk sebagai:</div>
      <div class="font-medium truncate">{user?.name}</div>
      <div class="text-xs text-slate-500 mt-1 capitalize border border-slate-700 bg-slate-800 inline-block px-2 py-0.5 rounded">{user?.roleName}</div>
    </div>

    {#if user?.roleName === 'no-role'}
      <div class="mx-4 mt-4 p-3 bg-amber-900/40 border border-amber-700/60 rounded-lg text-xs text-amber-200">
        Belum ada role yang ditetapkan untuk akun Anda. Hubungi administrator untuk mendapatkan akses.
      </div>
    {/if}

    <nav class="flex-1 p-4 space-y-2 overflow-y-auto">
      {#each menuItems as item}
        {#if item.subItems}
          <!-- "Lainnya" datang dengan open:false — tertutup sampai benar-benar
               dibutuhkan. Grup lain (kalau kelak ada) tetap terbuka. -->
          <details class="group" open={item.open !== false}>
            <summary class="flex justify-between items-center px-4 py-2 bg-slate-800 rounded-md hover:bg-slate-700 cursor-pointer transition-colors list-none">
              <span>{item.label}</span>
              <svg class="w-4 h-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
            </summary>
            <div class="mt-1 pl-4 space-y-1">
              {#each item.subItems as sub}
                <a href={sub.path} class="block px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition-colors">
                  {sub.label}
                </a>
              {/each}
            </div>
          </details>
        {:else}
          <a href={item.path} class="block px-4 py-2 bg-slate-800 rounded-md hover:bg-slate-700 transition-colors">
            {item.label}
          </a>
        {/if}
      {/each}
    </nav>
    
    <div class="p-4 border-t border-slate-800">
      <form method="POST" action="/logout">
        <button type="submit" class="w-full text-left px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors flex items-center">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
          </svg>
          Keluar
        </button>
      </form>
    </div>
  </aside>

  <!-- Main Content -->
  <main class="flex-1 flex flex-col overflow-hidden min-w-0">
    <header class="h-16 bg-white border-b flex items-center gap-3 px-4 md:px-6 shadow-sm shrink-0">
      <button
        type="button"
        class="md:hidden text-slate-500 hover:text-slate-800 -ml-1 p-1"
        onclick={() => mobileNavOpen = true}
        aria-label="Buka menu"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
      </button>
      <!-- S1 — judul statis "System Dashboard" dihapus: ia tertulis sama di 33
           dari 34 halaman, jadi selalu salah kecuali di beranda. Tiap halaman
           sudah punya judulnya sendiri di bawah header ini. -->
      <div class="flex-1 flex sm:justify-center">
        <GlobalSearch token={data.token} />
      </div>
    </header>
    <div class="flex-1 overflow-auto p-4 md:p-6">
      {@render children()}
    </div>
  </main>
</div>
