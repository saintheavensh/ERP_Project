<script lang="ts">
	import { onMount } from 'svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';

	let suppliers = $state<any[]>([]);
	let isLoading = $state(true);
	let showModal = $state(false);
	let selectedSupplier = $state<any>(null);
	let form = $state({ name: '', contactName: '', phone: '', address: '' });

	async function fetchSuppliers() {
		isLoading = true;
		try {
			const res = await fetch('http://localhost:3000/api/suppliers');
			const data = await res.json();
			if (data.success) suppliers = data.data;
		} catch (err) {
			console.error(err);
		} finally {
			isLoading = false;
		}
	}

	onMount(fetchSuppliers);

	async function handleSave() {
		const url = selectedSupplier ? `http://localhost:3000/api/suppliers/${selectedSupplier.id}` : 'http://localhost:3000/api/suppliers';
		const method = selectedSupplier ? 'PUT' : 'POST';

		try {
			const res = await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(form)
			});
			if ((await res.json()).success) {
				showModal = false;
				await fetchSuppliers();
			}
		} catch (err) {
			alert("Gagal menyimpan supplier");
		}
	}

	function openAdd() {
		selectedSupplier = null;
		form = { name: '', contactName: '', phone: '', address: '' };
		showModal = true;
	}

	function openEdit(s: any) {
		selectedSupplier = s;
		form = { name: s.name, contactName: s.contactName || '', phone: s.phone || '', address: s.address || '' };
		showModal = true;
	}
    
    async function handleDelete(id: string) {
        if(!confirm("Hapus supplier ini?")) return;
        try {
            const res = await fetch(`http://localhost:3000/api/suppliers/${id}`, { method: 'DELETE' });
            if ((await res.json()).success) await fetchSuppliers();
        } catch (err) {
            alert("Gagal menghapus");
        }
    }
</script>

<div class="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-black text-slate-900 tracking-tight">📁 Manajemen Supplier</h1>
			<p class="text-slate-500 font-bold">Daftar pemasok barang untuk toko Anda.</p>
		</div>
		<Button onclick={openAdd} class="bg-primary-600 shadow-lg shadow-primary-200">➕ Tambah Supplier</Button>
	</div>

	{#if isLoading}
		<div class="flex justify-center p-12">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each suppliers as s}
				<Card class="p-6 group border-slate-200 hover:border-primary-200 transition-all">
					<div class="flex justify-between items-start">
						<div class="space-y-3">
							<div class="flex items-center gap-2">
								<span class="p-2 bg-primary-50 rounded-lg text-primary-600">🏢</span>
								<h3 class="font-black text-lg text-slate-800 uppercase tracking-tight">{s.name}</h3>
							</div>
							<div class="space-y-1">
								<p class="text-sm font-bold text-slate-600"><span class="text-slate-400 font-medium">PIC:</span> {s.contactName || '-'}</p>
								<p class="text-sm font-bold text-slate-600"><span class="text-slate-400 font-medium">Telp:</span> {s.phone || '-'}</p>
								<p class="text-sm text-slate-500 italic mt-2">{s.address || 'Tidak ada alamat'}</p>
							</div>
						</div>
						<div class="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
							<Button variant="ghost" class="p-2 text-slate-400" onclick={() => openEdit(s)}>✏️</Button>
							<Button variant="ghost" class="p-2 text-rose-400" onclick={() => handleDelete(s.id)}>🗑️</Button>
						</div>
					</div>
				</Card>
			{/each}
		</div>
	{/if}
</div>

<Modal open={showModal} title={selectedSupplier ? "✏️ Edit Supplier" : "➕ Tambah Supplier"} onClose={() => showModal = false}>
	<div class="space-y-4">
		<Input id="supName" label="Nama Perusahaan / Supplier" bind:value={form.name} placeholder="Cth: PT. Maju Jaya" required />
		<Input id="supPic" label="Nama Kontak (PIC)" bind:value={form.contactName} placeholder="Cth: Pak Budi" />
		<Input id="supPhone" label="Nomor Telepon" bind:value={form.phone} placeholder="Cth: 08123..." />
		<div class="space-y-1">
			<label for="supAddr" class="text-xs font-black text-slate-400 uppercase">Alamat</label>
			<textarea id="supAddr" bind:value={form.address} class="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 min-h-[100px]"></textarea>
		</div>
	</div>
	{#snippet footer()}
		<Button variant="ghost" onclick={() => showModal = false}>Batal</Button>
		<Button onclick={handleSave}>Simpan Supplier</Button>
	{/snippet}
</Modal>
