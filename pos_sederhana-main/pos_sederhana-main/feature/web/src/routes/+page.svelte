<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';
	import { fade } from 'svelte/transition';
	import Input from '$lib/components/ui/Input.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import CartList from '$lib/features/cart/CartList.svelte';
	import ProductSearch from '$lib/features/cart/ProductSearch.svelte';
	import { cart } from '$lib/features/cart/state.svelte';
	import { submitCheckout } from '$lib/features/cart/checkout';

	let itemName = $state('');
	let itemPriceStr = $state('');
	let itemQty = $state<number>(1);
	let isSubmitting = $state(false);

	let inputCashPaidStr = $state('');
	let isDPEnabled = $state(false); // Checkbox DP untuk Tempo
	let showTempoModal = $state(false); // Modal Konfirmasi Tempo

	// Sync state number dengan input string
	$effect(() => {
		if (cart.paymentMethod === 'TEMPO' && !isDPEnabled) {
			cart.cashPaid = 0;
			inputCashPaidStr = '';
			return;
		}
		const parsedCash = parseInt(inputCashPaidStr.replace(/\D/g, ''), 10) || 0;
		cart.cashPaid = parsedCash;
	});

	const formatRibuan = (val: string) => {
		const num = String(val).replace(/\D/g, '');
		if (!num) return '';
		return parseInt(num, 10).toLocaleString('id-ID');
	};

	const addItem = () => {
		const price = parseInt(itemPriceStr.replace(/\D/g, ''), 10);
		if (itemName && price > 0 && itemQty > 0) {
			cart.addItem(itemName, price, itemQty);
			// Reset form
			itemName = '';
			itemPriceStr = '';
			itemQty = 1;
		}
	};

	const onProductSelect = (product: any) => {
		// Jika barang dipilih, langsung tambahkan ke keranjang dengan qty 1 (bisa diedit di keranjang)
		cart.addItem(product.name, product.defaultPrice || 0, 1, product.id);
		// Notification?
		console.log(`[CASHIER] Product Added: ${product.name}`);
	};

	const handleCheckout = async () => {
		// Jika Tempo, pastikan konfirmasi modal muncul dulu
		if (cart.paymentMethod === 'TEMPO' && !showTempoModal) {
			if (!cart.customerName) {
				alert("Nama Pelanggan wajib diisi untuk Transaksi Tempo!");
				return;
			}
			showTempoModal = true;
			return;
		}

		isSubmitting = true;
		showTempoModal = false;
		try {
			await submitCheckout();
			inputCashPaidStr = ''; // reset string uinya
			isDPEnabled = false; // Reset DP checkbox
			alert("Transaksi Berhasil! Struk Sedang Dicetak.");
		} catch (err: any) {
			alert(err.message);
		} finally {
			isSubmitting = false;
		}
	};
</script>

<svelte:head>
	<title>Kasir - New Majmu POS</title>
</svelte:head>

<div class="w-full max-w-6xl mx-auto p-4 md:p-6 lg:p-8">
	<!-- Header -->
	<header class="flex justify-between items-center mb-8 pb-4 border-b border-slate-200">
		<h1 class="text-2xl font-bold text-primary-600 flex items-center gap-3">
			<span class="p-2 bg-primary-100 rounded-xl">🧾</span> NEW MAJMU KASIR
		</h1>
		<div class="flex gap-3">
			<a href="/" class="px-4 py-2 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300">⬅ V1</a>
			<a href="/history" class="px-4 py-2 bg-primary-100 text-primary-700 font-semibold rounded-lg hover:bg-primary-200">🕒 Riwayat</a>
		</div>
	</header>

	<div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
		<!-- Left: Input & Cart -->
		<div class="lg:col-span-8 space-y-6">
			<Card class="bg-white/80 backdrop-blur-md shadow-sm border-slate-100 mb-6">
				<div class="p-6">
					<div class="flex flex-col gap-4">
						<div class="flex-1">
							<span class="text-xs font-bold text-slate-400 uppercase mb-1 block">Pencarian Barang / Barcode</span>
							<ProductSearch onSelect={onProductSelect} />
						</div>

						<div class="flex flex-col md:flex-row gap-4 border-t border-slate-50 pt-4">
							<div class="flex-1">
								<Input label="Nama Barang (Manual)" id="itemName" bind:value={itemName} placeholder="Input manual jika tidak ada di Master Data" />
							</div>
							<div class="w-full md:w-48">
								<Input label="Harga Jual" id="itemPrice" value={itemPriceStr} oninput={(e: any) => itemPriceStr = formatRibuan(e.target.value)} placeholder="0" />
							</div>
							<div class="w-full md:w-24">
								<Input label="Qty" id="itemQty" type="number" bind:value={itemQty} min="1" />
							</div>
							<div class="self-end">
								<Button onclick={addItem} class="w-full px-8 py-3">Tambah</Button>
							</div>
						</div>
					</div>
				</div>
			</Card>

			<Card class="overflow-hidden p-0 md:p-0">
				<CartList />
			</Card>
		</div>

		<!-- Right: Payment -->
		<div class="lg:col-span-4">
			<Card title="Pembayaran" icon="💵" class="sticky top-6">
				<div class="mt-2 mb-4 p-1 bg-slate-100 rounded-xl flex">
					<button
						onclick={() => cart.paymentMethod = 'TUNAI'}
						class="flex-1 py-2 font-bold text-sm rounded-lg {cart.paymentMethod === 'TUNAI' ? 'bg-white shadow text-primary-600' : 'text-slate-500'}"
					>TUNAI</button>
					<button
						onclick={() => cart.paymentMethod = 'TEMPO'}
						class="flex-1 py-2 font-bold text-sm rounded-lg {cart.paymentMethod === 'TEMPO' ? 'bg-white shadow text-rose-600' : 'text-slate-500'}"
					>TEMPO (Utang)</button>
				</div>

				{#if cart.paymentMethod === 'TEMPO'}
					<div class="mb-4 p-4 bg-rose-50 border border-rose-100 rounded-xl animate-in fade-in slide-in-from-top-1">
						<label class="flex items-center gap-3 cursor-pointer group">
							<input 
								type="checkbox" 
								bind:checked={isDPEnabled}
								class="w-5 h-5 rounded border-slate-300 text-rose-600 focus:ring-rose-500 transition-all cursor-pointer"
							/>
							<span class="text-sm font-bold text-rose-700 group-hover:text-rose-900 transition-colors">
								Ada Uang Muka (DP) / Panjer?
							</span>
						</label>
					</div>
				{/if}

				<div class="mb-4">
					<div class="text-sm text-slate-500 font-semibold mb-1">Total Akhir:</div>
					<div class="text-3xl font-bold text-primary-600">Rp {cart.total.toLocaleString('id-ID')}</div>
				</div>

				{#if cart.paymentMethod === 'TEMPO'}
					<div class="mb-4 animate-in fade-in slide-in-from-top-2">
						<Input id="customerName" label="Nama Pelanggan" bind:value={cart.customerName} placeholder="Wajib Diisi" class="border-rose-200 focus:ring-rose-500" required />
					</div>
				{/if}

				<div class="mb-6 relative">
					{#if cart.paymentMethod === 'TUNAI' || (cart.paymentMethod === 'TEMPO' && isDPEnabled)}
						<div transition:fade={{ duration: 150 }}>
							<Input 
								id="cashPaid" 
								label={cart.paymentMethod === 'TEMPO' ? "Uang Muka / DP (Rp)" : "Uang Diterima (Rp)"}
								type="text" 
								value={inputCashPaidStr} 
								oninput={(e: any) => {
									inputCashPaidStr = formatRibuan(e.target.value);
									// Update state langsung agar reaktif seketika
									const val = parseInt(e.target.value.replace(/\D/g, ''), 10) || 0;
									cart.cashPaid = val;
								}} 
								placeholder="0" 
								class="text-2xl font-bold py-4 text-primary-700" 
								required 
							/>
						</div>
					{:else}
						<div class="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center text-slate-400 font-medium">
							Tanpa Uang Muka (Hutang Penuh)
						</div>
					{/if}
				</div>

				{#if cart.paymentMethod === 'TUNAI'}
					<div class="p-4 bg-emerald-50 border border-emerald-200 rounded-xl mb-6">
						<div class="text-sm font-semibold text-emerald-600 mb-1">Kembalian:</div>
						<div class="text-2xl font-bold text-emerald-600">Rp {cart.changeAmount.toLocaleString('id-ID')}</div>
					</div>
				{:else}
					<div class="p-4 bg-rose-50 border border-rose-200 rounded-xl mb-6">
						<div class="text-sm font-semibold text-rose-600 mb-1">Status: SISA UTANG</div>
						<div class="text-2xl font-bold text-rose-600">Rp {cart.amountDue.toLocaleString('id-ID')}</div>
					</div>
				{/if}

				<Button variant={cart.paymentMethod === 'TEMPO' ? 'danger' : 'secondary'} class="w-full py-4 text-lg" onclick={handleCheckout} disabled={isSubmitting}>
					{isSubmitting ? '⏳ Memproses...' : '🖨️ CETAK STRUK'}
				</Button>
			</Card>
		</div>
	</div>
</div>

<!-- Modal Peringatan Tempo -->
<Modal 
	open={showTempoModal} 
	title="⚠️ Konfirmasi Hutang (Tempo)" 
	onClose={() => showTempoModal = false}
>
	<div class="text-center">
		<div class="text-5xl mb-4">✍️</div>
		<p class="text-lg font-semibold text-slate-800 mb-2">Simpan Transaksi Tempo?</p>
		<p class="text-sm text-slate-500 mb-6">
			Transaksi ini akan dicatat sebagai <span class="font-bold text-rose-600">HUTANG</span> atas nama pelanggan:
			<br/>
			<span class="text-xl font-bold text-slate-900 block mt-2">{cart.customerName}</span>
		</p>
		
		<div class="p-4 bg-rose-50 rounded-xl border border-rose-100 text-left mb-6">
			<div class="flex justify-between text-sm mb-1">
				<span>Total Belanja:</span>
				<span class="font-bold text-slate-700">Rp {cart.total.toLocaleString('id-ID')}</span>
			</div>
			<div class="flex justify-between text-sm mb-1">
				<span>Uang Muka (DP):</span>
				<span class="font-bold text-emerald-600">Rp {cart.cashPaid.toLocaleString('id-ID')}</span>
			</div>
			<div class="border-t border-rose-200 my-2 pt-2 flex justify-between text-lg">
				<span class="font-bold text-rose-800">SISA HUTANG:</span>
				<span class="font-bold text-rose-800">Rp {cart.amountDue.toLocaleString('id-ID')}</span>
			</div>
		</div>
	</div>

	{#snippet footer()}
		<Button variant="ghost" onclick={() => showTempoModal = false}>Batal</Button>
		<Button variant="danger" onclick={handleCheckout} disabled={isSubmitting}>
			{isSubmitting ? '⏳ Menyimpan...' : '✅ Ya, Simpan Hutang'}
		</Button>
	{/snippet}
</Modal>
