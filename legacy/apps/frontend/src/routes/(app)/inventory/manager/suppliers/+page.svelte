<script lang="ts">
    import { goto } from "$app/navigation";
    import { SuppliersController } from "$lib/features/inventory/suppliers/suppliers.controller.svelte";
    import ImageUpload from "$lib/shared/components/custom/image-upload.svelte";
    import { Input } from "$lib/shared/components/ui/input";
    import { Button, buttonVariants } from "$lib/shared/components/ui/button";
    import {
        Plus,
        Pencil,
        Trash2,
        Phone,
        MapPin,
        Search,
        TrendingUp,
        Users,
        Building2,
        ExternalLink,
        Filter,
        Download,
        Mail,
        MoreVertical,
    } from "lucide-svelte";
    import { Badge } from "$lib/shared/components/ui/badge";
    import { cn } from "$lib/shared/lib/utils";
    import {
        Dialog,
        DialogContent,
        DialogDescription,
        DialogFooter,
        DialogTitle,
    } from "$lib/shared/components/ui/dialog";
    import * as DropdownMenu from "$lib/shared/components/ui/dropdown-menu";
    import * as AlertDialog from "$lib/shared/components/ui/alert-dialog";
    import { Label } from "$lib/shared/components/ui/label";
    import {
        Avatar,
        AvatarFallback,
        AvatarImage,
    } from "$lib/shared/components/ui/avatar";
    import { fly } from "svelte/transition";
    import { API_URL } from "$lib/shared/lib/api-client";

    const controller = new SuppliersController();
</script>

<div class="container mx-auto py-8 space-y-8 animate-in fade-in duration-500">
    <!-- Hero Section -->
    <section
        class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 p-8 md:p-12 shadow-2xl"
    >
        <div
            class="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10"
        ></div>
        <div
            class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"
        ></div>

        <div
            class="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
        >
            <div class="space-y-2 text-white">
                <div
                    class="inline-flex items-center rounded-full bg-white/20 backdrop-blur-md px-3 py-1 text-xs font-medium text-white ring-1 ring-inset ring-white/30"
                >
                    <Building2 class="mr-1.5 h-3.5 w-3.5" />
                    Supplier Network
                </div>
                <h1 class="text-3xl md:text-5xl font-bold tracking-tight">
                    Data Supplier
                </h1>
                <p class="text-emerald-100 max-w-xl text-lg">
                    Kelola ekosistem kemitraan dan rantai pasokan inventaris
                    Anda dengan mudah.
                </p>
            </div>
            <Button
                onclick={() => controller.openCreateDialog()}
                size="lg"
                class="bg-white text-emerald-600 hover:bg-slate-100 shadow-lg border-0 font-semibold transition-all hover:scale-105 active:scale-95"
            >
                <Plus class="h-5 w-5 mr-2" /> Supplier Baru
            </Button>
        </div>

        <!-- Stats Grid -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
            {#each [{ label: "Total Supplier", value: controller.totalSuppliers, icon: Building2, color: "text-emerald-100" }, { label: "Kontak Aktif", value: controller.activeContacts, icon: Users, color: "text-teal-100" }, { label: "Partner Terpercaya", value: controller.reliablePartners, icon: TrendingUp, color: "text-cyan-100" }, { label: "Growth", value: "+12%", icon: TrendingUp, color: "text-emerald-100" }] as stat}
                <div
                    class="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 hover:bg-white/15 transition-colors group"
                >
                    <div class="flex items-center gap-3 mb-2">
                        <div
                            class="p-2 rounded-lg bg-white/20 text-white group-hover:scale-110 transition-transform"
                        >
                            <stat.icon class="h-4 w-4" />
                        </div>
                        <span
                            class={cn(
                                "text-xs font-medium opacity-80",
                                stat.color,
                            )}>{stat.label}</span
                        >
                    </div>
                    <div class="text-2xl font-bold text-white pl-1">
                        {stat.value}
                    </div>
                </div>
            {/each}
        </div>
    </section>

    <!-- Main Content -->
    <div class="grid gap-6">
        <!-- Toolbar -->
        <div
            class="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border bg-card shadow-sm"
        >
            <div class="relative w-full sm:w-80">
                <Search
                    class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                />
                <Input
                    bind:value={controller.searchQuery}
                    placeholder="Cari nama, telepon, atau kontak..."
                    class="pl-9 bg-secondary/30 border-transparent focus:bg-background focus:border-emerald-500/50 transition-all rounded-lg"
                />
            </div>
            <div class="flex items-center gap-2">
                <Button variant="outline" size="sm" class="h-9 rounded-lg">
                    <Filter class="h-3.5 w-3.5 mr-2" /> Filter
                </Button>
                <Button variant="outline" size="sm" class="h-9 rounded-lg">
                    <Download class="h-3.5 w-3.5 mr-2" /> Export
                </Button>
            </div>
        </div>

        <!-- Grid Cards -->
        {#if controller.loading && controller.suppliers.length === 0}
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {#each Array(6) as _}
                    <div class="p-4 rounded-2xl border bg-card space-y-4">
                        <div class="flex items-center gap-4">
                            <div
                                class="h-14 w-14 rounded-xl bg-muted animate-pulse"
                            ></div>
                            <div class="flex-1 space-y-2">
                                <div
                                    class="h-4 w-2/3 bg-muted animate-pulse rounded"
                                ></div>
                                <div
                                    class="h-3 w-1/2 bg-muted animate-pulse rounded"
                                ></div>
                            </div>
                        </div>
                        <div class="pt-4 border-t space-y-2">
                            <div
                                class="h-3 w-full bg-muted animate-pulse rounded"
                            ></div>
                            <div
                                class="h-3 w-3/4 bg-muted animate-pulse rounded"
                            ></div>
                        </div>
                    </div>
                {/each}
            </div>
        {:else if controller.filteredSuppliers.length === 0}
            <div
                class="flex flex-col items-center justify-center p-20 rounded-3xl border-2 border-dashed bg-muted/5"
            >
                <div
                    class="h-20 w-20 rounded-full bg-muted/20 flex items-center justify-center mb-4"
                >
                    <Users class="h-10 w-10 text-muted-foreground opacity-20" />
                </div>
                <h3 class="text-xl font-semibold text-foreground">
                    Tidak ada supplier
                </h3>
                <p class="text-muted-foreground max-w-xs text-center mt-2">
                    Kami tidak menemukan supplier dengan kata kunci tersebut.
                    Coba cari kata kunci lain.
                </p>
            </div>
        {:else}
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {#each controller.filteredSuppliers as supplier (supplier.id)}
                    <div
                        class="group relative flex flex-col bg-card border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                        transition:fly={{ y: 20, duration: 400, delay: 100 }}
                    >
                        <!-- Card Header/Image -->
                        <div class="p-5 flex items-start gap-4">
                            <Avatar
                                class="h-14 w-14 rounded-xl border-2 border-background shadow-sm group-hover:scale-110 transition-transform duration-500"
                            >
                                <AvatarImage
                                    src={supplier.image?.startsWith("http")
                                        ? supplier.image
                                        : `${API_URL}${supplier.image}`}
                                    alt={supplier.name}
                                />
                                <AvatarFallback
                                    class="rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-bold text-lg"
                                >
                                    {controller.getInitials(supplier.name)}
                                </AvatarFallback>
                            </Avatar>
                            <div class="flex-1 min-w-0">
                                <div class="flex items-start justify-between">
                                    <h3
                                        class="font-bold text-lg leading-tight truncate group-hover:text-emerald-600 transition-colors"
                                    >
                                        {supplier.name}
                                    </h3>
                                    <DropdownMenu.Root>
                                        <DropdownMenu.Trigger
                                            class={cn(
                                                buttonVariants({
                                                    variant: "ghost",
                                                    size: "icon",
                                                }),
                                                "h-8 w-8 -mt-1 -mr-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity",
                                            )}
                                        >
                                            <MoreVertical class="h-4 w-4" />
                                        </DropdownMenu.Trigger>
                                        <DropdownMenu.Content
                                            align="end"
                                            class="w-48 rounded-xl shadow-xl"
                                        >
                                            <DropdownMenu.Item
                                                onclick={() =>
                                                    controller.handleEdit(
                                                        supplier,
                                                    )}
                                                class="rounded-lg cursor-pointer"
                                            >
                                                <Pencil class="mr-2 h-4 w-4" /> Edit
                                                Details
                                            </DropdownMenu.Item>
                                            <DropdownMenu.Separator />
                                            <DropdownMenu.Item
                                                onclick={() =>
                                                    controller.confirmDelete(
                                                        supplier.id,
                                                    )}
                                                class="text-red-600 focus:text-red-700 focus:bg-red-50 rounded-lg cursor-pointer"
                                            >
                                                <Trash2 class="mr-2 h-4 w-4" /> Hapus
                                                Supplier
                                            </DropdownMenu.Item>
                                        </DropdownMenu.Content>
                                    </DropdownMenu.Root>
                                </div>
                                <div class="flex flex-wrap gap-2 mt-2">
                                    <Badge
                                        variant="secondary"
                                        class="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 text-[10px] font-mono py-0 h-5"
                                    >
                                        ID: {supplier.id.slice(0, 8)}
                                    </Badge>
                                    {#if supplier.contact}
                                        <Badge
                                            variant="outline"
                                            class="border-emerald-200 text-emerald-600 dark:border-emerald-800 dark:text-emerald-400 text-[10px] h-5"
                                        >
                                            <Users class="h-3 w-3 mr-1" />
                                            {supplier.contact}
                                        </Badge>
                                    {/if}
                                </div>
                            </div>
                        </div>

                        <!-- Card Body -->
                        <div class="px-5 pb-5 flex-1 flex flex-col gap-3">
                            <div class="space-y-2 mt-1">
                                <div
                                    class="flex items-center gap-3 text-sm text-muted-foreground bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-100/50 dark:border-slate-800/50"
                                >
                                    <Phone
                                        class="h-4 w-4 text-emerald-500 shrink-0"
                                    />
                                    <span
                                        class="truncate font-medium text-foreground"
                                        >{supplier.phone ||
                                            "Tidak ada telepon"}</span
                                    >
                                    {#if supplier.phone}
                                        <a
                                            href={`tel:${supplier.phone}`}
                                            class="ml-auto p-1 hover:bg-emerald-100 text-emerald-600 rounded-md transition-colors"
                                        >
                                            <ExternalLink class="h-3 w-3" />
                                        </a>
                                    {/if}
                                </div>
                                {#if supplier.address}
                                    <div
                                        class="flex items-start gap-3 text-sm text-muted-foreground p-2"
                                    >
                                        <MapPin
                                            class="h-4 w-4 text-emerald-500 shrink-0 mt-0.5"
                                        />
                                        <span
                                            class="line-clamp-2 text-xs leading-relaxed"
                                            >{supplier.address}</span
                                        >
                                    </div>
                                {/if}
                            </div>
                        </div>

                        <!-- Card footer / Quick Action -->
                        <div
                            class="px-5 py-3 bg-muted/30 border-t flex items-center justify-between"
                        >
                            <span
                                class="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold"
                                >Quick Actions</span
                            >
                            <div class="flex gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    class="h-8 w-8 text-emerald-600 hover:bg-emerald-50"
                                    title="Contact Email"
                                >
                                    <Mail class="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    class="h-8 w-8 text-indigo-600 hover:bg-indigo-50"
                                    onclick={() =>
                                        goto(`/suppliers/${supplier.id}`)}
                                    title="Manage Supplier"
                                >
                                    <Pencil class="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    </div>

    <!-- Dialog Create/Edit -->
    <Dialog
        bind:open={controller.openSupplier}
        onOpenChange={(o) => !o && controller.resetForm()}
    >
        <DialogContent
            class="sm:max-w-[550px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl"
        >
            <div
                class="bg-gradient-to-r from-emerald-600 to-teal-600 p-8 text-white"
            >
                <DialogTitle class="text-2xl font-bold">
                    {controller.editingId
                        ? "Edit Supplier"
                        : "Tambah Supplier Baru"}
                </DialogTitle>
                <p class="text-emerald-100 mt-1">
                    Silakan isi informasi lengkap mengenai mitra supplier Anda.
                </p>
            </div>

            <div class="p-8 space-y-6 bg-background">
                <div class="flex justify-center -mt-20 relative z-10">
                    <div class="relative">
                        <ImageUpload
                            bind:value={controller.image}
                            disabled={controller.isSaving}
                            class="h-32 w-32 rounded-3xl border-4 border-background shadow-xl bg-slate-50"
                        />
                    </div>
                </div>

                <div class="grid gap-5">
                    <div class="grid gap-2">
                        <Label
                            for="name"
                            class="text-sm font-semibold flex items-center gap-2"
                        >
                            <Building2 class="h-4 w-4 text-emerald-500" /> Nama PT/Toko
                            <span class="text-red-500">*</span>
                        </Label>
                        <Input
                            id="name"
                            bind:value={controller.name}
                            placeholder="PT. Sinar Jaya Abadi"
                            class="h-11 rounded-xl"
                        />
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="grid gap-2">
                            <Label
                                for="contact"
                                class="text-sm font-semibold flex items-center gap-2"
                            >
                                <Users class="h-4 w-4 text-emerald-500" /> Kontak
                                Sales
                            </Label>
                            <Input
                                id="contact"
                                bind:value={controller.contact}
                                placeholder="Budi Santoso"
                                class="h-11 rounded-xl"
                            />
                        </div>
                        <div class="grid gap-2">
                            <Label
                                for="phone"
                                class="text-sm font-semibold flex items-center gap-2"
                            >
                                <Phone class="h-4 w-4 text-emerald-500" /> WhatsApp/Telp
                            </Label>
                            <Input
                                id="phone"
                                bind:value={controller.phone}
                                placeholder="08123456789"
                                class="h-11 rounded-xl"
                            />
                        </div>
                    </div>

                    <div class="grid gap-2">
                        <Label
                            for="address"
                            class="text-sm font-semibold flex items-center gap-2"
                        >
                            <MapPin class="h-4 w-4 text-emerald-500" /> Alamat Kantor
                        </Label>
                        <Input
                            id="address"
                            bind:value={controller.address}
                            placeholder="Jl. Teknisi No. 123, Jakarta"
                            class="h-11 rounded-xl"
                        />
                    </div>
                </div>
            </div>

            <DialogFooter class="px-8 pb-8 pt-0 bg-background">
                <Button
                    variant="ghost"
                    class="h-11 px-6 rounded-xl"
                    onclick={() => controller.closeDialog()}>Batal</Button
                >
                <Button
                    class="h-11 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20"
                    onclick={() => controller.handleSaveSupplier()}
                    disabled={controller.isSaving}
                >
                    {controller.isSaving
                        ? "Menyimpan..."
                        : controller.editingId
                          ? "Simpan Perubahan"
                          : "Simpan Supplier"}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>

    <!-- Delete Alert -->
    <AlertDialog.Root bind:open={controller.openDelete}>
        <AlertDialog.Content
            class="rounded-3xl border-none shadow-2xl p-0 overflow-hidden max-w-md bg-background"
        >
            <div
                class="bg-red-50 dark:bg-red-950/20 p-8 flex flex-col items-center text-center gap-4"
            >
                <div
                    class="h-20 w-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 animate-bounce"
                >
                    <Trash2 class="h-10 w-10" />
                </div>
                <div>
                    <h3
                        class="text-2xl font-bold text-red-700 dark:text-red-500"
                    >
                        Hapus Supplier?
                    </h3>
                    <p
                        class="text-sm text-red-600/80 dark:text-red-400/80 mt-1 font-medium"
                    >
                        Tindakan ini permanen dan tidak dapat dibatalkan.
                    </p>
                </div>
            </div>
            <div class="p-8 pt-4">
                <p class="text-muted-foreground text-center leading-relaxed">
                    Menghapus <span class="font-bold text-foreground"
                        >Supplier</span
                    > akan menghilangkan seluruh data kemitraan dan riwayat terkait.
                </p>
                <div class="flex gap-3 mt-8">
                    <AlertDialog.Cancel
                        class="flex-1 h-12 rounded-2xl border-slate-200"
                        >Batal</AlertDialog.Cancel
                    >
                    <AlertDialog.Action
                        onclick={() => controller.handleDeleteSupplier()}
                        class="flex-1 h-12 rounded-2xl bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20"
                    >
                        Ya, Hapus
                    </AlertDialog.Action>
                </div>
            </div>
        </AlertDialog.Content>
    </AlertDialog.Root>
</div>

<style>
    :global(.lucide) {
        stroke-width: 2px;
    }
</style>
