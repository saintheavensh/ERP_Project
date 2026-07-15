<script>
    import { onMount } from 'svelte';
    import { fade } from 'svelte/transition';
    import Modal from './Modal.svelte';
    import { config } from './config.js';
    import { formatRupiah } from './CartStore.js';

    let transactions = [];
    let devices = [];
    let loading = true;
    let searchQuery = '';
    
    let activeTab = 'history'; // 'history' or 'devices'

    // Modal Pelunasan
    let showPayModal = false;
    let selectedTrx = null;
    let payAmount = 0;

    // Device Edit
    let editingDevice = null;
    let newDeviceName = '';
    
    // Notifications
    let showToast = false;
    let toastMsg = '';

    // Modal Detail
    let showDetailModal = false;
    let detailTrx = null;
    let detailItems = [];

    async function openDetailModal(trx) {
        detailTrx = trx;
        try {
            detailItems = JSON.parse(trx.items_json);
        } catch (e) {
            detailItems = [];
        }
        showDetailModal = true;
    }

    async function deleteTransaction(id) {
        if (!confirm('Hapus selamanya transaksi ini dari riwayat?')) return;
        
        const apiBase = config.apiBase;
        try {
            const res = await fetch(`${apiBase}/api/transactions/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                triggerToast('Transaksi berhasil dihapus.');
                fetchData();
            }
        } catch (e) { alert('Gagal menghapus transaksi.'); }
    }

    async function fetchData(isSilent = false) {
        if (!isSilent) loading = true;
        const apiBase = config.apiBase;
        try {
            // Fetch History
            const hRes = await fetch(`${apiBase}/api/history?q=${searchQuery}`);
            const hData = await hRes.json();
            if (hData.success) transactions = hData.data;

            // Fetch Devices
            const dRes = await fetch(`${apiBase}/api/devices`);
            const dData = await dRes.json();
            if (dData.success) {
                devices = dData.data;
            }

        } catch (e) {
            console.error('Fetch error:', e);
        } finally {
            loading = false;
        }
    }

    function triggerToast(msg) {
        toastMsg = msg;
        showToast = true;
        setTimeout(() => showToast = false, 5000);
    }

    let pollInterval;
    onMount(() => {
        fetchData();
        // Polling setiap 5 detik
        pollInterval = setInterval(() => fetchData(true), 5000);
        
        return () => clearInterval(pollInterval);
    });

    function openPayModal(trx) {
        selectedTrx = trx;
        payAmount = trx.amount_due;
        showPayModal = true;
    }

    async function handlePayment() {
        if (payAmount <= 0 || payAmount > selectedTrx.amount_due) {
            alert('Jumlah pembayaran tidak valid!');
            return;
        }
        const apiBase = config.apiBase;
        try {
            const res = await fetch(`${apiBase}/api/transactions/pay-debt`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transaction_id: selectedTrx.id, amount: payAmount })
            });
            const data = await res.json();
            if (data.success) {
                alert('Pelunasan berhasil dicatat!');
                showPayModal = false;
                fetchData();
            }
        } catch (e) { alert('Gagal mencatat pelunasan.'); }
    }

    async function renameDevice(id) {
        if (!newDeviceName.trim()) return;
        const apiBase = config.apiBase;
        try {
            const res = await fetch(`${apiBase}/api/devices/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newDeviceName })
            });
            const data = await res.json();
            if (data.success) {
                editingDevice = null;
                fetchData();
            }
        } catch (e) { alert('Gagal mengubah nama perangkat.'); }
    }

    async function toggleBlock(dev) {
        const confirmMsg = dev.is_blocked ? `Aktifkan kembali akses untuk ${dev.name}?` : `Blokir akses untuk ${dev.name}? HP ini tidak akan bisa transaksi lagi.`;
        if (!confirm(confirmMsg)) return;

        const apiBase = config.apiBase;
        try {
            const res = await fetch(`${apiBase}/api/devices/${dev.device_id}/block`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_blocked: !dev.is_blocked })
            });
            const data = await res.json();
            if (data.success) fetchData();
        } catch (e) { alert('Gagal mengubah status blokir.'); }
    }

    async function deleteDevice(id) {
        if (!confirm('Hapus perangkat ini dari database?')) return;

        const apiBase = config.apiBase;
        try {
            await fetch(`${apiBase}/api/devices/${id}`, { method: 'DELETE' });
            fetchData();
        } catch (e) { alert('Gagal menghapus perangkat.'); }
    }

    // Invitation (Pending)
    let showInviteModal = false;
    let inviteName = '';
    let generatedToken = '';
    let serverIP = 'localhost';

    onMount(() => {
        fetchData();
        const interval = setInterval(() => fetchData(true), 5000);
        
        // Ambil IP Lokal Server untuk QR
        const apiBase = config.apiBase;
        fetch(`${apiBase}/api/server-info`)
            .then(res => res.json())
            .then(data => {
                if (data.success) serverIP = data.local_ip;
            })
            .catch(e => console.error("Failed to get server IP"));

        return () => clearInterval(interval);
    });

    async function createInvite() {
        if (!inviteName.trim()) return;
        const apiBase = config.apiBase;
        try {
            const res = await fetch(`${apiBase}/api/devices/invite`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: inviteName })
            });
            const data = await res.json();
            if (data.success) {
                generatedToken = data.token;
                fetchData();
            }
        } catch (e) { alert('Gagal membuat undangan.'); }
    }

    function closeInvite() {
        showInviteModal = false;
        inviteName = '';
        generatedToken = '';
    }
</script>

<div class="space-y-6 animate-in fade-in duration-500">
    <!-- Header/Tab -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div class="flex gap-4">
            <button 
                on:click={() => activeTab = 'history'}
                class="px-5 py-2 rounded-xl font-bold transition-all {activeTab === 'history' ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30' : 'bg-white text-slate-400 border border-slate-100 hover:text-slate-600'}"
            >
                🕒 Riwayat
            </button>
            <button 
                on:click={() => activeTab = 'devices'}
                class="px-5 py-2 rounded-xl font-bold transition-all {activeTab === 'devices' ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30' : 'bg-white text-slate-400 border border-slate-100 hover:text-slate-600'}"
            >
                📱 Perangkat
            </button>
        </div>
        
        <!-- Action Button based on tab -->
        <div class="flex gap-2 w-full md:w-auto">
            {#if activeTab === 'devices'}
                <button 
                    on:click={() => showInviteModal = true}
                    class="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl text-sm shadow-md shadow-emerald-500/20 hover:bg-emerald-700 transition-all flex items-center gap-2"
                >
                    <span>➕</span> Tambah Perangkat
                </button>
            {:else}
                <input 
                    type="text" 
                    placeholder="Cari No Struk atau Nama..." 
                    bind:value={searchQuery}
                    on:input={() => fetchData()}
                    class="px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 transition-all w-full md:w-64"
                />
            {/if}
        </div>
    </div>

    <!-- Modal Undangan (Pairing Invite) -->
    <Modal show={showInviteModal} on:close={closeInvite}>
        <div slot="content" class="p-6">
            <h2 class="text-2xl font-black text-slate-800 mb-2">Tambah Perangkat</h2>
            <p class="text-slate-500 text-sm mb-6">Daftarkan HP/PC Kasir baru dengan sistem kalibrasi aman.</p>
            
            {#if !generatedToken}
                <div class="space-y-4">
                    <label>
                        <span class="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Nama Perangkat / Kasir</span>
                        <input 
                            type="text" 
                            bind:value={inviteName}
                            placeholder="Contoh: HP Siska"
                            class="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                        />
                    </label>
                    <button 
                        on:click={createInvite}
                        disabled={!inviteName.trim()}
                        class="w-full py-4 bg-primary-600 text-white font-black rounded-xl shadow-lg shadow-primary-500/30 disabled:opacity-50"
                    >
                        BUAT KODE KALIBRASI
                    </button>
                </div>
            {:else}
                <div class="flex flex-col items-center py-4 space-y-4">
                    <div class="text-xs font-bold text-slate-400 uppercase">Scan QR ini di HP Kasir:</div>
                    
                    <!-- QR Code using API (Dynamic based on current URL) -->
                    <div class="p-4 bg-white rounded-3xl shadow-lg border-4 border-primary-50">
                        <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent('http://' + serverIP + ':5173' + '/?pair=' + generatedToken)}`} 
                            alt="QR pairing" 
                            class="w-48 h-48"
                        />
                    </div>

                    <div class="text-xs font-bold text-slate-400 uppercase mt-4">Atau masukan kode manual:</div>
                    <div class="text-4xl font-black text-primary-600 tracking-widest px-8 py-4 bg-primary-50 rounded-2xl border-2 border-primary-100 shadow-inner">
                        {generatedToken}
                    </div>
                    
                    <p class="text-[10px] text-slate-400 text-center px-6 leading-relaxed">
                        Gunakan kamera HP Kasir untuk men-scan QR di atas, atau buka alamat web POS dan masukkan kode manual.
                    </p>
                    <button on:click={closeInvite} class="w-full mt-4 py-2 font-bold text-slate-400 hover:text-slate-600 transition-all uppercase text-xs">Selesai / Tutup</button>
                </div>
            {/if}
        </div>
    </Modal>

    {#if activeTab === 'history'}
        <div class="glass-card overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-left text-sm">
                    <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs font-bold tracking-wider">
                        <tr>
                            <th class="px-6 py-4">Waktu</th>
                            <th class="px-6 py-4">No. Struk</th>
                            <th class="px-6 py-4">Nama Pelanggan</th>
                            <th class="px-6 py-4">Kasir</th>
                            <th class="px-6 py-4 text-right">Total</th>
                            <th class="px-6 py-4 text-right">Utang</th>
                            <th class="px-6 py-4 text-center">Status</th>
                            <th class="px-6 py-4 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        {#if loading}
                            <tr><td colspan="8" class="px-6 py-10 text-center text-slate-400 animate-pulse">Memuat data...</td></tr>
                        {:else if transactions.length === 0}
                            <tr><td colspan="8" class="px-6 py-10 text-center text-slate-400">Belum ada transaksi.</td></tr>
                        {:else}
                            {#each transactions as trx}
                                <tr class="hover:bg-slate-50/50 transition-colors">
                                    <td class="px-6 py-4 text-slate-500 whitespace-nowrap text-xs">{new Date(trx.created_at).toLocaleString('id-ID')}</td>
                                    <td class="px-6 py-4 font-mono font-medium text-xs">{trx.receipt_no}</td>
                                    <td class="px-6 py-4 font-bold">{trx.customer_name || '-'}</td>
                                    <td class="px-6 py-4">
                                        <div class="text-xs font-semibold {trx.device_blocked ? 'text-rose-600 line-through' : 'text-primary-700'}">
                                            {trx.cashier_db_name || 'Majmu Service'}
                                            {#if trx.device_blocked} <span class="bg-rose-100 text-[8px] px-1 rounded ml-1">BLOCKED</span> {/if}
                                        </div>
                                        <div class="text-[9px] text-slate-300 font-mono">{trx.device_info}</div>
                                    </td>
                                    <td class="px-6 py-4 text-right font-semibold">{formatRupiah(trx.total)}</td>
                                    <td class="px-6 py-4 text-right font-bold text-rose-600">
                                        {trx.amount_due > 0 ? formatRupiah(trx.amount_due) : '-'}
                                    </td>
                                    <td class="px-6 py-4 text-center">
                                        {#if trx.status === 'LUNAS'}
                                            <span class="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg text-[10px] font-bold border border-emerald-100">LUNAS</span>
                                        {:else}
                                            <span class="bg-rose-50 text-rose-600 px-2 py-1 rounded-lg text-[10px] font-bold border border-rose-100">TEMPO</span>
                                        {/if}
                                    </td>
                                    <td class="px-6 py-4 text-center">
                                        <div class="flex items-center justify-center gap-2">
                                            <button 
                                                on:click={() => openDetailModal(trx)}
                                                class="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                                                title="Lihat Detail"
                                            >
                                                🔍
                                            </button>

                                            {#if trx.status === 'BELUM_LUNAS'}
                                                <button 
                                                    on:click={() => openPayModal(trx)} 
                                                    class="px-2 py-1 bg-emerald-600 text-white text-[10px] font-bold rounded-lg hover:bg-emerald-700 transition-all"
                                                >
                                                    Bayar
                                                </button>
                                            {/if}

                                            <button 
                                                on:click={() => deleteTransaction(trx.id)}
                                                class="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                                title="Hapus"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            {/each}
                        {/if}
                    </tbody>
                </table>
            </div>
        </div>
    {:else}
        <!-- Tab Manajemen Perangkat -->
        <div class="glass-card p-6">
            <h3 class="font-bold text-slate-700 mb-4 flex items-center gap-2">📱 Perangkat Terdaftar <span class="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-400 font-normal">Identitas kasir per HP/PC</span></h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {#each devices as dev}
                    <div class="p-5 bg-white rounded-3xl border transition-all hover:shadow-xl hover:translate-y-[-2px] {dev.is_blocked ? 'border-rose-200 bg-rose-50/30' : 'border-slate-100'}">
                        {#if editingDevice === dev.device_id}
                            <div class="space-y-4">
                                <div class="text-[10px] font-bold text-primary-500 uppercase">Ubah Nama Kasir</div>
                                <input type="text" bind:value={newDeviceName} class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none shadow-inner focus:ring-2 focus:ring-primary-500" placeholder="Contoh: HP Siska">
                                <div class="flex gap-2">
                                    <button on:click={() => renameDevice(dev.device_id)} class="flex-1 py-2 bg-primary-600 text-white text-xs font-bold rounded-lg shadow-lg shadow-primary-500/20">Simpan</button>
                                    <button on:click={() => editingDevice = null} class="flex-1 py-2 bg-slate-100 text-slate-500 text-xs font-bold rounded-lg">Batal</button>
                                </div>
                            </div>
                        {:else}
                            <div class="flex flex-col h-full">
                                <div class="flex justify-between items-start mb-4">
                                    <div class="space-y-1">
                                        <div class="flex items-center gap-2">
                                            <div class="font-black text-slate-800 text-xl leading-tight">{dev.name}</div>
                                            {#if dev.is_blocked}
                                                <span class="bg-rose-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full ring-4 ring-rose-50">BLOCKED</span>
                                            {/if}
                                        </div>
                                        <div class="flex flex-col gap-1.5 pt-2">
                                            <span class="text-[10px] font-semibold text-slate-500 flex items-center gap-2 bg-slate-100/50 w-fit px-2 py-1 rounded-lg">
                                                <span class="opacity-70">📱</span> {dev.metadata || 'Unknown Model'}
                                            </span>
                                            <span class="text-[10px] font-semibold text-slate-500 flex items-center gap-2 bg-slate-100/50 w-fit px-2 py-1 rounded-lg">
                                                <span class="opacity-70">🌐</span> {dev.last_ip || '---'}
                                            </span>
                                        </div>
                                    </div>
                                    <div class="flex flex-col gap-1">
                                        <button 
                                            on:click={() => { editingDevice = dev.device_id; newDeviceName = dev.name; }} 
                                            class="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
                                            title="Rename"
                                        >
                                            ✏️
                                        </button>
                                        <button 
                                            on:click={() => deleteDevice(dev.device_id)} 
                                            class="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                            title="Hapus Dari Daftar"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                                
                                <div class="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                                    <div class="text-[8px] font-mono text-slate-300 truncate max-w-[120px]">ID: {dev.device_id}</div>
                                    <button 
                                        on:click={() => toggleBlock(dev)}
                                        class="px-4 py-1.5 rounded-full text-xs font-black transition-all {dev.is_blocked ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-rose-100 text-rose-700 hover:bg-rose-200'}"
                                    >
                                        {dev.is_blocked ? 'AKTIFKAN' : 'BLOKIR'}
                                    </button>
                                </div>
                            </div>
                        {/if}
                    </div>
                {/each}
            </div>
        </div>
    {/if}
</div>

    <!-- Modal Detail Transaksi -->
    <Modal show={showDetailModal} on:close={() => showDetailModal = false}>
        <div slot="content" class="p-6">
            <h2 class="text-2xl font-black text-slate-800 mb-1">Detail Transaksi</h2>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">{detailTrx?.receipt_no} • {detailTrx ? new Date(detailTrx.created_at).toLocaleString('id-ID') : ''}</p>
            
            <div class="space-y-4 mb-6">
                <!-- Info Header -->
                <div class="flex justify-between items-start border-b pb-4 border-slate-100">
                    <div>
                        <div class="text-[10px] font-bold text-slate-400 uppercase mb-1">Pelanggan</div>
                        <div class="font-bold text-slate-700">{detailTrx?.customer_name || 'Umum'}</div>
                    </div>
                    <div class="text-right">
                        <div class="text-[10px] font-bold text-slate-400 uppercase mb-1">Kasir</div>
                        <div class="font-bold text-primary-600">{detailTrx?.cashier_db_name || 'NEW MAJMU Service'}</div>
                    </div>
                </div>

                <!-- Item List -->
                <div class="bg-slate-50 rounded-2xl p-4 overflow-hidden">
                    <table class="w-full text-xs">
                        <thead>
                            <tr class="text-slate-400 font-bold uppercase border-b border-slate-200">
                                <th class="text-left pb-2">Item</th>
                                <th class="text-center pb-2">QTY</th>
                                <th class="text-right pb-2">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            {#each detailItems as item}
                                <tr>
                                    <td class="py-2 pr-2">
                                        <div class="font-bold text-slate-700">{item.name}</div>
                                        <div class="text-[10px] text-slate-400">{formatRupiah(Number(item.price))}</div>
                                    </td>
                                    <td class="text-center py-2 font-mono text-slate-500">{item.qty || item.quantity || 0}</td>
                                    <td class="text-right py-2 font-bold text-slate-700">{formatRupiah(Number(item.price) * Number(item.qty || item.quantity || 0))}</td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>

                <!-- Payment Summary -->
                <div class="space-y-2 pt-2">
                    <div class="flex justify-between items-center text-sm">
                        <span class="text-slate-400">Total Belanja:</span>
                        <span class="font-bold text-slate-700">{formatRupiah(Number(detailTrx?.total || 0))}</span>
                    </div>
                    <div class="flex justify-between items-center text-sm">
                        <span class="text-slate-400">Metode Bayar:</span>
                        <span class="font-bold text-emerald-600 uppercase tracking-tighter">{detailTrx?.payment_method}</span>
                    </div>
                    <div class="flex justify-between items-center text-sm">
                        <span class="text-slate-400 font-medium">Uang Diterima:</span>
                        <span class="font-bold text-slate-700">{formatRupiah(Number(detailTrx?.cash_paid || 0))}</span>
                    </div>
                    {#if Number(detailTrx?.change_amount) > 0}
                        <div class="flex justify-between items-center text-sm pt-1 border-t border-dashed border-slate-200">
                            <span class="text-primary-600 font-bold">Kembalian:</span>
                            <span class="font-black text-primary-600 text-lg">{formatRupiah(Number(detailTrx.change_amount))}</span>
                        </div>
                    {/if}
                </div>
            </div>

            <button 
                on:click={() => showDetailModal = false}
                class="w-full py-3 bg-slate-100 text-slate-500 font-bold rounded-xl hover:bg-slate-200 transition-all uppercase text-[10px]"
            >
                Tutup Jendela ini
            </button>
        </div>
    </Modal>

<Modal bind:show={showPayModal} title="Pelunasan Hutang">
    <div slot="content">
        {#if selectedTrx}
            <div class="space-y-6">
                <!-- Info same as before but prettier -->
                <div class="p-4 bg-slate-50 rounded-xl">
                    <div class="text-xs font-bold text-slate-400 uppercase mb-1">Pelanggan</div>
                    <div class="font-bold text-lg">{selectedTrx.customer_name}</div>
                </div>
                <div class="bg-white p-8 rounded-3xl shadow-2xl border border-slate-100 w-full max-w-sm">
                    <div class="text-xs font-bold text-rose-400 uppercase mb-1">Sisa Tagihan</div>
                    <div class="font-bold text-2xl text-rose-600">{formatRupiah(selectedTrx.amount_due)}</div>
                </div>
                <div class="space-y-2">
                    <label for="payAmount" class="text-xs font-bold text-slate-400 uppercase">Jumlah Bayar Sekarang</label>
                    <input type="number" id="payAmount" bind:value={payAmount} class="w-full px-4 py-3 border border-slate-200 rounded-xl font-bold text-xl text-emerald-600" />
                </div>
                <button on:click={handlePayment} class="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold text-lg">Konfirmasi</button>
            </div>
        {/if}
    </div>
</Modal>

