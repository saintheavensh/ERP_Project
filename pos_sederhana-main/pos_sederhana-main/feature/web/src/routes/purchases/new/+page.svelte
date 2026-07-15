<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, slide } from 'svelte/transition';
	import Card from '$lib/components/ui/Card.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import ProductSearch from '$lib/features/cart/ProductSearch.svelte';

	// State
	let suppliers = $state<any[]>([]);
	let selectedSupplierId = $state('');
	let invoiceNo = $state(`PUR-${Date.now()}`);
	let purchaseItems = $state<any[]>([]);
	let note = $state('');
	let isSaving = $state(false);

	async function fetchSuppliers() {
		try {
			const res = await fetch('http://localhost:3000/api/suppliers');
			const data = await res.json();
			if (data.success) suppliers = data.data;
		} catch (err) {
			console.error(err);
		}
	}

	onMount(fetchSuppliers);

	function addProductToPurchase(product: any) {
		const existing = purchaseItems.find(item => item.productId === product.id);
		if (existing) {
			existing.qty += 1;
		} else {
			purchaseItems = [...purchaseItems, {
				productId: product.id,
				name: product.name,
				qty: 1,
				buyPrice: 0,
				sellPrice: product.defaultPrice || 0,
				buyPriceStr: '',
				sellPriceStr: (product.defaultPrice || 0).toLocaleString('id-ID')
			}];
		}
	}

	function formatRibuan(val: string) {
		const clean = val.replace(/\D/g, '');
		return clean ? parseInt(clean, 10).toLocaleString('id-ID') : '';
	}

	function handlePriceInput(index: number, field: 'buy' | 'sell', val: string) {
		const num = parseInt(val.replace(/\D/g, ''), 10) || 0;
		if (field === 'buy') {
			purchaseItems[index].buyPrice = num;
			purchaseItems[index].buyPriceStr = formatRibuan(val);
		} else {
			purchaseItems[index].sellPrice = num;
			purchaseItems[index].sellPriceStr = formatRibuan(val);
		}
	}

	function removeItem(index: number) {
		purchaseItems = purchaseItems.filter((_, i) => i !== index);
	}

	async function submitPurchase() {
		if (purchaseItems.length === 0) return alert("Pilih barang terlebih dahulu!");
		if (!invoiceNo) return alert("Nomor Faktur wajib diisi!");

		isSaving = true;
		const payload = {
			invoiceNo,
			supplierId: selectedSupplierId || null,
			note,
			items: purchaseItems.map(item => ({
				productId: item.productId,
				qty: item.qty,
				buyPrice: item.buyPrice,
				sellPrice: item.sellPrice
			}))
		};

		try {
			const res = await fetch('http://localhost:3000/api/purchases', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});
			const result = await res.json();
			if (result.success) {
				alert("Nota Pembelian berhasil disimpan! Stok telah terupdate.");
				window.location.href = '/products';
			} else {
				alert("Gagal: " + result.message);
			}
		} catch (err) {
			alert("Koneksi error");
		} finally {
			isSaving = false;
		}
	}

	let totalPurchase = $derived(purchaseItems.reduce((acc, item) => acc + (item.qty * item.buyPrice), 0));
</script>

<div class="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-4xl font-black text-slate-900 tracking-tight">📥 Nota Pembelian Baru</h1>
			<p class="text-slate-500 font-bold">Input stok masuk dari supplier secara profesional.</p>
		</div>
		<div class="flex gap-3">
			<Button variant="ghost" onclick={() => window.location.href='/products'}>Batal</Button>
			<Button onclick={submitPurchase} disabled={isSaving} class="bg-emerald-600 shadow-lg shadow-emerald-200">
				{isSaving ? 'Menyimpan...' : '✅ Simpan Nota'}
			</Button>
		</div>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
		<!-- Left: Form Meta & Items -->
		<div class="lg:col-span-2 space-y-6">
			<!-- Meta Card -->
			<Card class="p-6 border-slate-200 space-y-4">
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<Input id="invNo" label="Nomor Faktur Supplier" bind:value={invoiceNo} required />
					<div class="space-y-1">
						<label for="supSelect" class="text-xs font-black text-slate-400 uppercase">Pilih Supplier</label>
						<select id="supSelect" bind:value={selectedSupplierId} class="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold">
							<option value="">-- Tanpa Supplier --</option>
							{#each suppliers as s}
								<option value={s.id}>{s.name}</option>
							{/each}
						</select>
					</div>
				</div>
				<Input id="pNote" label="Catatan Tambahan" bind:value={note} placeholder="Cth: Pembayaran Tempo 30 Hari" />
			</Card>

			<!-- Search Bar -->
			<div class="relative group">
				<div class="absolute -inset-1 bg-linear-to-r from-primary-600 to-indigo-600 rounded-2xl blur opacity-15 group-hover:opacity-25 transition duration-1000"></div>
				<div class="relative bg-white rounded-xl shadow-xl p-2 border border-slate-100">
					<ProductSearch onSelect={addProductToPurchase} />
				</div>
			</div>

			<!-- Items List -->
			<div class="space-y-3">
				{#each purchaseItems as item, i}
					<div in:slide out:fade class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
						<div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
							<div class="flex-1">
								<h4 class="font-black text-slate-800 text-lg uppercase tracking-tight">{item.name}</h4>
								<div class="flex gap-4 mt-2">
									<div class="w-24">
										<label for={"qty"+i} class="text-[10px] font-black text-slate-400 uppercase">Qty</label>
										<input id={"qty"+i} type="number" bind:value={item.qty} class="w-full border-b-2 border-slate-100 focus:border-primary-500 font-bold p-1 outline-none transition-colors" />
									</div>
									<div class="flex-1">
										<label for={"buy"+i} class="text-[10px] font-black text-slate-400 uppercase">Harga Beli (Modal)</label>
										<input id={"buy"+i} type="text" value={item.buyPriceStr} oninput={(e: any) => handlePriceInput(i, 'buy', e.target.value)} placeholder="0" class="w-full border-b-2 border-slate-100 focus:border-emerald-500 font-bold p-1 outline-none transition-colors" />
									</div>
									<div class="flex-1">
										<label for={"sell"+i} class="text-[10px] font-black text-slate-400 uppercase">Harga Jual Baru</label>
										<input id={"sell"+i} type="text" value={item.sellPriceStr} oninput={(e: any) => handlePriceInput(i, 'sell', e.target.value)} placeholder="0" class="w-full border-b-2 border-slate-100 focus:border-primary-500 font-bold p-1 outline-none transition-colors" />
									</div>
								</div>
							</div>
							<div class="flex items-center gap-4 text-right">
								<div class="hidden md:block">
									<div class="text-[10px] font-black text-slate-400 uppercase">Subtotal</div>
									<div class="text-xl font-black text-slate-900 tracking-tighter">Rp {(item.qty * item.buyPrice).toLocaleString('id-ID')}</div>
								</div>
								<Button variant="ghost" class="text-rose-500 p-2" onclick={() => removeItem(i)}>🗑️</Button>
							</div>
						</div>
					</div>
				{/each}

				{#if purchaseItems.length === 0}
					<div class="text-center p-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
						<div class="text-4xl mb-3">🛒</div>
						<div class="text-slate-400 font-bold">Belum ada barang dipilih untuk pembelian.</div>
						<div class="text-xs text-slate-400 italic">Cari barang di atas dan atur jumlah serta harga modal.</div>
					</div>
				{/if}
			</div>
		</div>

		<!-- Right: Summary Dashboard -->
		<div class="space-y-6">
			<Card class="p-8 bg-slate-900 text-white shadow-2xl border-none relative overflow-hidden">
				<div class="absolute -right-4 -bottom-4 text-9xl opacity-10 font-black">TOTAL</div>
				<div class="relative z-10">
					<div class="text-white/60 font-black text-xs uppercase tracking-widest mb-2">Total Nilai Pembelian</div>
					<div class="text-5xl font-black tracking-tighter mb-8">Rp {totalPurchase.toLocaleString('id-ID')}</div>
					
					<div class="space-y-4 pt-6 border-t border-white/10">
						<div class="flex justify-between items-center">
							<span class="text-sm font-bold text-white/50">Jumlah Barang</span>
							<span class="text-lg font-black">{purchaseItems.length}</span>
						</div>
						<div class="flex justify-between items-center text-emerald-400">
							<span class="text-sm font-bold opacity-70">Status Stok</span>
							<span class="text-lg font-black">Bakal Bertambah</span>
						</div>
					</div>
				</div>
			</Card>

			<div class="p-6 bg-amber-50 rounded-3xl border-2 border-amber-200 shadow-sm shadow-amber-100">
				<div class="flex gap-3">
					<span class="text-2xl">💡</span>
					<div>
						<h4 class="font-black text-amber-900 uppercase text-xs tracking-widest">Informasi</h4>
						<p class="text-amber-700/80 text-sm font-bold mt-1 leading-relaxed">
							Mengacu pada prinsip <span class="text-amber-900">SaaS Project</span>, setiap baris barang di sini akan menjadi batch baru. 
							Keuntungan akan dihitung dari selisih Harga Jual dan Harga Beli yang Anda masukkan sekarang.
						</p>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
