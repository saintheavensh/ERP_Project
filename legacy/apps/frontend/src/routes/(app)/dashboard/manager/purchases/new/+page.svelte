<script lang="ts">
    import { onMount } from "svelte";
    import { Button } from "$lib/shared/components/ui/button";
    import { Input } from "$lib/shared/components/ui/input";
    import { Label } from "$lib/shared/components/ui/label";
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
    } from "$lib/shared/components/ui/card";
    import {
        Table,
        TableBody,
        TableCell,
        TableHead,
        TableHeader,
        TableRow,
    } from "$lib/shared/components/ui/table";
    import { toast } from "svelte-sonner";
    import {
        Plus,
        Trash2,
        Save,
        ArrowLeft,
        Store,
        Calendar,
        Hash,
        FileText,
        Info,
        Check,
        Tag,
    } from "lucide-svelte";
    import { Badge } from "$lib/shared/components/ui/badge";
    import { Separator } from "$lib/shared/components/ui/separator";
    import DateTimePicker from "$lib/shared/components/custom/date-time-picker.svelte";
    import CurrencyInput from "$lib/shared/components/custom/currency-input.svelte";
    import { fade } from "svelte/transition";
    import Combobox from "$lib/shared/components/ui/combobox.svelte";

    // Import Controller
    import { PurchaseFormController } from "$lib/features/sales/components/purchases/purchase-form.controller.svelte";

    // Initialize Controller
    const controller = new PurchaseFormController();

    onMount(() => {
        controller.loadDependencies();
    });
</script>

<div class="space-y-6 pb-20">
    <!-- Header -->
    <div
        class="flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 p-8 rounded-3xl text-white shadow-xl mb-8 relative overflow-hidden"
    >
        <div
            class="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none"
        ></div>
        <div class="relative z-10 space-y-2">
            <h2 class="text-3xl font-bold tracking-tight">
                Input Pembelian Baru
            </h2>
            <p class="text-blue-100 text-lg">
                Buat transaksi pembelian stok masuk dari supplier
            </p>
        </div>
        <div class="flex items-center space-x-2 relative z-10">
            <Button
                variant="outline"
                href="/manager/purchases"
                class="bg-white/10 hover:bg-white/20 text-white border-white/20 hover:text-white"
            >
                <ArrowLeft class="mr-2 h-4 w-4" /> Kembali
            </Button>
            <div class="flex flex-col items-end gap-2">
                <Button
                    onclick={() => controller.submit()}
                    disabled={controller.loading || !controller.isValid}
                    class="bg-white text-blue-600 hover:bg-white/90 font-bold shadow-lg"
                >
                    {#if controller.loading}
                        <span class="mr-2">Menyimpan...</span>
                    {:else}
                        <Save class="mr-2 h-4 w-4" /> Simpan Transaksi
                    {/if}
                </Button>
                {#if !controller.isValid && controller.selectedSupplierId && controller.items.length > 0}
                    <div class="flex flex-col items-end">
                        {#each controller.validationErrors as error}
                            <span class="text-[10px] text-white/80 font-medium"
                                >● {error}</span
                            >
                        {/each}
                    </div>
                {/if}
            </div>
        </div>
    </div>

    <div class="grid gap-6 md:grid-cols-2">
        <!-- Informations Card -->
        <Card>
            <CardHeader>
                <CardTitle class="flex items-center text-lg">
                    <Info class="mr-2 h-5 w-5 text-primary" /> Informasi Transaksi
                </CardTitle>
            </CardHeader>
            <CardContent class="grid gap-4">
                <div class="grid gap-2">
                    <Label for="supplier">Supplier</Label>
                    <div class="relative">
                        <Combobox
                            items={controller.suppliers}
                            bind:value={controller.selectedSupplierId}
                            labelKey="name"
                            valueKey="id"
                            placeholder="Pilih Supplier..."
                            searchPlaceholder="Cari supplier..."
                            onSelect={(item) =>
                                controller.loadPriorities(item.id)}
                            class="w-full pl-9"
                        />
                        <Store
                            class="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10 pointer-events-none"
                        />
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div class="grid gap-2">
                        <Label for="date">Tanggal Transaksi</Label>
                        <div class="relative">
                            <Calendar
                                class="absolute left-3 top-3 h-4 w-4 text-muted-foreground"
                            />
                            <Input
                                id="date"
                                type="datetime-local"
                                class="pl-9"
                                bind:value={controller.date}
                            />
                        </div>
                    </div>
                    <div class="grid gap-2">
                        <Label for="ref">No. Referensi (Faktur)</Label>
                        <div class="relative">
                            <Hash
                                class="absolute left-3 top-3 h-4 w-4 text-muted-foreground"
                            />
                            <Input
                                id="ref"
                                placeholder="Contoh: INV/2024..."
                                class="pl-9 font-mono {controller.referenceNumber
                                    ? 'border-green-200 bg-green-50'
                                    : 'border-red-200 bg-red-50'}"
                                bind:value={controller.referenceNumber}
                            />
                        </div>
                        {#if !controller.referenceNumber}
                            <p class="text-[10px] text-red-500 mt-1">
                                * Wajib diisi (Auto-generated)
                            </p>
                        {/if}
                    </div>
                </div>

                <div class="grid gap-2">
                    <Label for="notes">Catatan Tambahan</Label>
                    <div class="relative">
                        <FileText
                            class="absolute left-3 top-3 h-4 w-4 text-muted-foreground"
                        />
                        <Input
                            id="notes"
                            placeholder="Catatan internal..."
                            class="pl-9"
                            bind:value={controller.notes}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>

        <!-- Summary Card -->
        <Card class="bg-muted/30 border-dashed">
            <CardHeader>
                <CardTitle class="flex items-center text-lg">
                    Ringkasan Biaya
                </CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">
                <div class="flex items-center justify-between text-sm">
                    <span class="text-muted-foreground">Total Item</span>
                    <Badge variant="outline"
                        >{controller.items.length} Item</Badge
                    >
                </div>
                <!-- Add category summaries if needed -->

                <Separator />

                <div class="flex items-center justify-between">
                    <span class="font-semibold text-lg">Total Pembelian</span>
                    <span class="font-bold text-2xl text-primary">
                        Rp {controller.totalAmount.toLocaleString()}
                    </span>
                </div>

                <p class="text-xs text-muted-foreground text-right mt-2">
                    *Pastikan semua data sudah benar sebelum menyimpan
                </p>
            </CardContent>
        </Card>
    </div>

    <!-- Category Selection (Step 2) -->
    {#if controller.selectedSupplierId && controller.supplierCategories.length > 0}
        <Card class="animate-in fade-in slide-in-from-top-4 duration-500">
            <CardHeader>
                <CardTitle class="text-lg">Pilih Kategori Produk</CardTitle>
                <p class="text-sm text-muted-foreground">
                    Checklist kategori yang ingin Anda input dalam PO ini.
                </p>
            </CardHeader>
            <CardContent>
                <div class="flex flex-wrap gap-4">
                    {#each controller.supplierCategories as cat}
                        <div
                            class="flex items-center space-x-2 border rounded-xl p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                            role="button"
                            tabindex="0"
                            onclick={() => controller.toggleCategory(cat.id)}
                            onkeydown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    controller.toggleCategory(cat.id);
                                }
                            }}
                        >
                            <div
                                class="h-5 w-5 rounded border flex items-center justify-center {controller.selectedCategoryIds.includes(
                                    cat.id,
                                )
                                    ? 'bg-primary border-primary text-primary-foreground'
                                    : 'border-muted-foreground'}"
                            >
                                {#if controller.selectedCategoryIds.includes(cat.id)}
                                    <Check class="h-3.5 w-3.5" />
                                {/if}
                            </div>
                            <span class="font-medium">{cat.name}</span>
                        </div>
                    {/each}
                </div>
            </CardContent>
        </Card>
    {/if}

    <!-- Dynamic Category Sections (Step 3) -->
    <div class="space-y-6 pb-32">
        {#each controller.selectedCategoryIds as catId}
            {@const category = controller.supplierCategories.find(
                (c) => c.id === catId,
            )}
            {@const categoryItems = controller.items.filter(
                (i) => i.categoryId === catId,
            )}
            {@const categoryTotal = categoryItems.reduce(
                (sum, item) => sum + (item.qty || 0) * (item.buyPrice || 0),
                0,
            )}

            <Card
                class="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow"
            >
                <CardHeader
                    class="flex flex-row items-center justify-between py-4 bg-muted/10"
                >
                    <div class="flex items-center gap-2">
                        <div
                            class="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"
                        >
                            <Tag class="h-4 w-4" />
                        </div>
                        <CardTitle class="text-xl text-blue-700">
                            {category?.name}
                        </CardTitle>
                    </div>
                    <Button
                        size="sm"
                        variant="secondary"
                        class="border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                        onclick={() => controller.addItem(catId)}
                    >
                        <Plus class="mr-2 h-4 w-4" /> Tambah Item
                    </Button>
                </CardHeader>
                <CardContent class="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow class="bg-muted/30 hover:bg-muted/30">
                                <TableHead class="w-[50px] text-center"
                                    >#</TableHead
                                >
                                <TableHead class="min-w-[250px]"
                                    >Produk</TableHead
                                >
                                <TableHead class="w-[150px]">Varian</TableHead>
                                <TableHead class="w-[100px]">Qty</TableHead>
                                <TableHead class="w-[180px]"
                                    >Est. Harga Beli</TableHead
                                >
                                <TableHead class="w-[180px] text-right"
                                    >Subtotal</TableHead
                                >
                                <TableHead class="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {#each controller.items as item, i}
                                {#if item.categoryId === catId}
                                    <TableRow>
                                        <TableCell
                                            class="text-center text-muted-foreground text-xs"
                                        >
                                            {i + 1}
                                        </TableCell>
                                        <TableCell>
                                            <Combobox
                                                items={controller.getProducts(
                                                    catId,
                                                )}
                                                bind:value={item.productId}
                                                labelKey="name"
                                                valueKey="id"
                                                placeholder="Pilih {category?.name}..."
                                                searchPlaceholder="Cari {category?.name}..."
                                                class="w-full"
                                                onSelect={(selected) =>
                                                    controller.updateItemProduct(
                                                        i,
                                                        selected.id,
                                                    )}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {#if item.variants && item.variants.length > 0}
                                                <Combobox
                                                    items={item.variants.map(
                                                        (v) => ({
                                                            ...v,
                                                            displayName:
                                                                v.warrantyPeriodDays
                                                                    ? `${v.name} (Garansi: ${v.warrantyPeriodDays} hari)`
                                                                    : v.name,
                                                        }),
                                                    )}
                                                    bind:value={item.variant}
                                                    labelKey="displayName"
                                                    valueKey="name"
                                                    placeholder="Varian"
                                                    class="w-[200px]"
                                                />
                                            {:else}
                                                <Input
                                                    class="h-9"
                                                    placeholder="Original"
                                                    bind:value={item.variant}
                                                />
                                            {/if}
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                class="h-9 text-center"
                                                min="1"
                                                bind:value={item.qty}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <div class="relative">
                                                <span
                                                    class="absolute left-3 top-2.5 text-xs text-muted-foreground"
                                                    >Rp</span
                                                >
                                                <Input
                                                    type="number"
                                                    class="h-9 pl-8"
                                                    min="0"
                                                    bind:value={item.buyPrice}
                                                />
                                            </div>
                                        </TableCell>
                                        <TableCell
                                            class="text-right font-medium"
                                        >
                                            Rp {(
                                                Number(item.qty) *
                                                Number(item.buyPrice)
                                            ).toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                class="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                onclick={() =>
                                                    controller.removeItem(i)}
                                            >
                                                <Trash2 class="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                {/if}
                            {/each}
                            <!-- Category Subtotal -->
                            <TableRow class="bg-muted/10 font-medium">
                                <TableCell
                                    colspan={5}
                                    class="text-right text-muted-foreground text-sm"
                                >
                                    Subtotal {category?.name}
                                </TableCell>
                                <TableCell class="text-right text-blue-700">
                                    Rp {categoryTotal.toLocaleString()}
                                </TableCell>
                                <TableCell></TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        {/each}
    </div>

    <!-- Empty State -->
    {#if controller.selectedCategoryIds.length === 0 && controller.selectedSupplierId}
        <div
            class="py-20 text-center border-2 border-dashed rounded-3xl bg-muted/10"
        >
            <h3 class="text-xl font-semibold text-muted-foreground">
                Pilih Kategori untuk Memulai
            </h3>
            <p class="text-muted-foreground mt-2">
                Silakan pilih kategori di atas untuk memunculkan form input
                barang
            </p>
        </div>
    {/if}
</div>
