<script>
    import { total, subtotal, cartItems, formatRupiah, parseFormattedNumber } from './CartStore.js';
    import { PrintService, SHOP_CONFIG } from './PrintService.js';
    import Modal from './Modal.svelte';

    let cashPaidString = '';
    let isPrinting = false;
    let customerName = '';
    let paymentMethod = 'TUNAI'; // 'TUNAI', 'TRANSFER', 'TEMPO'
    let paymentSubMethod = 'BCA'; // Default
    const transferOptions = ['BCA', 'BRI', 'MANDIRI', 'DANA', 'QRIS'];

    // Error Modal State
    let showErrorModal = false;
    let errorTitle = '';
    let errorMessage = '';
    
    // Derived states
    $: cashPaid = parseFormattedNumber(cashPaidString);
    $: change = Math.max(cashPaid - $total, 0);
    $: amountDue = Math.max($total - cashPaid, 0);
    $: isCashInsufficient = paymentMethod !== 'TEMPO' && $total > 0 && cashPaid > 0 && cashPaid < $total;
    $: isCashSufficient = cashPaid > 0 && cashPaid >= $total;

    function handleCashInput(e) {
        const val = e.target.value.replace(/\D/g, '');
        if (val) {
            cashPaidString = parseInt(val, 10).toLocaleString('id-ID');
        } else {
            cashPaidString = '';
        }
    }

    function handleClear() {
        if (confirm('Apakah Anda yakin ingin mengosongkan keranjang?')) {
            cartItems.clear();
            cashPaidString = '';
            customerName = '';
            paymentMethod = 'TUNAI';
        }
    }

    async function handlePrint() {
        if ($cartItems.length === 0) return;

        // Validasi Tempo: Nama Customer Wajib
        if (paymentMethod === 'TEMPO' && !customerName.trim()) {
            errorTitle = 'Data Belum Lengkap';
            errorMessage = 'Untuk pembayaran TEMPO, Nama Pelanggan wajib diisi untuk pencatatan utang.';
            showErrorModal = true;
            return;
        }

        // Validasi Selain Tempo: Uang Harus Cukup
        if (paymentMethod !== 'TEMPO' && cashPaid < $total) {
            errorTitle = 'Pembayaran Kurang';
            errorMessage = 'Jumlah bayar masih kurang. Gunakan mode TEMPO jika ingin mencatat urusan utang piutang.';
            showErrorModal = true;
            return;
        }

        isPrinting = true;
        try {
            // Gunakan ID Perangkat dari Storage, atau fallback ke ADMIN-PC jika di komputer utama
            const deviceId = localStorage.getItem('pos_device_id') || 'ADMIN-PC';

            const options = {
                customerName: customerName || 'Umum',
                paymentMethod: paymentMethod,
                paymentSubMethod: paymentMethod === 'TRANSFER' ? paymentSubMethod : 'TUNAI',
                deviceId: deviceId 
            };

            const receiptData = PrintService.buildReceiptData(SHOP_CONFIG, $cartItems, cashPaid, change, options);
            const result = await PrintService.sendToPrintServer(receiptData);

            if (result.success) {
                setTimeout(() => {
                    cartItems.clear();
                    cashPaidString = '';
                    customerName = '';
                    paymentMethod = 'TUNAI';
                    isPrinting = false;
                }, 500);
            } else {
                errorTitle = 'Gagal Mencetak';
                errorMessage = result.message;
                showErrorModal = true;
                isPrinting = false;
            }
        } catch (error) {
            errorTitle = 'Kesalahan Sistem';
            errorMessage = `Terjadi kesalahan internal: ${error.message}`;
            showErrorModal = true;
            isPrinting = false;
        }
    }
</script>

<div class="glass-card p-5 sm:p-6 sticky top-24 hover:shadow-xl transition-shadow duration-300 border-t-4 border-t-primary-500">
    <h2 class="text-xs font-bold text-slate-500 tracking-widest uppercase mb-5 flex items-center justify-between">
        <span class="flex items-center gap-2"><span>💵</span> Pembayaran</span>
        <span class="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-400">v3.0</span>
    </h2>

    <!-- Ringkasan Belanja -->
    <div class="space-y-4 mb-6">
        <div class="bg-primary-50 rounded-xl p-4 border border-primary-100 shadow-inner">
            <div class="text-sm font-semibold text-primary-600 mb-1">Total Akhir:</div>
            <div class="text-4xl font-black text-primary-600 font-mono tracking-tight">{formatRupiah($total)}</div>
        </div>
    </div>

    <!-- Metadata: Nama & Metode -->
    <div class="space-y-4 mb-6">
        <div>
            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block" for="custName">👤 Nama Pelanggan (Opsional)</label>
            <input 
                type="text" 
                id="custName" 
                bind:value={customerName}
                placeholder="Pelanggan Umum"
                class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            />
        </div>

        <div>
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">💳 Metode Pembayaran</span>
            <div class="grid grid-cols-3 gap-2">
                {#each ['TUNAI', 'TRANSFER', 'TEMPO'] as method}
                    <button 
                        on:click={() => paymentMethod = method}
                        class="py-2 text-[10px] font-bold rounded-lg border transition-all {paymentMethod === method ? 'bg-primary-600 text-white border-primary-600 shadow-md shadow-primary-500/20' : 'bg-white text-slate-500 border-slate-200 hover:border-primary-300'}"
                    >
                        {method}
                    </button>
                {/each}
            </div>

            {#if paymentMethod === 'TRANSFER'}
                <div class="mt-4 p-3 bg-primary-50 rounded-xl border border-primary-100 animate-slide-down">
                    <span class="text-[9px] font-bold text-primary-500 uppercase tracking-wider mb-2 block text-center">🏦 Pilih Bank/Wallet</span>
                    <div class="grid grid-cols-5 gap-1.5">
                        {#each transferOptions as opt}
                            <button 
                                on:click={() => paymentSubMethod = opt}
                                class="py-1.5 text-[9px] font-mono font-bold rounded-md border transition-all {paymentSubMethod === opt ? 'bg-primary-500 text-white border-primary-500' : 'bg-white text-slate-400 border-slate-200 hover:border-primary-200'}"
                            >
                                {opt}
                            </button>
                        {/each}
                    </div>
                </div>
            {/if}
        </div>
    </div>

    <!-- Input Pembayaran -->
    <div class="mb-6">
        <label class="input-label text-primary-600 flex items-center gap-2" for="cashPaid">
            💰 {paymentMethod === 'TEMPO' ? 'Bayar Awal (DP)' : 'Terima Uang'}
        </label>
        <input 
            type="text" 
            id="cashPaid" 
            bind:value={cashPaidString}
            on:input={handleCashInput}
            class="input-field text-3xl font-bold font-mono py-4! transition-colors focus:bg-primary-50" 
            placeholder="0" 
            autocomplete="off"
        >
        
        {#if paymentMethod === 'TEMPO'}
            <div class="mt-3 p-3 bg-rose-50 border border-rose-100 rounded-xl">
                <div class="text-[10px] font-bold text-rose-400 uppercase">Sisa Utang:</div>
                <div class="text-xl font-bold text-rose-600 font-mono">{formatRupiah(amountDue)}</div>
            </div>
        {:else if isCashInsufficient}
            <div class="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-600 text-sm rounded-lg flex items-center gap-2 animate-pulse">
                <span>⚠️</span> Uang bayar kurang!
            </div>
        {:else if isCashSufficient}
            <div class="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl shadow-sm animate-fade-in">
                <div class="text-[10px] font-bold text-emerald-600 mb-1">Kembali:</div>
                <div class="text-2xl font-bold text-emerald-600 font-mono">{formatRupiah(change)}</div>
            </div>
        {/if}
    </div>

    <div class="flex flex-col gap-3">
        <button 
            on:click={handlePrint} 
            disabled={isPrinting || $cartItems.length === 0}
            class="btn btn-success w-full py-4 text-lg shadow-lg shadow-emerald-500/30 active:scale-95 disabled:grayscale!"
        >
            <span class="text-xl">🖨️</span> {isPrinting ? '⏳ Mencetak...' : 'CETAK STRUK'}
        </button>
        <button 
          on:click={handleClear}
          class="text-[10px] font-bold text-slate-400 hover:text-rose-500 transition-colors py-2"
        >
            🗑️ Kosongkan Keranjang
        </button>
    </div>
</div>

<Modal 
    bind:show={showErrorModal} 
    title={errorTitle} 
    type="error"
>
    <div slot="content">
        {#each errorMessage.split('\n') as line}
            <p>{line}</p>
        {/each}
    </div>
</Modal>

