<script>
    import { total, subtotal, cartItems, formatRupiah, parseFormattedNumber } from './CartStore.js';
    import { PrintService, SHOP_CONFIG } from './PrintService.js';

    let cashPaidString = '';
    let isPrinting = false;
    
    // Derived states
    $: cashPaid = parseFormattedNumber(cashPaidString);
    $: change = Math.max(cashPaid - $total, 0);
    $: isCashInsufficient = $total > 0 && cashPaid > 0 && cashPaid < $total;
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
        }
    }

    async function handlePrint() {
        if ($cartItems.length === 0) {
            alert('Keranjang belanja kosong!');
            return;
        }

        if (cashPaid < $total) {
            alert('⚠️ Jumlah bayar kurang dari total! Silakan masukkan jumlah yang cukup.');
            return;
        }

        isPrinting = true;
        try {
            const receiptData = PrintService.buildReceiptData(SHOP_CONFIG, $cartItems, cashPaid, change);
            const result = await PrintService.sendToPrintServer(receiptData);

            if (result.success) {
                setTimeout(() => {
                    cartItems.clear();
                    cashPaidString = '';
                    isPrinting = false;
                }, 1000);
            } else {
                alert(`Sistem cetak server bermasalah: ${result.message}\n\nKita coba pakai cetak browser...`);
                // Fallback to browser print isn't fully implemented in Svelte yet, 
                // we'll keep it simple or implement it later.
                window.print();
                cartItems.clear();
                cashPaidString = '';
                isPrinting = false;
            }
        } catch (error) {
            alert(`Gagal mencetak: ${error.message}`);
            isPrinting = false;
        }
    }
</script>

<div class="glass-card p-5 sm:p-6 sticky top-24 hover:shadow-xl transition-shadow duration-300 border-t-4 border-t-primary-500">
    <h2 class="text-xs font-bold text-slate-500 tracking-widest uppercase mb-5 flex items-center gap-2">
        <span>💵</span> Pembayaran
    </h2>

    <div class="space-y-4 mb-6">
        <div class="flex justify-between items-center text-slate-600 font-medium">
            <span>Subtotal</span>
            <span class="font-mono">{formatRupiah($subtotal)}</span>
        </div>
        <div class="flex justify-between items-center text-slate-600 font-medium pb-4 border-b border-slate-100 border-dashed">
            <span>Potongan</span>
            <span class="font-mono">Rp 0</span>
        </div>
        <div class="bg-primary-50 rounded-xl p-4 border border-primary-100 shadow-inner mt-2">
            <div class="text-sm font-semibold text-primary-600 mb-1">Total Akhir:</div>
            <div class="text-4xl font-black text-primary-600 font-mono tracking-tight">{formatRupiah($total)}</div>
        </div>
    </div>

    <div class="mb-6">
        <label class="input-label text-primary-600 flex items-center gap-2" for="cashPaid">
            💰 Terima (Cash)
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
        
        {#if isCashInsufficient}
            <div class="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-600 text-sm rounded-lg flex items-center gap-2 animate-pulse">
                <span>⚠️</span> Uang bayar kurang!
            </div>
        {/if}

        {#if isCashSufficient}
            <div class="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl shadow-sm animate-fade-in">
                <div class="text-sm font-semibold text-emerald-600 mb-1">Kembali:</div>
                <div class="text-2xl font-bold text-emerald-600 font-mono">{formatRupiah(change)}</div>
            </div>
        {/if}
    </div>

    <div class="flex flex-col gap-3">
        <button 
            on:click={handlePrint} 
            disabled={isPrinting}
            class="btn btn-success w-full py-4 text-lg shadow-lg shadow-emerald-500/30"
        >
            <span class="text-xl">🖨️</span> {isPrinting ? '⏳ Mencetak...' : 'CETAK STRUK'}
        </button>
        <button 
            on:click={handleClear}
            class="btn btn-danger-outline py-2 border-dashed"
        >
            <span class="opacity-70 text-sm">🗑️</span> Kosongkan
        </button>
    </div>
</div>
