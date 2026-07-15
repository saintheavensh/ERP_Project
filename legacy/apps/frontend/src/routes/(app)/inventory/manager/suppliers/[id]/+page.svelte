<script lang="ts">
    import { page } from "$app/stores";
    import { Button } from "$lib/shared/components/ui/button";
    import { Input } from "$lib/shared/components/ui/input";
    import { Label } from "$lib/shared/components/ui/label";
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
    } from "$lib/shared/components/ui/card";
    import { Badge } from "$lib/shared/components/ui/badge";
    import {
        Plus,
        Trash2,
        ArrowLeft,
        Save,
        Layers,
        Building2,
        Phone,
        MapPin,
        Search,
        CheckCircle2,
        X,
    } from "lucide-svelte";
    import Combobox from "$lib/shared/components/ui/combobox.svelte";
    import {
        Tabs,
        TabsContent,
        TabsList,
        TabsTrigger,
    } from "$lib/shared/components/ui/tabs";
    import { Skeleton } from "$lib/shared/components/ui/skeleton";
    import { SupplierDetailController } from "$lib/features/inventory/suppliers/supplier-detail.controller.svelte";

    const supplierId = $page.params.id ?? "";
    const controller = new SupplierDetailController(supplierId);
</script>

<div class="container mx-auto py-8 space-y-8 animate-in fade-in duration-500">
    <Button
        variant="ghost"
        class="gap-2 mb-4 hover:bg-slate-100"
        href="/suppliers"
    >
        <ArrowLeft class="h-4 w-4" /> Kembali ke Daftar Supplier
    </Button>

    {#if controller.isLoading}
        <div class="space-y-4">
            <Skeleton class="h-40 w-full rounded-3xl" />
            <Skeleton class="h-20 w-full rounded-xl" />
        </div>
    {:else if !controller.supplier}
        <div class="text-center py-20">
            <h2 class="text-2xl font-bold">Supplier tidak ditemukan</h2>
        </div>
    {:else}
        <!-- Header -->
        <div
            class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-600 p-8 text-white shadow-2xl"
        >
            <!-- Pattern -->
            <div
                class="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10"
            ></div>

            <div
                class="relative z-10 flex flex-col md:flex-row gap-8 items-center"
            >
                <div
                    class="h-24 w-24 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-4xl font-bold shadow-inner"
                >
                    {controller.supplier.name.substring(0, 2).toUpperCase()}
                </div>
                <div class="space-y-2 text-center md:text-left flex-1">
                    <h1 class="text-3xl md:text-5xl font-bold tracking-tight">
                        {controller.supplier.name}
                    </h1>
                    <div
                        class="flex flex-wrap gap-4 justify-center md:justify-start text-indigo-100"
                    >
                        {#if controller.supplier.contact}
                            <div class="flex items-center gap-1.5">
                                <Building2 class="h-4 w-4" />
                                {controller.supplier.contact}
                            </div>
                        {/if}
                        {#if controller.supplier.phone}
                            <div class="flex items-center gap-1.5">
                                <Phone class="h-4 w-4" />
                                {controller.supplier.phone}
                            </div>
                        {/if}
                        {#if controller.supplier.address}
                            <div class="flex items-center gap-1.5 max-w-md">
                                <MapPin class="h-4 w-4 shrink-0" />
                                <span class="truncate"
                                    >{controller.supplier.address}</span
                                >
                            </div>
                        {/if}
                    </div>
                </div>
            </div>
        </div>

        <Tabs value="config" class="w-full">
            <TabsList
                class="w-full justify-start h-auto p-1 bg-muted/50 rounded-xl"
            >
                <TabsTrigger
                    value="config"
                    class="rounded-lg py-2.5 px-6 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
                    >Konfigurasi Produk</TabsTrigger
                >
                <TabsTrigger
                    value="history"
                    class="rounded-lg py-2.5 px-6 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
                    >Riwayat Pembelian</TabsTrigger
                >
            </TabsList>

            <!-- Configuration Tab -->
            <TabsContent value="config" class="mt-6 space-y-6">
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <!-- Left: Add/Link Category -->
                    <div class="lg:col-span-1 space-y-6">
                        <Card class="border-slate-200 shadow-sm">
                            <CardHeader>
                                <CardTitle
                                    class="text-lg flex items-center gap-2"
                                >
                                    <Plus class="h-5 w-5 text-indigo-600" /> Tautkan
                                    Kategori
                                </CardTitle>
                            </CardHeader>
                            <CardContent class="space-y-4">
                                <p class="text-sm text-muted-foreground">
                                    Pilih kategori produk yang disediakan oleh
                                    supplier ini.
                                </p>
                                <div class="space-y-3">
                                    <Label>Pilih Kategori</Label>
                                    <Combobox
                                        items={controller.availableCategories}
                                        bind:value={
                                            controller.selectedCategoryId
                                        }
                                        placeholder="Cari kategori..."
                                    />
                                    <Button
                                        class="w-full"
                                        onclick={() =>
                                            controller.handleLinkCategory()}
                                        disabled={!controller.selectedCategoryId ||
                                            controller.linkCategoryMutation
                                                .isPending}
                                    >
                                        {controller.linkCategoryMutation
                                            .isPending
                                            ? "Menautkan..."
                                            : "Tautkan Kategori"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <!-- Right: Linked Categories List & Variants -->
                    <div class="lg:col-span-2 space-y-6">
                        <h3 class="text-xl font-bold flex items-center gap-2">
                            <CheckCircle2 class="h-5 w-5 text-emerald-500" /> Kategori
                            Terdaftar
                        </h3>

                        {#if controller.linkedCategoriesQuery.isLoading}
                            <div class="space-y-4">
                                <Skeleton class="h-24 w-full" />
                                <Skeleton class="h-24 w-full" />
                            </div>
                        {:else if controller.linkedCategories.length === 0}
                            <div
                                class="border-2 border-dashed rounded-xl p-12 text-center text-muted-foreground bg-slate-50"
                            >
                                <Layers
                                    class="h-10 w-10 mx-auto mb-3 opacity-20"
                                />
                                <p>
                                    Belum ada kategori yang ditautkan ke
                                    supplier ini.
                                </p>
                            </div>
                        {:else}
                            <div class="space-y-4">
                                {#each controller.linkedCategories as cat (cat.id)}
                                    <div
                                        class="bg-card border rounded-xl overflow-hidden shadow-sm transition-all hover:border-indigo-200"
                                    >
                                        <div
                                            class="p-4 flex items-center justify-between bg-slate-50/50 border-b"
                                        >
                                            <div
                                                class="flex items-center gap-3"
                                            >
                                                <div
                                                    class="p-2 bg-indigo-100 text-indigo-600 rounded-lg"
                                                >
                                                    <Layers class="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <h4
                                                        class="font-bold text-lg"
                                                    >
                                                        {cat.name}
                                                    </h4>
                                                    <p
                                                        class="text-xs text-muted-foreground"
                                                    >
                                                        {controller.variantsMap[
                                                            cat.id
                                                        ]?.length || 0} Varian Terdaftar
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                class="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                onclick={() =>
                                                    controller.handleUnlinkCategory(
                                                        cat.id,
                                                    )}
                                            >
                                                <Trash2 class="h-4 w-4 mr-2" /> Lepas
                                            </Button>
                                        </div>

                                        <div class="p-4 bg-white">
                                            <!-- Variant List -->
                                            <div class="mt-2 space-y-3">
                                                <!-- Add Variant Input -->
                                                <div
                                                    class="flex gap-2 items-end"
                                                >
                                                    <div
                                                        class="grid gap-1.5 flex-1"
                                                    >
                                                        <Label
                                                            class="text-xs text-muted-foreground"
                                                            >Tambah Varian Baru
                                                            (Khusus Supplier
                                                            Ini)</Label
                                                        >
                                                        <Input
                                                            placeholder="Contoh: Original, Grade A..."
                                                            class="h-9"
                                                            bind:value={
                                                                controller
                                                                    .newVariantNames[
                                                                    cat.id
                                                                ]
                                                            }
                                                        />
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        class="h-9"
                                                        onclick={() =>
                                                            controller.handleAddVariant(
                                                                cat.id,
                                                            )}
                                                        disabled={controller
                                                            .addVariantMutation
                                                            .isPending}
                                                    >
                                                        <Plus
                                                            class="h-4 w-4 mr-1"
                                                        /> Tambah
                                                    </Button>
                                                </div>

                                                <div
                                                    class="flex flex-wrap gap-2 mt-4 pt-4 border-t border-dashed"
                                                >
                                                    {#if controller.variantsMap[cat.id] && controller.variantsMap[cat.id].length > 0}
                                                        {#each controller.variantsMap[cat.id] as variant}
                                                            <Badge
                                                                variant="secondary"
                                                                class="pl-2 pr-1 py-1 gap-1 flex items-center text-sm font-normal group"
                                                            >
                                                                {variant.name}
                                                                <!-- Added Delete Button -->
                                                                <button
                                                                    class="ml-1 p-0.5 rounded-full hover:bg-red-100 text-muted-foreground hover:text-red-500 transition-colors"
                                                                    onclick={(
                                                                        e,
                                                                    ) =>
                                                                        controller.handleDeleteVariant(
                                                                            e,
                                                                            Number(
                                                                                variant.id,
                                                                            ),
                                                                        )}
                                                                    title="Hapus Varian"
                                                                >
                                                                    <X
                                                                        class="h-3 w-3"
                                                                    />
                                                                </button>
                                                            </Badge>
                                                        {/each}
                                                    {:else}
                                                        <span
                                                            class="text-xs text-muted-foreground italic"
                                                            >Belum ada varian
                                                            (Menggunakan default
                                                            saja).</span
                                                        >
                                                    {/if}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    </div>
                </div>
            </TabsContent>

            <TabsContent value="history">
                <div
                    class="p-12 text-center text-muted-foreground border rounded-xl"
                >
                    Riwayat pembelian akan muncul di sini (Segera Hadir).
                </div>
            </TabsContent>
        </Tabs>
    {/if}
</div>
