<script>
    import { cartItems, formatRupiah } from './CartStore.js';

    function removeItem(index) {
        cartItems.removeItem(index);
    }
</script>

<div class="glass-card mb-6 overflow-hidden flex flex-col h-full hover:shadow-xl transition-shadow duration-300">
    <div class="overflow-x-auto grow">
        <table class="w-full text-left text-sm whitespace-nowrap">
            <thead class="bg-slate-50/80 text-slate-500 text-xs uppercase tracking-wider sticky top-0 z-10 backdrop-blur-md">
                <tr>
                    <th class="px-5 py-4 font-bold border-b border-slate-200">Nama Barang</th>
                    <th class="px-5 py-4 font-bold border-b border-slate-200 hidden sm:table-cell">Harga Satuan</th>
                    <th class="px-5 py-4 font-bold border-b border-slate-200 text-center w-16">Jml</th>
                    <th class="px-5 py-4 font-bold border-b border-slate-200 text-right w-32">Total</th>
                    <th class="px-5 py-4 font-bold border-b border-slate-200 text-center w-24">Aksi</th>
                </tr>
            </thead>
            <tbody id="cart-items" class="divide-y divide-slate-100">
                {#if $cartItems.length === 0}
                    <tr>
                        <td colspan="5" class="px-5 py-12 text-center text-slate-400 font-medium">
                            🛒 Keranjang masih kosong
                        </td>
                    </tr>
                {:else}
                    {#each $cartItems as item, index}
                        <tr class="hover:bg-primary-50/50 transition-colors group">
                            <td class="px-5 py-4 font-medium text-slate-700 max-w-[150px] truncate" title={item.name}>{item.name}</td>
                            <td class="px-5 py-4 text-slate-500 hidden sm:table-cell">{formatRupiah(item.price)}</td>
                            <td class="px-5 py-4 text-center font-semibold text-slate-700 border-x border-slate-100 bg-slate-50/30 w-16">{item.qty}</td>
                            <td class="px-5 py-4 text-right font-bold text-primary-600 w-32">{formatRupiah(item.price * item.qty)}</td>
                            <td class="px-5 py-4 w-24 text-center">
                                <div class="flex items-center justify-center gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                    <button on:click={() => removeItem(index)} class="btn-icon p-2 bg-rose-100 text-rose-600 rounded-lg hover:bg-rose-200 transition-transform active:scale-90 shadow-sm" title="Hapus">
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
