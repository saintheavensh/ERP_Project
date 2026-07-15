<script lang="ts">
    import { onMount } from "svelte";
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
    } from "$lib/shared/components/ui/card";
    import { Button, buttonVariants } from "$lib/shared/components/ui/button";
    import { Input } from "$lib/shared/components/ui/input";
    import { Label } from "$lib/shared/components/ui/label";
    import { Textarea } from "$lib/shared/components/ui/textarea";
    import {
        Dialog,
        DialogContent,
        DialogHeader,
        DialogTitle,
        DialogTrigger,
    } from "$lib/shared/components/ui/dialog";
    import {
        Table,
        TableBody,
        TableCell,
        TableHead,
        TableHeader,
        TableRow,
    } from "$lib/shared/components/ui/table";
    import {
        Landmark,
        ChevronRight,
        ChevronDown,
        Plus,
        Search,
        Loader2,
        FolderOpen,
        FileText,
        BookOpen,
        Settings,
        Lock,
        Trash2,
    } from "lucide-svelte";
    import { AccountsController } from "$lib/features/finance/accounting/accounts/accounts.controller.svelte";

    const controller = new AccountsController();

    onMount(() => {
        controller.init();
    });
</script>

<div class="space-y-6 animate-in fade-in duration-500 pb-10">
    <!-- Header -->
    <div
        class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
    >
        <div>
            <div class="flex items-center gap-2 text-slate-500 text-sm mb-1">
                <a href="/accounting" class="hover:text-blue-600">Akuntansi</a>
                <ChevronRight class="h-4 w-4" />
                <span class="text-slate-900 font-medium">Chart of Accounts</span
                >
            </div>
            <h1 class="text-2xl font-bold text-slate-900 dark:text-white">
                Daftar Akun
            </h1>
        </div>

        <div class="flex items-center gap-3">
            <div class="relative">
                <Search
                    class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
                />
                <Input
                    bind:value={controller.searchQuery}
                    placeholder="Cari akun..."
                    class="pl-9 w-64"
                />
            </div>
            <div class="flex border rounded-lg overflow-hidden">
                <button
                    onclick={() => (controller.viewMode = "tree")}
                    class="px-3 py-2 text-sm {controller.viewMode === 'tree'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-50'}"
                >
                    Tree
                </button>
                <button
                    onclick={() => (controller.viewMode = "flat")}
                    class="px-3 py-2 text-sm {controller.viewMode === 'flat'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-50'}"
                >
                    List
                </button>
            </div>

            <Button
                variant="outline"
                class="gap-2"
                onclick={() => {
                    controller.loadMappings();
                    controller.showConfigDialog = true;
                }}
            >
                <Settings class="h-4 w-4" />
                Konfigurasi
            </Button>

            <Button
                variant="outline"
                class="gap-2"
                onclick={() => (controller.showGuide = true)}
            >
                <BookOpen class="h-4 w-4" />
                Panduan
            </Button>

            <Dialog bind:open={controller.showGuide}>
                <DialogContent class="max-w-3xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Panduan Setup Akun</DialogTitle>
                    </DialogHeader>

                    <div
                        class="prose prose-sm max-w-none space-y-6 pt-4 text-slate-600"
                    >
                        <!-- 1. Cara Membuat Akun -->
                        <section class="space-y-3">
                            <h3
                                class="text-lg font-bold text-slate-900 border-b pb-2"
                            >
                                🚀 Cara Membuat Akun Baru
                            </h3>
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div class="bg-slate-50 p-4 rounded-xl border">
                                    <div class="font-bold text-blue-600 mb-1">
                                        Langkah 1
                                    </div>
                                    <p>
                                        Klik tombol <span
                                            class="font-semibold text-slate-900"
                                            >+ Tambah Akun</span
                                        > di pojok kanan atas.
                                    </p>
                                </div>
                                <div class="bg-slate-50 p-4 rounded-xl border">
                                    <div class="font-bold text-blue-600 mb-1">
                                        Langkah 2
                                    </div>
                                    <p>
                                        Isi form dengan lengkap. Tanda <span
                                            class="text-red-500">*</span
                                        > artinya wajib diisi.
                                    </p>
                                </div>
                                <div class="bg-slate-50 p-4 rounded-xl border">
                                    <div class="font-bold text-blue-600 mb-1">
                                        Langkah 3
                                    </div>
                                    <p>
                                        Klik <span
                                            class="font-semibold text-slate-900"
                                            >Simpan Akun</span
                                        >. Akun akan muncul di daftar.
                                    </p>
                                </div>
                            </div>
                        </section>

                        <!-- 2. Tipe Akun -->
                        <section class="space-y-3">
                            <h3
                                class="text-lg font-bold text-slate-900 border-b pb-2"
                            >
                                📂 Tipe-Tipe Akun
                            </h3>
                            <div
                                class="border rounded-xl bg-white overflow-hidden"
                            >
                                <Table>
                                    <TableHeader class="bg-slate-50">
                                        <TableRow>
                                            <TableHead class="font-bold"
                                                >Tipe Akun</TableHead
                                            >
                                            <TableHead class="font-bold"
                                                >Prefix</TableHead
                                            >
                                            <TableHead class="font-bold"
                                                >Fungsi</TableHead
                                            >
                                            <TableHead class="font-bold"
                                                >Contoh</TableHead
                                            >
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <TableRow>
                                            <TableCell
                                                class="font-bold text-blue-600"
                                                >ASSET</TableCell
                                            >
                                            <TableCell
                                                ><code
                                                    class="bg-slate-100 px-1 py-0.5 rounded text-xs"
                                                    >1-xxxx</code
                                                ></TableCell
                                            >
                                            <TableCell
                                                >Harta / Kekayaan Perusahaan</TableCell
                                            >
                                            <TableCell
                                                >Kas, Bank, Piutang, Stok,
                                                Inventaris</TableCell
                                            >
                                        </TableRow>
                                        <TableRow>
                                            <TableCell
                                                class="font-bold text-red-600"
                                                >LIABILITY</TableCell
                                            >
                                            <TableCell
                                                ><code
                                                    class="bg-slate-100 px-1 py-0.5 rounded text-xs"
                                                    >2-xxxx</code
                                                ></TableCell
                                            >
                                            <TableCell
                                                >Kewajiban / Hutang</TableCell
                                            >
                                            <TableCell
                                                >Hutang Supplier, Pinjaman Bank</TableCell
                                            >
                                        </TableRow>
                                        <TableRow>
                                            <TableCell
                                                class="font-bold text-purple-600"
                                                >EQUITY</TableCell
                                            >
                                            <TableCell
                                                ><code
                                                    class="bg-slate-100 px-1 py-0.5 rounded text-xs"
                                                    >3-xxxx</code
                                                ></TableCell
                                            >
                                            <TableCell>Modal Pemilik</TableCell>
                                            <TableCell
                                                >Modal Awal, Laba Ditahan, Prive</TableCell
                                            >
                                        </TableRow>
                                        <TableRow>
                                            <TableCell
                                                class="font-bold text-green-600"
                                                >REVENUE</TableCell
                                            >
                                            <TableCell
                                                ><code
                                                    class="bg-slate-100 px-1 py-0.5 rounded text-xs"
                                                    >4-xxxx</code
                                                ></TableCell
                                            >
                                            <TableCell
                                                >Pendapatan / Pemasukan</TableCell
                                            >
                                            <TableCell
                                                >Penjualan, Jasa Service</TableCell
                                            >
                                        </TableRow>
                                        <TableRow>
                                            <TableCell
                                                class="font-bold text-orange-600"
                                                >EXPENSE</TableCell
                                            >
                                            <TableCell
                                                ><code
                                                    class="bg-slate-100 px-1 py-0.5 rounded text-xs"
                                                    >5-xxxx</code
                                                ></TableCell
                                            >
                                            <TableCell
                                                >Beban / Pengeluaran</TableCell
                                            >
                                            <TableCell
                                                >HPP, Gaji, Sewa, Listrik</TableCell
                                            >
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                        </section>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <!-- 3. Tips Penomoran -->
                            <section class="space-y-3">
                                <h3
                                    class="text-lg font-bold text-slate-900 border-b pb-2"
                                >
                                    💡 Tips Penomoran Kode
                                </h3>
                                <div
                                    class="bg-slate-50 p-4 rounded-xl border text-sm space-y-2"
                                >
                                    <div class="flex justify-between">
                                        <span>Kas & Bank:</span>
                                        <span class="font-mono font-bold"
                                            >1001, 1010...</span
                                        >
                                    </div>
                                    <div class="flex justify-between">
                                        <span>Piutang:</span>
                                        <span class="font-mono font-bold"
                                            >2000, 2001...</span
                                        >
                                    </div>
                                    <div class="flex justify-between">
                                        <span>Persediaan:</span>
                                        <span class="font-mono font-bold"
                                            >3000, 3001...</span
                                        >
                                    </div>
                                    <div class="flex justify-between">
                                        <span>Hutang:</span>
                                        <span class="font-mono font-bold"
                                            >1000, 1001...</span
                                        >
                                    </div>
                                    <div class="flex justify-between">
                                        <span>Modal:</span>
                                        <span class="font-mono font-bold"
                                            >1000, 2000...</span
                                        >
                                    </div>
                                    <div class="flex justify-between">
                                        <span>Pendapatan:</span>
                                        <span class="font-mono font-bold"
                                            >1000, 2000...</span
                                        >
                                    </div>
                                    <div class="flex justify-between">
                                        <span>Beban (HPP):</span>
                                        <span class="font-mono font-bold"
                                            >1000, 1001...</span
                                        >
                                    </div>
                                    <div class="flex justify-between">
                                        <span>Beban Operasional:</span>
                                        <span class="font-mono font-bold"
                                            >2000, 2100...</span
                                        >
                                    </div>
                                </div>
                            </section>

                            <!-- 4. Akun Wajib -->
                            <section class="space-y-3">
                                <h3
                                    class="text-lg font-bold text-slate-900 border-b pb-2"
                                >
                                    ✅ Akun Wajib (Toko Service)
                                </h3>
                                <ul class="space-y-2 text-sm">
                                    <li class="flex gap-2">
                                        <span
                                            class="text-blue-600 font-bold w-12 shrink-0"
                                            >1001</span
                                        >
                                        <span>Kas Toko (Utama)</span>
                                    </li>
                                    <li class="flex gap-2">
                                        <span
                                            class="text-blue-600 font-bold w-12 shrink-0"
                                            >1010</span
                                        >
                                        <span>Bank BCA / Transfer</span>
                                    </li>
                                    <li class="flex gap-2">
                                        <span
                                            class="text-green-600 font-bold w-12 shrink-0"
                                            >4-1000</span
                                        >
                                        <span>Pendapatan Penjualan</span>
                                    </li>
                                    <li class="flex gap-2">
                                        <span
                                            class="text-green-600 font-bold w-12 shrink-0"
                                            >4-2000</span
                                        >
                                        <span>Pendapatan Service</span>
                                    </li>
                                    <li class="flex gap-2">
                                        <span
                                            class="text-orange-600 font-bold w-12 shrink-0"
                                            >5-1001</span
                                        >
                                        <span>HPP Penjualan (Modal Barang)</span
                                        >
                                    </li>
                                    <li class="flex gap-2">
                                        <span
                                            class="text-orange-600 font-bold w-12 shrink-0"
                                            >5-1002</span
                                        >
                                        <span
                                            >HPP Service (Modal Sparepart)</span
                                        >
                                    </li>
                                </ul>
                            </section>
                        </div>

                        <!-- 5. FAQ -->
                        <section class="space-y-3">
                            <h3
                                class="text-lg font-bold text-slate-900 border-b pb-2"
                            >
                                ❓ FAQ (Tanya Jawab)
                            </h3>
                            <div class="space-y-4">
                                <div>
                                    <div class="font-bold text-slate-900">
                                        Apa itu Tree vs List?
                                    </div>
                                    <p class="text-sm">
                                        <b>Tree</b> menampilkan struktur
                                        folder/induk-anak. <b>List</b> menampilkan
                                        tabel biasa. Gunakan tombol di atas untuk
                                        mengganti tampilan.
                                    </p>
                                </div>
                                <div>
                                    <div class="font-bold text-slate-900">
                                        Bagaimana jika salah buat akun?
                                    </div>
                                    <p class="text-sm">
                                        Selama belum ada transaksi, akun bisa
                                        dihapus. Jika sudah ada transaksi, Anda
                                        harus membuat jurnal koreksi atau
                                        membiarkannya.
                                    </p>
                                </div>
                                <div>
                                    <div class="font-bold text-slate-900">
                                        Apa fungsi Transfer Dana?
                                    </div>
                                    <p class="text-sm">
                                        Fitur praktis untuk memindahkan uang
                                        antar akun (misal: setor tunai Kas ke
                                        Bank) tanpa membuat jurnal manual.
                                    </p>
                                </div>
                            </div>
                        </section>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog bind:open={controller.showConfigDialog}>
                <DialogContent class="max-w-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Konfigurasi Mapping Akun</DialogTitle>
                    </DialogHeader>

                    {#if controller.mappingSettings}
                        <div class="space-y-6 py-4">
                            {#each Object.entries(controller.getMappingGroups()) as [groupName, mappings]}
                                {#if mappings.length > 0}
                                    <div class="space-y-3">
                                        <h3
                                            class="font-bold text-sm uppercase text-slate-500 tracking-wider border-b pb-1"
                                        >
                                            {groupName}
                                        </h3>
                                        <div class="grid gap-4">
                                            {#each mappings as mapping}
                                                <div
                                                    class="grid grid-cols-1 md:grid-cols-3 md:items-center gap-2"
                                                >
                                                    <div
                                                        class="text-sm font-medium"
                                                    >
                                                        {mapping.label}
                                                        {#if mapping.description}
                                                            <p
                                                                class="text-[10px] text-slate-500 font-normal"
                                                            >
                                                                {mapping.description}
                                                            </p>
                                                        {/if}
                                                    </div>
                                                    <div class="md:col-span-2">
                                                        <select
                                                            bind:value={
                                                                mapping.accountId
                                                            }
                                                            class="flex h-9 w-full rounded-md border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                                        >
                                                            <option value=""
                                                                >Pilih Akun...</option
                                                            >
                                                            {#each controller.accounts as acc}
                                                                <option
                                                                    value={acc.id}
                                                                    >{acc.code} -
                                                                    {acc.name}</option
                                                                >
                                                            {/each}
                                                        </select>
                                                    </div>
                                                </div>
                                            {/each}
                                        </div>
                                    </div>
                                {/if}
                            {/each}
                        </div>

                        <div class="flex justify-end gap-3 pt-4">
                            <Button
                                variant="outline"
                                onclick={() =>
                                    (controller.showConfigDialog = false)}
                            >
                                Batal
                            </Button>
                            <Button
                                onclick={controller.saveMappings}
                                disabled={controller.savingConfig}
                            >
                                {#if controller.savingConfig}
                                    <Loader2
                                        class="mr-2 h-4 w-4 animate-spin"
                                    />
                                {/if}
                                Simpan Konfigurasi
                            </Button>
                        </div>
                    {:else}
                        <div class="py-8 text-center text-slate-500">
                            <Loader2
                                class="h-8 w-8 animate-spin mx-auto mb-2"
                            />
                            Memuat konfigurasi...
                        </div>
                    {/if}
                </DialogContent>
            </Dialog>

            <Dialog bind:open={controller.showCreateDialog}>
                <DialogTrigger class={buttonVariants({ className: "gap-2" })}>
                    <Plus class="h-4 w-4" />
                    Tambah Akun
                </DialogTrigger>
                <DialogContent class="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Buat Akun Baru</DialogTitle>
                    </DialogHeader>
                    <form
                        onsubmit={(e) => {
                            e.preventDefault();
                            controller.handleCreateAccount();
                        }}
                        class="space-y-4 pt-2"
                    >
                        <div class="grid grid-cols-2 gap-4">
                            <div class="space-y-2">
                                <Label
                                    >Tipe Akun <span class="text-red-500"
                                        >*</span
                                    ></Label
                                >
                                <select
                                    bind:value={controller.createForm.typeId}
                                    class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    required
                                >
                                    <option value="" disabled>Pilih Tipe</option
                                    >
                                    {#each controller.accountTypes as type}
                                        <option value={type.id}
                                            >{type.name}</option
                                        >
                                    {/each}
                                </select>
                            </div>
                            <div class="space-y-2">
                                <Label
                                    >Kode Akun <span class="text-red-500"
                                        >*</span
                                    ></Label
                                >
                                <Input
                                    bind:value={controller.createForm.code}
                                    placeholder="Contoh: 1001"
                                    required
                                />
                            </div>
                        </div>

                        <div class="space-y-2">
                            <Label
                                >Nama Akun <span class="text-red-500">*</span
                                ></Label
                            >
                            <Input
                                bind:value={controller.createForm.name}
                                placeholder="Contoh: Kas Kecil"
                                required
                            />
                        </div>

                        <div class="space-y-2">
                            <Label>Induk Akun (Optional)</Label>
                            <select
                                bind:value={controller.createForm.parentId}
                                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="">- Tidak ada induk -</option>
                                {#each controller.accounts as acc}
                                    <option value={acc.id}
                                        >{acc.code} - {acc.name}</option
                                    >
                                {/each}
                            </select>
                            <p class="text-[10px] text-slate-500">
                                Pilih jika akun ini adalah sub-akun dari akun
                                lain.
                            </p>
                        </div>

                        <div class="space-y-2">
                            <Label>Deskripsi</Label>
                            <Textarea
                                bind:value={controller.createForm.description}
                                placeholder="Penjelasan penggunaan akun..."
                            />
                        </div>

                        <div class="flex justify-end gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onclick={() =>
                                    (controller.showCreateDialog = false)}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={controller.creating}
                            >
                                {#if controller.creating}
                                    <Loader2
                                        class="h-4 w-4 animate-spin mr-2"
                                    />
                                {/if}
                                Simpan Akun
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog bind:open={controller.showTransferDialog}>
                <DialogTrigger>
                    <Button
                        variant="outline"
                        class="gap-2 px-6 rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50"
                    >
                        <Landmark class="h-4 w-4" />
                        Transfer Dana
                    </Button>
                </DialogTrigger>
                <DialogContent
                    class="max-w-md rounded-3xl p-0 overflow-hidden border-none shadow-2xl"
                >
                    <div class="h-1.5 bg-blue-600"></div>
                    <div class="p-8 space-y-6">
                        <div>
                            <h3 class="text-xl font-bold">
                                Transfer Antar Rekening
                            </h3>
                            <p class="text-sm text-slate-500 mt-1">
                                Pindahkan saldo kas atau alokasi dana cadangan
                                secara internal.
                            </p>
                        </div>

                        <form
                            onsubmit={(e) => {
                                e.preventDefault();
                                controller.handleTransfer();
                            }}
                            class="space-y-5"
                        >
                            <div class="space-y-2">
                                <Label
                                    class="text-xs font-bold text-slate-400 uppercase tracking-widest"
                                    >Dari Akun (Sumber)</Label
                                >
                                <select
                                    bind:value={
                                        controller.transferForm.fromAccountId
                                    }
                                    class="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                >
                                    <option value="" disabled
                                        >Pilih Sumber Dana</option
                                    >
                                    {#each controller.accounts.filter((a) => a.typeId === "ASSET" || a.typeId === "LIABILITY") as acc}
                                        <option value={acc.id}
                                            >{acc.name} ({controller.formatCurrency(
                                                acc.balance,
                                            )})</option
                                        >
                                    {/each}
                                </select>
                            </div>

                            <div class="flex justify-center -my-2">
                                <div
                                    class="bg-blue-50 p-2 rounded-full border border-blue-100"
                                >
                                    <ChevronDown
                                        class="h-4 w-4 text-blue-600"
                                    />
                                </div>
                            </div>

                            <div class="space-y-2">
                                <Label
                                    class="text-xs font-bold text-slate-400 uppercase tracking-widest"
                                    >Ke Akun (Tujuan)</Label
                                >
                                <select
                                    bind:value={
                                        controller.transferForm.toAccountId
                                    }
                                    class="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                >
                                    <option value="" disabled
                                        >Pilih Tujuan Alokasi</option
                                    >
                                    {#each controller.accounts.filter((a) => a.id !== controller.transferForm.fromAccountId) as acc}
                                        <option value={acc.id}
                                            >{acc.name} ({acc.code})</option
                                        >
                                    {/each}
                                </select>
                            </div>

                            <div class="space-y-2">
                                <Label
                                    class="text-xs font-bold text-slate-400 uppercase tracking-widest"
                                    >Nominal Transfer</Label
                                >
                                <div class="relative">
                                    <span
                                        class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold"
                                        >Rp</span
                                    >
                                    <Input
                                        type="number"
                                        bind:value={
                                            controller.transferForm.amount
                                        }
                                        class="pl-10 h-11 rounded-xl font-bold text-lg"
                                        min="1"
                                        required
                                    />
                                </div>
                            </div>

                            <div class="space-y-2">
                                <Label
                                    class="text-xs font-bold text-slate-400 uppercase tracking-widest"
                                    >Keterangan</Label
                                >
                                <Input
                                    bind:value={
                                        controller.transferForm.description
                                    }
                                    placeholder="Misal: Alokasi Cadangan Service"
                                    class="h-11 rounded-xl italic"
                                    required
                                />
                            </div>

                            <div class="flex gap-3 pt-4">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    class="flex-1 rounded-xl h-11"
                                    onclick={() =>
                                        (controller.showTransferDialog = false)}
                                    >Batal</Button
                                >
                                <Button
                                    type="submit"
                                    disabled={controller.transferring}
                                    class="flex-1 rounded-xl h-11 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-100"
                                >
                                    {#if controller.transferring}
                                        <Loader2
                                            class="h-4 w-4 animate-spin mr-2"
                                        />
                                        Mengirim...
                                    {:else}
                                        Konfirmasi Transfer
                                    {/if}
                                </Button>
                            </div>
                        </form>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    </div>

    {#if controller.loading}
        <div class="flex items-center justify-center py-20">
            <Loader2 class="h-8 w-8 animate-spin text-blue-600" />
        </div>
    {:else if controller.viewMode === "tree"}
        <!-- Tree View -->
        <Card class="border-0 shadow-lg rounded-2xl">
            <CardContent class="p-0">
                <div class="divide-y">
                    {#each controller.accountTree as node}
                        {@render treeNode(node, 0)}
                    {:else}
                        <div class="p-8 text-center text-slate-500">
                            Belum ada akun. Silakan tambah akun baru.
                        </div>
                    {/each}
                </div>
            </CardContent>
        </Card>
    {:else}
        <!-- Flat List -->
        <Card class="border-0 shadow-lg rounded-2xl overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow class="bg-slate-50">
                        <TableHead class="w-24">Kode</TableHead>
                        <TableHead>Nama Akun</TableHead>
                        <TableHead class="w-32">Tipe</TableHead>
                        <TableHead class="text-right w-40">Saldo</TableHead>
                        <TableHead class="w-16"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {#each controller.filteredAccounts as account}
                        <TableRow class="hover:bg-slate-50">
                            <TableCell class="font-mono text-sm"
                                >{account.code}</TableCell
                            >
                            <TableCell class="font-medium"
                                >{account.name}</TableCell
                            >
                            <TableCell>
                                <span
                                    class="text-xs px-2 py-1 rounded-full {controller.getTypeColor(
                                        account.typeId,
                                    )}"
                                >
                                    {account.typeName}
                                </span>
                            </TableCell>
                            <TableCell class="text-right font-mono">
                                {controller.formatCurrency(
                                    account.balance || 0,
                                )}
                            </TableCell>
                            <TableCell>
                                {#if account.isSystem}
                                    <div title="Akun Sistem (Terkunci)">
                                        <Lock
                                            class="h-4 w-4 text-slate-400 mx-auto"
                                        />
                                    </div>
                                {:else}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        class="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                                        onclick={(e) => {
                                            e.stopPropagation();
                                            controller.handleDeleteAccount(
                                                account.id,
                                            );
                                        }}
                                        disabled={account.balance !== 0}
                                        title={account.balance !== 0
                                            ? "Tidak dapat menghapus akun dengan saldo"
                                            : "Hapus Akun"}
                                    >
                                        <Trash2 class="h-4 w-4" />
                                    </Button>
                                {/if}
                            </TableCell>
                        </TableRow>
                    {:else}
                        <TableRow>
                            <TableCell
                                colspan={4}
                                class="p-8 text-center text-slate-500"
                            >
                                Belum ada akun. Silakan tambah akun baru.
                            </TableCell>
                        </TableRow>
                    {/each}
                </TableBody>
            </Table>
        </Card>
    {/if}
</div>

{#snippet treeNode(node: any, level: number)}
    <div class="border-b last:border-b-0">
        <button
            class="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
            style="padding-left: {16 + level * 24}px"
            onclick={() =>
                node.children?.length > 0 && controller.toggleNode(node.id)}
        >
            <!-- Expand icon -->
            {#if node.children?.length > 0}
                {#if controller.expandedNodes.has(node.id)}
                    <ChevronDown class="h-4 w-4 text-slate-400" />
                {:else}
                    <ChevronRight class="h-4 w-4 text-slate-400" />
                {/if}
            {:else}
                <div class="w-4"></div>
            {/if}

            <!-- Icon based on whether it has children -->
            {#if node.children?.length > 0}
                <FolderOpen class="h-4 w-4 text-amber-500" />
            {:else}
                <FileText class="h-4 w-4 text-slate-400" />
            {/if}

            <!-- Account info -->
            <span class="font-mono text-sm text-slate-500 w-16"
                >{node.code}</span
            >
            <span class="font-medium flex-1">{node.name}</span>
            <span
                class="text-xs px-2 py-1 rounded-full {controller.getTypeColor(
                    node.typeId,
                )}"
            >
                {node.typeName}
            </span>
            <span class="font-mono text-sm text-slate-600 w-32 text-right mr-4">
                {controller.formatCurrency(node.balance || 0)}
            </span>

            {#if node.isSystem}
                <div title="Akun Sistem (Terkunci)">
                    <Lock class="h-4 w-4 text-slate-400 shrink-0" />
                </div>
            {:else}
                <Button
                    variant="ghost"
                    size="icon"
                    class="h-7 w-7 text-rose-500 hover:text-rose-600 hover:bg-rose-50 p-0"
                    onclick={(e) => {
                        e.stopPropagation();
                        controller.handleDeleteAccount(node.id);
                    }}
                    disabled={node.balance !== 0 || node.children?.length > 0}
                    title={node.balance !== 0
                        ? "Tidak dapat menghapus akun dengan saldo"
                        : node.children?.length > 0
                          ? "Hapus semua akun cabang terlebih dahulu"
                          : "Hapus Akun"}
                >
                    <Trash2 class="h-3.5 w-3.5" />
                </Button>
            {/if}
        </button>

        <!-- Children -->
        {#if node.children?.length > 0 && controller.expandedNodes.has(node.id)}
            {#each node.children as child}
                {@render treeNode(child, level + 1)}
            {/each}
        {/if}
    </div>
{/snippet}
