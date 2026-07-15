<script>
  import Header from './lib/Header.svelte';
  import ProductInput from './lib/ProductInput.svelte';
  import CartTable from './lib/CartTable.svelte';
  import Payment from './lib/Payment.svelte';
  import QRCodeWidget from './lib/QRCodeWidget.svelte';
</script>

<div class="min-h-screen flex flex-col font-sans bg-slate-50 text-slate-800">
  <Header />

  <main class="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
      <div class="flex flex-col lg:flex-row gap-8">
          
          <!-- Lkolom Kiri: Input & Keranjang -->
          <div class="w-full lg:w-2/3 flex flex-col min-h-0">
              <ProductInput />
              <CartTable />
          </div>

          <!-- Kolom Kanan: Pembayaran & Konfigurasi -->
          <div class="w-full lg:w-1/3 flex flex-col gap-6 relative">
              <Payment />
              
              <!-- Konfigurasi Toko (Static for now) -->
              <details class="glass-card bg-linear-to-br from-white to-slate-50/50 group cursor-pointer selection:bg-transparent transition-all relative overflow-hidden">
                  <div class="absolute -top-8 -right-8 w-28 h-28 bg-blue-100 rounded-full blur-3xl opacity-40"></div>
                  
                  <summary class="p-4 text-xs font-bold text-slate-400 tracking-widest uppercase flex items-center justify-between outline-none relative z-10">
                      <span>⚙️ Konfigurasi Toko</span>
                      <span class="text-lg opacity-50 group-open:rotate-180 transition-transform duration-300 relative -top-[2px] leading-none">▾</span>
                  </summary>
                  
                  <div class="px-4 pb-5 text-sm text-slate-600 relative z-10 border-t border-slate-200/50 pt-4 opacity-0 group-open:opacity-100 transition-opacity">
                      <div class="flex flex-col gap-2 bg-white/60 p-3 rounded-xl border border-slate-100">
                          <span class="font-bold text-slate-800">NEW MAJMU Service</span>
                          <span class="leading-relaxed">Jl. Anyar Kp Bojong Kukun Rt01/Rw09<br>Majalaya - Bandung</span>
                      </div>
                  </div>
              </details>
          </div>
      </div>
  </main>

  <QRCodeWidget />
</div>
