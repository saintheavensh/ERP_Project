<script lang="ts">
	import { onMount } from 'svelte';
	import Card from '$lib/components/ui/Card.svelte';

	let reportData = $state({
		totalRevenue: 0,
		totalCogs: 0,
		totalProfit: 0,
		transactionCount: 0
	});
	let isLoading = $state(true);

	async function fetchReport() {
		try {
			const res = await fetch('http://localhost:3000/api/transactions/report');
			const data = await res.json();
			if (data.success) reportData = data.data;
		} catch (err) {
			console.error(err);
		} finally {
			isLoading = false;
		}
	}

	onMount(fetchReport);
</script>

<div class="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
	<div>
		<h1 class="text-4xl font-black text-slate-900 tracking-tight text-center">📊 Laporan Laba / Rugi</h1>
		<p class="text-slate-500 font-bold text-center mt-2 uppercase tracking-widest text-xs">Informasi real-time performa toko Anda</p>
	</div>

	{#if isLoading}
		<div class="flex justify-center p-20">
			<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
			<!-- Revenue -->
			<Card class="p-8 border-none bg-linear-to-br from-indigo-600 to-primary-700 text-white shadow-2xl relative overflow-hidden h-64 flex flex-col justify-between group">
				<div class="absolute -right-6 -top-6 text-9xl opacity-10 group-hover:scale-110 transition-transform duration-700">💰</div>
				<div class="relative z-10">
					<div class="text-indigo-100 font-black text-xs uppercase tracking-widest mb-1">Total Omzet (Revenue)</div>
					<div class="text-4xl font-black tracking-tighter">Rp {reportData.totalRevenue.toLocaleString('id-ID')}</div>
				</div>
                <div class="relative z-10 p-4 bg-white/10 rounded-2xl backdrop-blur-md">
                    <p class="text-xs font-bold text-indigo-50">Total uang masuk dari seluruh penjualan.</p>
                </div>
			</Card>

			<!-- COGS -->
			<Card class="p-8 border-none bg-linear-to-br from-rose-500 to-rose-700 text-white shadow-2xl relative overflow-hidden h-64 flex flex-col justify-between group">
				<div class="absolute -right-6 -top-6 text-9xl opacity-10 group-hover:scale-110 transition-transform duration-700">📦</div>
				<div class="relative z-10">
					<div class="text-rose-100 font-black text-xs uppercase tracking-widest mb-1">Total Modal (HPP)</div>
					<div class="text-4xl font-black tracking-tighter">Rp {reportData.totalCogs.toLocaleString('id-ID')}</div>
				</div>
                <div class="relative z-10 p-4 bg-white/10 rounded-2xl backdrop-blur-md">
                    <p class="text-xs font-bold text-rose-50">Nilai modal barang berdasarkan batch FIFO.</p>
                </div>
			</Card>

			<!-- Gross Profit -->
			<Card class="p-8 border-none bg-linear-to-br from-emerald-500 to-emerald-700 text-white shadow-2xl relative overflow-hidden h-64 flex flex-col justify-between group">
				<div class="absolute -right-6 -top-6 text-9xl opacity-10 group-hover:scale-110 transition-transform duration-700">📈</div>
				<div class="relative z-10">
					<div class="text-emerald-100 font-black text-xs uppercase tracking-widest mb-1">Laba Kotor (Profit)</div>
					<div class="text-4xl font-black tracking-tighter">Rp {reportData.totalProfit.toLocaleString('id-ID')}</div>
				</div>
                <div class="relative z-10 p-4 bg-white/10 rounded-2xl backdrop-blur-md">
                    <p class="text-xs font-bold text-emerald-50">Estimasi keuntungan bersih sebelum operasional.</p>
                </div>
			</Card>
		</div>

        <!-- Additional Stats -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
            <Card class="p-8 border-slate-200">
                <div class="flex items-center justify-between mb-8">
                    <h3 class="font-black text-slate-800 text-lg uppercase">Informasi Transaksi</h3>
                    <span class="p-3 bg-slate-100 rounded-2xl">📑</span>
                </div>
                <div class="space-y-6">
                    <div class="flex justify-between items-center pb-4 border-b border-slate-100">
                        <span class="text-slate-500 font-bold uppercase text-xs tracking-widest">Total Transaksi Selesai</span>
                        <span class="text-2xl font-black text-slate-900">{reportData.transactionCount}</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-slate-500 font-bold uppercase text-xs tracking-widest">Rata-rata Profit per Nota</span>
                        <span class="text-2xl font-black text-slate-900">
                            Rp {reportData.transactionCount > 0 ? (reportData.totalProfit / reportData.transactionCount).toLocaleString('id-ID', { maximumFractionDigits: 0 }) : 0}
                        </span>
                    </div>
                </div>
            </Card>

            <Card class="p-8 border-emerald-100 bg-emerald-50/30">
                <div class="flex items-center gap-4 mb-6">
                    <span class="text-3xl">✨</span>
                    <div>
                        <h4 class="font-black text-slate-900 uppercase text-sm">Akurasi FIFO Terverifikasi</h4>
                        <p class="text-slate-500 text-sm font-bold">Semua data laba dihitung secara presisi berdasarkan harga modal stok yang masuk.</p>
                    </div>
                </div>
                <div class="p-4 bg-white rounded-2xl border border-emerald-100 italic text-slate-400 text-xs font-medium leading-relaxed">
                    "Data laporan ini bersifat dinamis. Setiap kali Anda melakukan 'Input Nota Pembelian' dari Supplier, batch stok akan tercatat. Saat Kasir melakukan checkout, sistem secara otomatis menarik modal dari batch tertua (FIFO) untuk menghasilkan angka profit di atas."
                </div>
            </Card>
        </div>
	{/if}
</div>
