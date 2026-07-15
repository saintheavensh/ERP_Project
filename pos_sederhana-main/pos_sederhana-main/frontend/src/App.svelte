<script>
  import { onMount } from 'svelte';
  import Header from './lib/Header.svelte';
  import ProductInput from './lib/ProductInput.svelte';
  import CartTable from './lib/CartTable.svelte';
  import Payment from './lib/Payment.svelte';
  import QRCodeWidget from './lib/QRCodeWidget.svelte';
  import HistoryView from './lib/HistoryView.svelte';
  import { config } from './lib/config.js';
  import { v4 as uuidv4 } from 'uuid';

  let currentPage = 'pos'; // 'pos' or 'history'
  let isAdmin = false;
  let deviceId = '';
  let isBlocked = false;
  let needsPairing = false;
  let pairingToken = '';
  let pairingPreviewName = '';
  let pairingError = '';
  let waitingForApproval = false;
  let pendingInvites = [];

  onMount(() => {
    // 1. Hak Akses Admin (Berbasis Responsivitas Layar Desktop)
    updateAdminStatus();
    window.addEventListener('resize', updateAdminStatus);

    // 1b. Polling Antrean Pendaftaran (Hanya jika Admin)
    const invitePoll = setInterval(() => {
        if (isAdmin) checkPendingInvites();
    }, 4000);

    // 2. Identitas Perangkat (Anchor Kalibrasi)
    deviceId = localStorage.getItem('pos_device_id');
    
    // Jika di Desktop (Admin), kita paksa pakai ID ADMIN-PC agar sinkron dengan database
    if (isAdmin) {
      deviceId = 'ADMIN-PC';
      localStorage.setItem('pos_device_id', 'ADMIN-PC');
    } else if (!deviceId) {
      deviceId = uuidv4();
      localStorage.setItem('pos_device_id', deviceId);
    }

    // 3. Cek Parameter QR (?pair=TOKEN)
    checkUrlParams();

    // 4. Verifikasi Otoritas: Cek apakah perangkat sudah dikalibrasi oleh Admin
    checkCalibration();
    
    return () => {
        window.removeEventListener('resize', updateAdminStatus);
        clearInterval(invitePoll);
    };
  });

  async function checkPendingInvites() {
    const apiBase = config.apiBase;
    try {
        const res = await fetch(`${apiBase}/api/devices/invites`);
        const data = await res.json();
        if (data.success) {
            pendingInvites = data.data;
        }
    } catch (e) { console.error("Failed to poll invites"); }
  }

  async function approveInvite(token) {
    const apiBase = config.apiBase;
    try {
        await fetch(`${apiBase}/api/devices/approve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
        });
        checkPendingInvites();
    } catch (e) { console.error("Approve failed"); }
  }

  async function denyInvite(token) {
    const apiBase = config.apiBase;
    try {
        await fetch(`${apiBase}/api/devices/deny`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
        });
        checkPendingInvites();
    } catch (e) { console.error("Deny failed"); }
  }

  function updateAdminStatus() {
    isAdmin = window.innerWidth >= 1024;
  }

  async function checkUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('pair');
    if (token) {
        pairingToken = token;
        needsPairing = true; 
        // Jangan fetch name dulu, biarkan user klik "CEK KODE"
    }
  }

  async function checkCalibration() {
    if (pairingPreviewName || waitingForApproval) return; 

    const apiBase = config.apiBase;
    try {
      const metadata = getDeviceModel();
      const res = await fetch(`${apiBase}/api/devices/ping`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_id: deviceId, metadata })
      });
      
      if (res.status === 403) {
        isBlocked = true;
      } else if (res.status === 401) {
        // Jika sedang menunggu persetujuan, jangan reset ke layar input kode
        if (!waitingForApproval) {
            needsPairing = true;
        }
      } else if (res.ok) {
        // Jika sebelumnya menunggu dan sekarang OK, reload
        if (waitingForApproval) window.location.reload();
      }
    } catch (e) { console.error("Calibration check failed"); }
  }

  // 5. Validasi Token (Check Pre-claim) - MANUAL TRIGGER
  async function validateToken() {
    if (pairingToken.length !== 6) {
        pairingError = 'Masukkan 6 digit kode.';
        return;
    }
    pairingError = '';
    const apiBase = config.apiBase;
    try {
        const res = await fetch(`${apiBase}/api/devices/invite/${pairingToken}`);
        const data = await res.json();
        if (data.success) {
            pairingPreviewName = data.name;
        } else {
            pairingError = data.message;
            pairingPreviewName = '';
        }
    } catch (e) { 
        pairingError = 'Gagal menghubungi server.'; 
    }
  }

  // HP mengirim data pendaftaran (Ketuk Pintu) - Step ke Admin PC
  async function claimDevice() {
    pairingError = '';
    const apiBase = config.apiBase;
    try {
        const res = await fetch(`${apiBase}/api/devices/claim`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ device_id: deviceId, token: pairingToken, metadata: getDeviceModel() })
        });
        const data = await res.json();
        if (data.success) {
            waitingForApproval = true;
            // Mulai polling untuk cek apakah sudah disetujui
            const poll = setInterval(async () => {
                await checkCalibration();
                if (!needsPairing && !waitingForApproval) clearInterval(poll);
            }, 3000);
        } else {
            pairingError = data.message;
        }
    } catch (e) { pairingError = 'Koneksi gagal.'; }
  }

  function cancelPairing() {
    needsPairing = false;
    pairingPreviewName = '';
    pairingToken = '';
    pairingError = ''; // Reset error
    waitingForApproval = false;
    window.history.replaceState({}, document.title, "/");
  }

  function getDeviceModel() {
    const ua = navigator.userAgent;
    const screenW = window.screen.width;
    const screenH = window.screen.height;
    
    // 1. Deteksi Tablet
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
        if (/iPad/.test(ua)) return "iPad";
        return "Tablet";
    }

    // 2. Deteksi Android (Model spesifik seperti SM-G991B)
    const androidMatch = ua.match(/Android\s+([^\s;]+);\s+([^;)]+)/);
    if (androidMatch) {
        return `${androidMatch[2]}`; // Contoh: SM-G991B
    }

    // 3. Deteksi iPhone (Guessing based on Screen Size)
    // Catatan: Browser hanya memberikan "iPhone", jadi kita tebak lewat resolusi layar
    if (/iPhone/.test(ua)) {
        const ratio = window.devicePixelRatio || 1;
        const w = screenW * ratio;
        const h = screenH * ratio;

        // Peta Resolusi Populer (Logic Dasar)
        if (w === 1284 || h === 2778) return "iPhone 12/13/14 Pro Max";
        if (w === 1170 || h === 2532) return "iPhone 12/13/14 Pro";
        if (w === 1290 || h === 2796) return "iPhone 14/15 Pro Max";
        if (w === 1179 || h === 2556) return "iPhone 14/15 Pro";
        if (w === 1242 || h === 2688) return "iPhone XS Max / 11 Pro Max";
        if (w === 1125 || h === 2436) return "iPhone X / XS / 11 Pro";
        if (w === 828 || h === 1792) return "iPhone XR / 11";
        if (w === 1080 || h === 1920) return "iPhone 6/7/8 Plus";
        if (w === 750 || h === 1334) return "iPhone 6/7/8 / SE";
        
        return "iPhone (Seri Baru)";
    }

    // 4. Deteksi Desktop / PC Utama
    if (/Macintosh/.test(ua)) return "MacBook / iMac";
    if (/Windows NT/.test(ua)) return "Windows PC (Admin)";

    return "PC / Desktop";
  }
  function setPage(page) {
    currentPage = page;
  }
</script>

<div class="min-h-screen flex flex-col font-sans bg-slate-50 text-slate-800">
    <Header />

  <!-- MODAL APPROVAL GLOBAL (Hanya muncul di PC Admin) -->
  {#if isAdmin && pendingInvites.length > 0}
    <div class="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
        <div class="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-300 border border-white">
            <div class="bg-linear-to-br from-primary-600 to-primary-700 p-8 text-white text-center relative">
                <div class="absolute top-4 right-4 animate-ping w-3 h-3 bg-emerald-400 rounded-full"></div>
                <div class="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
                    <span class="text-4xl">📱</span>
                </div>
                <h2 class="text-2xl font-black tracking-tight">Perangkat Baru!</h2>
                <p class="text-xs opacity-70 font-bold uppercase tracking-widest mt-1">Permintaan Kalibrasi Masuk</p>
            </div>
            
            <div class="p-8">
                {#each pendingInvites as inv}
                    <div class="space-y-6">
                        <div class="space-y-4">
                            <div class="flex justify-between items-center text-sm">
                                <span class="text-slate-400 font-bold uppercase text-[10px]">Akan didaftarkan sbg:</span>
                                <span class="font-black text-primary-600 text-lg uppercase underline decoration-primary-200 underline-offset-4">{inv.name}</span>
                            </div>
                            
                            <div class="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                                <div class="flex items-center gap-3">
                                    <span class="text-lg">📱</span>
                                    <div>
                                        <div class="text-[10px] text-slate-400 font-bold uppercase leading-none mb-1">Model Hardware</div>
                                        <div class="text-sm font-bold text-slate-700">{inv.claiming_metadata}</div>
                                    </div>
                                </div>
                                <div class="flex items-center gap-3">
                                    <span class="text-lg">🌐</span>
                                    <div>
                                        <div class="text-[10px] text-slate-400 font-bold uppercase leading-none mb-1">Alamat IP IP</div>
                                        <div class="text-sm font-mono font-bold text-slate-700">{inv.claiming_ip}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="flex gap-3">
                            <button 
                                on:click={() => approveInvite(inv.pairing_token)}
                                class="flex-1 py-4 bg-primary-600 hover:bg-primary-700 text-white font-black rounded-2xl shadow-xl shadow-primary-500/20 transition-all active:scale-95"
                            >
                                ✅ TAMBAHKAN
                            </button>
                            <button 
                                on:click={() => denyInvite(inv.pairing_token)}
                                class="px-6 py-4 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-400 font-bold rounded-2xl transition-all"
                            >
                                TOLAK
                            </button>
                        </div>
                    </div>
                {/each}
            </div>
            <div class="px-8 pb-6 text-center">
                <p class="text-[9px] text-slate-300 leading-relaxed uppercase tracking-tighter">
                    Pastikan model perangkat sesuai dengan HP yang dibawa Kasir sebelum menyetujui.
                </p>
            </div>
        </div>
    </div>
  {/if}

  <!-- Navigation Bar (Hanya Admin) -->
  {#if isAdmin}
  <div class="bg-white border-b border-slate-200 sticky top-0 z-40">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex gap-8">
        <button 
          on:click={() => setPage('pos')}
          class="px-4 py-4 text-sm font-bold tracking-wider uppercase transition-all border-b-2 {currentPage === 'pos' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-400 hover:text-slate-600'}"
        >
          🛒 Kasir
        </button>
        <button 
          on:click={() => setPage('history')}
          class="px-4 py-4 text-sm font-bold tracking-wider uppercase transition-all border-b-2 {currentPage === 'history' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-400 hover:text-slate-600'}"
        >
          ⚙️ Admin & Riwayat
        </button>
      </div>
    </div>
  </div>
  {/if}

  <main class="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
      {#if isAdmin}
        <!-- ADMIN MODE: Selalu tampilkan POS/History tanpa interupsi kalibrasi -->
        {#if currentPage === 'pos'}
            <div class="flex flex-col lg:flex-row gap-8 animate-in fade-in duration-300">
                <div class="w-full lg:w-2/3 flex flex-col min-h-0">
                    <ProductInput />
                    <CartTable />
                </div>
                <div class="w-full lg:w-1/3 flex flex-col gap-6 relative">
                    <Payment />
                    <!-- Info Perangkat for Admin -->
                    <div class="glass-card p-4 text-xs font-mono text-slate-400 bg-white/50 border border-slate-100 rounded-2xl">
                        🔒 ADMIN MODE (DESKTOP)
                    </div>
                </div>
            </div>
        {:else}
            <HistoryView />
        {/if}
      {:else if isBlocked}
        <div class="flex flex-col items-center justify-center py-20 animate-in zoom-in duration-500">
            <div class="w-32 h-32 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-rose-200">
                <svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m0 0v2m0-2h2m-2 0H10m11 3.29V17c0-1.1-.9-2-2-2h-1.29l-1.41-1.41A2.99 2.99 0 0015 13H9a3 3 0 00-3 3v2.29l-1.41 1.41A2.99 2.99 0 005 21v1h14v-1a3 3 0 00-1.29-2.29l-1.42-1.42z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.36 6.64a9 9 0 11-12.72 0 9 9 0 0112.72 0zM12 9v2"></path>
                </svg>
            </div>
            <h1 class="text-4xl font-black text-slate-800 mb-4 tracking-tighter">AKSES DITOLAK</h1>
            <p class="text-slate-500 text-center max-w-md leading-relaxed px-6">
                Maaf, perangkat Anda saat ini sedang dalam status <span class="text-rose-600 font-bold uppercase">Diblokir</span> oleh Admin. Silakan hubungi Kasir Utama untuk aktivasi kembali.
            </p>
            <div class="mt-10 px-4 py-2 bg-slate-100 rounded-lg text-[10px] font-mono text-slate-400">
                ID: {deviceId}
            </div>
        </div>
      {:else if needsPairing}
        <div class="flex flex-col items-center justify-center py-10 animate-in slide-in-from-bottom duration-700">
            <div class="w-24 h-24 bg-primary-100 text-primary-600 rounded-3xl flex items-center justify-center mb-8 rotate-3 shadow-xl">
                <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2m4-11v1m4 11h2m-6 0h-2m4-11v1M4 10h16m-8 10v-1m6-11h2m-6 0h-2m4-11v1m4 11h2m-6 0h-2m4-11v1M4 10h16m-8 10v-1"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
            </div>
            <h1 class="text-3xl font-black text-slate-800 mb-2 tracking-tight text-center">KALIBRASI PERANGKAT</h1>
            
            {#if waitingForApproval}
                <div class="bg-white p-10 rounded-4xl shadow-2xl border-2 border-primary-100 w-full max-w-sm text-center animate-in zoom-in duration-300">
                    <div class="w-20 h-20 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center mb-8 mx-auto animate-bounce">
                        <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </div>
                    <h2 class="text-2xl font-black text-slate-800 mb-2 italic">Permintaan Terkirim!</h2>
                    <p class="text-sm text-slate-500 leading-relaxed mb-8">
                        Silakan hubungi <span class="font-bold text-primary-600">Admin</span> di PC Utama untuk menyetujui pendaftaran perangkat Anda.
                    </p>
                    <div class="text-[10px] font-mono text-slate-300 uppercase tracking-widest">Menunggu Konfirmasi...</div>
                    <button on:click={cancelPairing} class="mt-8 text-xs font-bold text-slate-400 hover:text-rose-500 transition-all uppercase">Batal & Keluar</button>
                </div>
            {:else if pairingPreviewName}
                <div class="bg-primary-600 p-8 rounded-4xl shadow-2xl text-white w-full max-w-sm text-center animate-in zoom-in duration-300">
                    <div class="text-xs font-bold opacity-60 uppercase tracking-widest mb-2">Konfirmasi Pendaftaran</div>
                    <div class="text-3xl font-black mb-4">Halo! 👋</div>
                    <p class="text-sm opacity-90 leading-relaxed mb-6">
                        Perangkat ini akan didaftarkan sebagai: <br/>
                        <span class="text-xl font-bold underline decoration-2 underline-offset-4">{pairingPreviewName}</span>
                    </p>

                    <!-- Detail Tambahan -->
                    <div class="mb-8 p-3 bg-black/10 rounded-2xl text-[10px] space-y-1 text-left">
                        <div class="flex justify-between">
                            <span class="opacity-60 uppercase">Model Perangkat:</span>
                            <span class="font-bold">{getDeviceModel()}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="opacity-60 uppercase">Alamat Server:</span>
                            <span class="font-bold">{window.location.hostname}</span>
                        </div>
                    </div>
                    
                    <div class="space-y-3">
                        <button 
                            on:click={claimDevice}
                            class="w-full py-4 bg-white text-primary-600 font-black rounded-2xl shadow-xl active:scale-95 transition-all"
                        >
                            KIRIM PERMINTAAN AKSES
                        </button>
                        <button 
                            on:click={cancelPairing}
                            class="w-full py-3 bg-primary-700/50 text-white/70 font-bold rounded-xl text-sm active:scale-95 transition-all"
                        >
                            BATAL
                        </button>
                    </div>
                </div>
            {:else}
                <p class="text-slate-500 text-center max-w-xs mb-10 text-sm">
                    Perangkat ini belum terdaftar. Silakan hubungi Admin di PC Utama untuk mendapatkan <span class="text-primary-600 font-bold">Kode/QR Kalibrasi</span>.
                </p>
                
                <div class="bg-white p-8 rounded-4xl shadow-2xl border border-slate-100 w-full max-w-sm">
                    <div class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 text-center">Masukan 6-Digit Kode</div>
                    <input 
                        type="text" 
                        maxlength="6"
                        bind:value={pairingToken}
                        placeholder="000000"
                        class="w-full text-center text-5xl font-black tracking-[0.5em] py-6 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-primary-500 focus:ring-0 outline-none transition-all placeholder:opacity-20"
                    />
                    
                    {#if pairingError}
                        <div class="mt-4 text-rose-500 text-xs font-bold text-center bg-rose-50 py-2 rounded-lg border border-rose-100">
                            ⚠️ {pairingError}
                        </div>
                    {/if}

                    <button 
                        on:click={validateToken}
                        disabled={pairingToken.length !== 6}
                        class="w-full mt-8 py-4 bg-primary-600 hover:bg-primary-700 disabled:opacity-30 disabled:grayscale text-white font-black rounded-2xl shadow-xl shadow-primary-500/30 transition-all active:scale-95"
                    >
                        CEK KODE AKSES
                    </button>
                </div>
            {/if}
            
            <div class="mt-12 text-[10px] font-mono text-slate-300">
                ID: {deviceId}
            </div>
        </div>
      {:else if currentPage === 'pos'}
        <div class="flex flex-col lg:flex-row gap-8 animate-in fade-in duration-300">
            
            <!-- Lkolom Kiri: Input & Keranjang -->
            <div class="w-full lg:w-2/3 flex flex-col min-h-0">
                <ProductInput />
                <CartTable />
            </div>

            <!-- Kolom Kanan: Pembayaran & Konfigurasi -->
            <div class="w-full lg:w-1/3 flex flex-col gap-6 relative">
                <Payment />
                
                <!-- Konfigurasi Toko (Static for now) -->
                <details class="glass-card bg-linear-to-br from-white to-slate-50/50 group cursor-pointer transition-all relative overflow-hidden">
                    <div class="absolute -top-8 -right-8 w-28 h-28 bg-blue-100 rounded-full blur-3xl opacity-40"></div>
                    <summary class="p-4 text-xs font-bold text-slate-400 tracking-widest uppercase flex items-center justify-between outline-none relative z-10">
                        <span>⚙️ Info Perangkat</span>
                        <span class="text-lg opacity-50 group-open:rotate-180 transition-transform duration-300">▾</span>
                    </summary>
                    <div class="px-4 pb-5 text-sm text-slate-600 relative z-10 border-t border-slate-200/50 pt-4">
                        <div class="flex flex-col gap-2 bg-white/60 p-3 rounded-xl border border-slate-100">
                            <span class="font-bold text-slate-800">New Majmu Service</span>
                            <span class="text-[10px] font-mono opacity-50">ID: {deviceId}</span>
                            <span class="leading-relaxed text-xs opacity-70">Akses: {isAdmin ? 'ADMIN' : 'KASIR'}</span>
                        </div>
                    </div>
                </details>
            </div>
        </div>
      {:else}
        <HistoryView />
      {/if}
  </main>

  <QRCodeWidget />
</div>

