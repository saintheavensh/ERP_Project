<script>
    import { cartItems } from './CartStore.js';

    let name = '';
    let priceInput = '';
    let qty = 1;

    // Helper for formatting input
    function formatThousands(value) {
        const num = String(value).replace(/\D/g, '');
        if (!num) return '';
        return parseInt(num, 10).toLocaleString('id-ID');
    }

    function parseFormattedNumber(str) {
        return parseInt(String(str).replace(/\D/g, ''), 10) || 0;
    }

    function handlePriceInput(e) {
        priceInput = formatThousands(e.target.value);
    }

    function handleSubmit() {
        const parsedPrice = parseFormattedNumber(priceInput);
        if (!name.trim() || parsedPrice <= 0 || qty <= 0) {
            alert('Silahkan isi data dengan benar');
            return;
        }

        cartItems.addItem(name.trim(), parsedPrice, qty);
        
        // Reset form
        name = '';
        priceInput = '';
        qty = 1;

        // refocus handled in app.svelte or let it be for now
    }
</script>

<div class="glass-card p-5 sm:p-6 mb-6 hover:shadow-xl transition-shadow duration-300">
    <h2 class="text-xs font-bold text-slate-500 tracking-widest uppercase mb-5 flex items-center gap-2">
        <span>🛍️</span> Input Barang
    </h2>
    <form on:submit|preventDefault={handleSubmit} class="space-y-5">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
                <label class="input-label" for="itemName">Nama Barang</label>
                <input type="text" id="itemName" bind:value={name} class="input-field" placeholder="Contoh: LCD Oppo A15" required autocomplete="off">
            </div>
            <div>
                <label class="input-label" for="itemPrice">Harga (Rp)</label>
                <input type="text" id="itemPrice" bind:value={priceInput} on:input={handlePriceInput} class="input-field font-mono" placeholder="0" required autocomplete="off">
            </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-5 items-end">
            <div>
                <label class="input-label" for="itemQty">Jumlah</label>
                <input type="number" id="itemQty" bind:value={qty} class="input-field font-mono text-center" min="1" required>
            </div>
            <button type="submit" class="btn btn-primary w-full shadow-lg shadow-blue-500/30">
                <span class="text-lg">+</span> Tambah
            </button>
        </div>
    </form>
</div>
