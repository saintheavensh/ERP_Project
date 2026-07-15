<script lang="ts">
	import { cart } from './state.svelte';
	
	const formatRupiah = (amount: number) => {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(amount).replace('Rp', 'Rp ');
	};
</script>

<div class="overflow-x-auto w-full">
	<table class="w-full text-left whitespace-nowrap">
		<thead class="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
			<tr>
				<th class="px-5 py-4">Nama Barang</th>
				<th class="px-5 py-4 hidden sm:table-cell">Harga Satuan</th>
				<th class="px-5 py-4 text-center">Jml</th>
				<th class="px-5 py-4 text-right">Total</th>
				<th class="px-5 py-4 w-16 text-center">Aksi</th>
			</tr>
		</thead>
		<tbody class="divide-y divide-slate-100 text-sm">
			{#if cart.items.length === 0}
				<tr>
					<td colspan="5" class="px-5 py-12 text-center text-slate-400 font-medium">
						🛒 Keranjang masih kosong
					</td>
				</tr>
			{:else}
				{#each cart.items as item, index (index)}
					<tr class="hover:bg-primary-50/50 transition-colors group">
						<td class="px-5 py-4 font-medium text-slate-700 max-w-[150px] truncate" title={item.name}>{item.name}</td>
						<td class="px-5 py-4 text-slate-500 hidden sm:table-cell">{formatRupiah(item.price)}</td>
						<td class="px-5 py-4 text-center font-semibold text-slate-700 border-x border-slate-100 bg-slate-50/30 w-16">{item.qty}</td>
						<td class="px-5 py-4 text-right font-bold text-primary-600 w-32">{formatRupiah(item.price * item.qty)}</td>
						<td class="px-5 py-4 w-24 text-center">
							<div class="flex items-center justify-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
								<button class="p-2 bg-rose-100 text-rose-600 rounded-lg hover:bg-rose-200 transition-transform active:scale-90 shadow-sm"
									onclick={() => cart.removeItem(index)} title="Hapus">
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
