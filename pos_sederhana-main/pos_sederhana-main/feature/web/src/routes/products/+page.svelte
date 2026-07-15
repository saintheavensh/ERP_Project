<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, slide } from 'svelte/transition';
	import Card from '$lib/components/ui/Card.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';

	// Tab Management
	type Tab = 'inventory' | 'categories' | 'purchases';
	let activeTab = $state<Tab>('inventory');

	// State
	let products = $state<any[]>([]);
	let categories = $state<any[]>([]);
	let purchaseNotes = $state<any[]>([]);
	let suppliers = $state<any[]>([]);
	let isLoading = $state(true);

	// Modals Control
	let showAddProduct = $state(false);
	let showEditProduct = $state(false);
	let showDeleteProduct = $state(false);

	let showAddCategory = $state(false);
	let showEditCategory = $state(false);
	let showDeleteCategory = $state(false);

	// Selection State
	let selectedItem = $state<any>(null);

	// Form Data
	let productForm = $state({ name: '', sku: '', categoryId: '', unit: 'pcs' });
	let categoryForm = $state({ name: '' });

	async function fetchData() {
		isLoading = true;
		try {
			const resProducts = await fetch('http://localhost:3000/api/products');
			const dataProducts = await resProducts.json();
			if (dataProducts.success) products = dataProducts.data;

			const resCategories = await fetch('http://localhost:3000/api/products/categories');
			const dataCategories = await resCategories.json();
			if (dataCategories.success) categories = dataCategories.data;

			const resPurchases = await fetch('http://localhost:3000/api/purchases');
			const dataPurchases = await resPurchases.json();
			if (dataPurchases.success) purchaseNotes = dataPurchases.data;

			const resSuppliers = await fetch('http://localhost:3000/api/suppliers');
			const dataSuppliers = await resSuppliers.json();
			if (dataSuppliers.success) suppliers = dataSuppliers.data;
		} catch (err) {
			console.error("Fetch error:", err);
		} finally {
			isLoading = false;
		}
	}

	onMount(fetchData);

	// --- PRODUCT HANDLERS ---
	async function saveProduct() {
		const url = selectedItem ? `http://localhost:3000/api/products/${selectedItem.id}` : 'http://localhost:3000/api/products';
		const method = selectedItem ? 'PUT' : 'POST';

		try {
			const res = await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(productForm)
			});
			const data = await res.json();
			if (data.success) {
				showAddProduct = false;
				showEditProduct = false;
				selectedItem = null;
				await fetchData();
			}
		} catch (err) {
			alert("Gagal menyimpan produk");
		}
	}

	async function deleteProduct() {
		try {
			const res = await fetch(`http://localhost:3000/api/products/${selectedItem.id}`, { method: 'DELETE' });
			if ((await res.json()).success) {
				showDeleteProduct = false;
				selectedItem = null;
				await fetchData();
			}
		} catch (err) {
			alert("Gagal menghapus produk");
		}
	}

	// --- CATEGORY HANDLERS ---
	async function saveCategory() {
		const url = selectedItem ? `http://localhost:3000/api/products/categories/${selectedItem.id}` : 'http://localhost:3000/api/products/categories';
		const method = selectedItem ? 'PUT' : 'POST';

		try {
			const res = await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(categoryForm)
			});
			const data = await res.json();
			if (data.success) {
				showAddCategory = false;
				showEditCategory = false;
				selectedItem = null;
				await fetchData();
			}
		} catch (err) {
			alert("Gagal menyimpan kategori");
		}
	}

	async function deleteCategory() {
		try {
			const res = await fetch(`http://localhost:3000/api/products/categories/${selectedItem.id}`, { method: 'DELETE' });
			if ((await res.json()).success) {
				showDeleteCategory = false;
				selectedItem = null;
				await fetchData();
			}
		} catch (err) {
			alert("Gagal menghapus kategori");
		}
	}

	function prepEditProduct(p: any) {
		selectedItem = p;
		productForm = { name: p.name, sku: p.sku || '', categoryId: p.categoryId || '', unit: p.unit || 'pcs' };
		showEditProduct = true;
	}

	function prepDeleteProduct(p: any) {
		selectedItem = p;
		showDeleteProduct = true;
	}

	function prepEditCategory(c: any) {
		selectedItem = c;
		categoryForm = { name: c.name };
		showEditCategory = true;
	}

	function prepDeleteCategory(c: any) {
		selectedItem = c;
		showDeleteCategory = true;
	}

    function getSupplierName(id: string) {
        return suppliers.find(s => s.id === id)?.name || 'Tanpa Supplier';
    }
</script>

<div class="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
	<!-- Page Header -->
	<div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
		<div>
			<h1 class="text-4xl font-black text-slate-900 tracking-tight">🏢 Management Hub</h1>
			<p class="text-slate-500 font-bold mt-1">Kelola data master barang dan histori pengadaan stok.</p>
		</div>
		<div class="flex flex-wrap gap-3">
			<Button variant="ghost" class="bg-indigo-50 text-indigo-700 border-indigo-100" onclick={() => { selectedItem=null; categoryForm={name:''}; showAddCategory=true }}>
				📁 + Kategori
			</Button>
            <Button variant="ghost" class="bg-emerald-50 text-emerald-700 border-emerald-100" onclick={() => window.location.href='/purchases/new'}>
				📥 Kulakan / Input Pembelian
			</Button>
			<Button class="bg-primary-600 shadow-xl shadow-primary-200" onclick={() => { selectedItem=null; productForm={name:'',sku:'',categoryId:'',unit:'pcs'}; showAddProduct=true }}>
				➕ Produk Baru
			</Button>
		</div>
	</div>

	<!-- Custom Tabs -->
	<div class="flex p-1.5 bg-slate-200/50 backdrop-blur rounded-2xl w-fit border border-white/50">
		<button 
			class="px-8 py-2.5 rounded-xl text-sm font-black transition-all {activeTab === 'inventory' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}"
			onclick={() => activeTab = 'inventory'}
		>
			📦 Inventaris
		</button>
		<button 
			class="px-8 py-2.5 rounded-xl text-sm font-black transition-all {activeTab === 'categories' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}"
			onclick={() => activeTab = 'categories'}
		>
			📁 Kategori
		</button>
		<button 
			class="px-8 py-2.5 rounded-xl text-sm font-black transition-all {activeTab === 'purchases' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}"
			onclick={() => activeTab = 'purchases'}
		>
			💹 Riwayat Nota Beli
		</button>
	</div>

	<!-- Tab Content -->
	<div class="transition-all duration-300">
		{#if activeTab === 'inventory'}
			<Card class="overflow-hidden border-slate-200 shadow-xl">
				<div class="overflow-x-auto">
					<table class="w-full text-left">
						<thead class="bg-slate-50/80 border-b border-slate-100">
							<tr>
								<th class="p-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Produk</th>
								<th class="p-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Kategori</th>
								<th class="p-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Stok</th>
								<th class="p-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Aksi</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-slate-100">
							{#each products as p}
								<tr class="hover:bg-slate-50/50 group transition-colors">
									<td class="p-5">
										<div class="font-extrabold text-slate-800 text-lg">{p.name}</div>
										<div class="text-[11px] font-bold text-slate-400">SKU: {p.sku || '-'}</div>
									</td>
									<td class="p-5">
										<span class="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-500 uppercase">{p.category || 'N/A'}</span>
									</td>
									<td class="p-5 text-center">
										<span class="inline-block px-4 py-1.5 rounded-xl text-xs font-black 
											{p.currentStock < 5 ? 'bg-rose-100 text-rose-600 animate-pulse' : 'bg-emerald-100 text-emerald-600'}">
											{p.currentStock} {p.unit}
										</span>
									</td>
									<td class="p-5 text-right space-x-1">
										<Button variant="ghost" class="text-xs text-slate-400 hover:text-primary-600 px-2" onclick={() => prepEditProduct(p)}>
											✏️ Edit
										</Button>
										<Button variant="ghost" class="text-xs text-slate-400 hover:text-rose-500 px-2" onclick={() => prepDeleteProduct(p)}>
											🗑️ Hapus
										</Button>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</Card>
		{:else if activeTab === 'categories'}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{#each categories as c}
					<Card class="p-6 group border-slate-200 hover:border-primary-200 transition-all shadow-sm">
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-3">
								<span class="text-2xl p-2 bg-slate-50 rounded-xl">📁</span>
								<div class="font-black text-slate-800 text-lg uppercase tracking-tight">{c.name}</div>
							</div>
							<div class="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
								<Button variant="ghost" class="p-2 text-slate-500" onclick={() => prepEditCategory(c)}>✏️</Button>
								<Button variant="ghost" class="p-2 text-rose-500" onclick={() => prepDeleteCategory(c)}>🗑️</Button>
							</div>
						</div>
					</Card>
				{/each}
			</div>
		{:else}
			<Card class="overflow-hidden border-slate-200 shadow-xl">
                <div class="p-5 bg-slate-50 border-b border-slate-100 font-black text-xs text-slate-400 uppercase tracking-widest">Daftar Nota Pembelian (Stock In)</div>
				<div class="overflow-x-auto">
					<table class="w-full text-left">
						<thead>
							<tr class="bg-slate-50/50">
								<th class="p-5 text-[11px] font-black text-slate-400 uppercase">Tanggal</th>
								<th class="p-5 text-[11px] font-black text-slate-400 uppercase">No. Faktur</th>
								<th class="p-5 text-[11px] font-black text-slate-400 uppercase">Supplier</th>
								<th class="p-5 text-[11px] font-black text-slate-400 uppercase text-right">Total Transaksi</th>
								<th class="p-5 text-[11px] font-black text-slate-400 uppercase text-center">Status</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-slate-100 text-sm">
							{#each purchaseNotes as n}
								<tr class="hover:bg-slate-50/50">
									<td class="p-5 text-slate-500 font-bold">{new Date(n.createdAt).toLocaleDateString('id-ID')}</td>
									<td class="p-5 font-black text-slate-800">{n.invoiceNo}</td>
									<td class="p-5 font-bold text-slate-600">{getSupplierName(n.supplierId)}</td>
									<td class="p-5 text-right font-black text-slate-900 tracking-tighter">Rp {n.totalAmount.toLocaleString('id-ID')}</td>
									<td class="p-5 text-center">
										<span class="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-lg text-[10px] font-black uppercase">Berhasil</span>
									</td>
								</tr>
							{/each}
                            {#if purchaseNotes.length === 0}
                                <tr>
                                    <td colspan="5" class="p-12 text-center text-slate-400 font-bold italic">Belum ada histori pembelian barang.</td>
                                </tr>
                            {/if}
						</tbody>
					</table>
				</div>
			</Card>
		{/if}
	</div>
</div>

<!-- Modals -->
<Modal open={showAddProduct || showEditProduct} title={selectedItem ? "✏️ Edit Produk" : "📦 Tambah Produk Baru"} onClose={() => { showAddProduct=false; showEditProduct=false; selectedItem=null; }}>
	<div class="space-y-4">
        <Input id="p_name" label="Nama Produk" bind:value={productForm.name} required />
        <Input id="p_sku" label="SKU / Barcode" bind:value={productForm.sku} />
        <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
                <label for="p_cat" class="text-xs font-black text-slate-400 uppercase mb-1 block">Kategori</label>
                <select id="p_cat" bind:value={productForm.categoryId} class="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold">
                    <option value="">Tanpa Kategori</option>
                    {#each categories as c} <option value={c.id}>{c.name}</option> {/each}
                </select>
            </div>
            <Input id="p_unit" label="Satuan (Pcs/Kg/Box)" bind:value={productForm.unit} />
        </div>
    </div>
    {#snippet footer()}
        <Button variant="ghost" onclick={() => { showAddProduct=false; showEditProduct=false; }}>Batal</Button>
        <Button onclick={saveProduct}>Simpan Data</Button>
    {/snippet}
</Modal>

<Modal open={showAddCategory || showEditCategory} title={selectedItem ? "✏️ Edit Kategori" : "📁 Tambah Kategori"} onClose={() => { showAddCategory=false; showEditCategory=false; selectedItem=null; }}>
    <div class="space-y-4">
        <Input id="c_name" label="Nama Kategori" bind:value={categoryForm.name} required />
    </div>
    {#snippet footer()}
        <Button variant="ghost" onclick={() => { showAddCategory=false; showEditCategory=false; }}>Batal</Button>
        <Button onclick={saveCategory}>Simpan Kategori</Button>
    {/snippet}
</Modal>

<Modal open={showDeleteProduct} title="⚠️ Hapus Produk?" onClose={() => showDeleteProduct=false}>
    <div class="p-4 bg-rose-50 rounded-2xl border border-rose-100 flex gap-4">
        <span class="text-2xl">🚨</span>
        <p class="font-bold text-rose-800 leading-relaxed text-sm">
            Menghapus produk <span class="underline font-black">{selectedItem?.name}</span> akan menghapus seluruh histori stok terkait. Pastikan Anda sudah tidak membutuhkan data ini.
        </p>
    </div>
    {#snippet footer()}
        <Button variant="ghost" onclick={() => showDeleteProduct=false}>Batal</Button>
        <Button class="bg-rose-600 text-white" onclick={deleteProduct}>Hapus Permanen</Button>
    {/snippet}
</Modal>

<Modal open={showDeleteCategory} title="⚠️ Hapus Kategori?" onClose={() => showDeleteCategory=false}>
    <p class="font-bold text-slate-600">Hapus kategori <span class="text-rose-600">{selectedItem?.name}</span>? Produk di dalamnya akan dipindah ke 'Tanpa Kategori'.</p>
    {#snippet footer()}
        <Button variant="ghost" onclick={() => showDeleteCategory=false}>Batal</Button>
        <Button class="bg-rose-600" onclick={deleteCategory}>Hapus</Button>
    {/snippet}
</Modal>
