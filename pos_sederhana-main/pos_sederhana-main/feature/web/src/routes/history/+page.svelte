<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import { onMount } from 'svelte';

	let transactions = $state<any[]>([]);
	let isLoading = $state(true);
	let errorMsg = $state('');

	// Search State
	let searchQuery = $state('');
	let filteredTransactions = $derived(
		transactions.filter(t => 
			(t.customerName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
			t.receiptNo.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

	// Modal Pembayaran State
	let showModal = $state(false);
	let selectedTrx = $state<any>(null);
	let payInputStr = $state('');
	let isSubmitting = $state(false);

	// Modal Detail State
	let showDetailModal = $state(false);
	let detailData = $state<any>(null);
	let isFetchingDetail = $state(false);

	const fetchHistory = async () => {
		try {
			const res = await fetch('http://localhost:3000/api/transactions/history');
			const data = await res.json();
			if (data.success) {
				transactions = data.data;
			} else {
				errorMsg = data.message;
			}
		} catch (err: any) {
			errorMsg = err.message;
		} finally {
			isLoading = false;
		}
	};

	const formatRibuan = (val: any) => {
		const num = String(val).replace(/\D/g, '');
		if (!num) return '0';
		return parseInt(num, 10).toLocaleString('id-ID');
	};

	const openModal = (trx: any) => {
		selectedTrx = trx;
		payInputStr = formatRibuan(trx.amountDue.toString());
		showModal = true;
	};

	const closeModal = () => {
		showModal = false;
		selectedTrx = null;
		payInputStr = '';
	};

	const openDetail = async (id: string) => {
		isFetchingDetail = true;
		showDetailModal = true;
		try {
			const res = await fetch(`http://localhost:3000/api/transactions/${id}`);
			const data = await res.json();
			if (data.success) {
				detailData = data.data;
			} else {
				alert(data.message);
				showDetailModal = false;
			}
		} catch (err: any) {
			alert(err.message);
			showDetailModal = false;
		} finally {
			isFetchingDetail = false;
		}
	};

	const submitPayment = async () => {
		const amount = parseInt(payInputStr.replace(/\D/g, ''));
		if (!amount || amount <= 0 || amount > selectedTrx.amountDue) {
			alert('Jumlah tidak valid atau melebihi sisa utang!');
			return;
		}

		isSubmitting = true;
		try {
			const res = await fetch('http://localhost:3000/api/transactions/pay-tempo', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ transactionId: selectedTrx.id, amount })
			});
			const data = await res.json();
			if (data.success) {
				alert("Pembayaran berhasil dicatat!");
				closeModal();
				fetchHistory(); // Refresh
			} else {
				alert(data.message);
			}
		} catch (err: any) {
			alert(err.message);
		} finally {
			isSubmitting = false;
		}
	};

	onMount(() => {
		fetchHistory();
	});
</script>

<svelte:head>
	<title>Riwayat - New Majmu POS</title>
</svelte:head>

<div class="w-full max-w-6xl mx-auto p-4 md:p-6 lg:p-8 relative">
	<header class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-4 border-b border-slate-200 gap-4">
		<h1 class="text-2xl font-bold text-slate-700 flex items-center gap-3">
			<span class="p-2 bg-slate-200 rounded-xl">🕒</span> RIWAYAT TRANSAKSI
		</h1>
		<div class="flex gap-3 w-full md:w-auto">
			<Input id="search" label="" placeholder="Cari Nama / No Struk..." bind:value={searchQuery} class="w-full md:w-64" />
			<a href="/" class="px-4 py-2 bg-primary-100 text-primary-700 font-semibold rounded-lg hover:bg-primary-200 flex items-center shrink-0">⬅ Kasir</a>
		</div>
	</header>

	<Card>
		{#if isLoading}
			<div class="text-center py-10 text-slate-500">Memuat data...</div>
		{:else if errorMsg}
			<div class="text-center py-10 text-rose-500">{errorMsg}</div>
		{:else if filteredTransactions.length === 0}
			<div class="text-center py-10 text-slate-500 font-medium">Brak! Data tidak ditemukan.</div>
		{:else}
			<div class="overflow-x-auto w-full">
				<table class="w-full text-left whitespace-nowrap text-sm">
					<thead class="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-xs">
						<tr>
							<th class="px-4 py-3">Tanggal</th>
							<th class="px-4 py-3">No. Struk</th>
							<th class="px-4 py-3">Tipe</th>
							<th class="px-4 py-3">Nama</th>
							<th class="px-4 py-3 text-right">Total</th>
							<th class="px-4 py-3 text-right">Utang</th>
							<th class="px-4 py-3 text-center">Status</th>
							<th class="px-4 py-3 text-center">Aksi</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-100">
						{#each filteredTransactions as trx (trx.id)}
							<tr class="hover:bg-slate-50 transition-colors">
								<td class="px-4 py-3 text-slate-500">{new Date(trx.createdAt).toLocaleString('id-ID')}</td>
								<td class="px-4 py-3 font-mono text-slate-600 font-medium">{trx.receiptNo}</td>
								<td class="px-4 py-3">
									<span class="px-2 py-1 rounded text-[10px] font-bold uppercase {trx.paymentMethod === 'TEMPO' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}">
										{trx.paymentMethod}
									</span>
								</td>
								<td class="px-4 py-3 font-semibold">{trx.customerName || '-'}</td>
								<td class="px-4 py-3 text-right font-medium">Rp {trx.total.toLocaleString('id-ID')}</td>
								<td class="px-4 py-3 text-right font-bold text-rose-600">
									{trx.amountDue > 0 ? `Rp ${trx.amountDue.toLocaleString('id-ID')}` : '-'}
								</td>
								<td class="px-4 py-3 text-center">
									{#if trx.status === 'LUNAS'}
										<span class="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg text-xs font-bold border border-emerald-100">✓ LUNAS</span>
									{:else}
										<span class="bg-rose-50 text-rose-600 px-2 py-1 rounded-lg text-xs font-bold border border-rose-100">✗ BELUM</span>
									{/if}
								</td>
								<td class="px-4 py-3 text-center flex items-center justify-center gap-2">
									<button 
										onclick={() => openDetail(trx.id)}
										class="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
										title="Lihat Detail"
									>
										<span class="text-lg">👁️</span>
									</button>
									{#if trx.status === 'BELUM_LUNAS'}
										<Button variant="secondary" class="py-1 px-3 text-xs" onclick={() => openModal(trx)}>Bayar Cicilan</Button>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</Card>
</div>

<!-- Modal Pembayaran Tempo -->
{#if showModal && selectedTrx}
<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
	<div class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
		<div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
			<h3 class="font-bold text-slate-700">Pelunasan Utang (Tempo)</h3>
			<button onclick={closeModal} class="text-slate-400 hover:text-slate-600 font-bold text-xl leading-none">&times;</button>
		</div>
		<div class="p-6 space-y-4 text-slate-600">
			<div>
				<div class="text-xs font-bold text-slate-400 uppercase">Pelanggan</div>
				<div class="font-semibold text-lg text-slate-800">{selectedTrx.customerName}</div>
			</div>
			<div class="p-4 rounded-xl bg-rose-50 border border-rose-100">
				<div class="text-xs font-bold text-rose-400 uppercase">Sisa Tagihan Saat Ini</div>
				<div class="font-bold text-2xl text-rose-600">Rp {selectedTrx.amountDue.toLocaleString('id-ID')}</div>
			</div>
			<div>
				<Input id="payCicilan" label="Masukkan Nominal Pembayaran (Rp)" type="text" value={payInputStr} oninput={(e: any) => payInputStr = formatRibuan(e.target.value)} class="text-xl font-bold py-3 text-emerald-600 border-emerald-200 focus:ring-emerald-500" required />
			</div>
		</div>
		<div class="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
			<Button variant="ghost" onclick={closeModal}>Batal</Button>
			<Button variant="secondary" onclick={submitPayment} disabled={isSubmitting}>
				{isSubmitting ? '⏳ ...' : '✅ Lunasi Tagihan'}
			</Button>
		</div>
	</div>
</div>
{/if}

<!-- Modal Detail Transaksi -->
{#if showDetailModal}
<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
	<div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
		<div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
			<div class="flex flex-col">
				<h3 class="font-bold text-slate-700 text-lg">Detail Transaksi</h3>
				{#if detailData}
					<span class="text-xs font-mono text-slate-400">{detailData.receiptNo}</span>
				{/if}
			</div>
			<button onclick={() => showDetailModal = false} class="text-slate-400 hover:text-slate-600 font-bold text-xl leading-none">&times;</button>
		</div>
		
		<div class="p-6 max-h-[70vh] overflow-y-auto">
			{#if isFetchingDetail}
				<div class="text-center py-20 text-slate-400">
					<div class="animate-pulse flex flex-col items-center gap-3">
						<div class="h-8 w-8 bg-slate-200 rounded-full"></div>
						<span>Mengambil detail belanja...</span>
					</div>
				</div>
			{:else if detailData}
				<div class="space-y-6">
					<!-- Info Header -->
					<div class="grid grid-cols-2 gap-4 text-sm">
						<div class="p-4 bg-slate-50 rounded-xl border border-slate-100">
							<div class="text-xs font-bold text-slate-400 uppercase mb-1">Pelanggan</div>
							<div class="font-bold text-slate-700">{detailData.customerName || '-'}</div>
						</div>
						<div class="p-4 bg-slate-50 rounded-xl border border-slate-100">
							<div class="text-xs font-bold text-slate-400 uppercase mb-1">Metode Bayar</div>
							<div class="font-bold text-slate-700">{detailData.paymentMethod}</div>
						</div>
					</div>

					<!-- Table Items -->
					<div class="border border-slate-100 rounded-xl overflow-hidden">
						<table class="w-full text-left text-sm">
							<thead class="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
								<tr>
									<th class="px-4 py-3">Produk</th>
									<th class="px-4 py-3 text-center">Harga</th>
									<th class="px-4 py-3 text-center">Qty</th>
									<th class="px-4 py-3 text-right">Total</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-slate-50">
								{#each detailData.items as item}
									<tr>
										<td class="px-4 py-3 font-medium text-slate-700">{item.name}</td>
										<td class="px-4 py-3 text-center text-slate-500">Rp {item.price.toLocaleString('id-ID')}</td>
										<td class="px-4 py-3 text-center font-bold text-slate-700">{item.qty}</td>
										<td class="px-4 py-3 text-right font-bold text-slate-700">Rp {item.total.toLocaleString('id-ID')}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>

					<!-- Footer Summary -->
					<div class="flex flex-col items-end gap-2 pr-4">
						<div class="flex justify-between w-48 text-slate-500 text-xs">
							<span>Subtotal</span>
							<span>Rp {detailData.subtotal.toLocaleString('id-ID')}</span>
						</div>
						<div class="flex justify-between w-48 text-slate-700 font-bold border-t border-slate-100 pt-2 text-lg">
							<span>Total</span>
							<span class="text-primary-600">Rp {detailData.total.toLocaleString('id-ID')}</span>
						</div>
						<div class="flex justify-between w-48 text-emerald-600 text-xs font-semibold">
							<span>Bayar</span>
							<span>Rp {detailData.cashPaid.toLocaleString('id-ID')}</span>
						</div>
						{#if detailData.paymentMethod === 'TEMPO'}
							<div class="flex justify-between w-48 text-rose-600 text-xs font-bold">
								<span>Sisa Utang</span>
								<span>Rp {detailData.amountDue.toLocaleString('id-ID')}</span>
							</div>
						{:else}
							<div class="flex justify-between w-48 text-blue-600 text-xs font-semibold">
								<span>Kembali</span>
								<span>Rp {detailData.changeAmount.toLocaleString('id-ID')}</span>
							</div>
						{/if}
					</div>
				</div>
			{/if}
		</div>
		
		<div class="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
			<Button variant="ghost" onclick={() => showDetailModal = false}>Tutup</Button>
		</div>
	</div>
</div>
{/if}
