<script lang="ts">
    import { Input } from "$lib/shared/components/ui/input";
    import { Button, buttonVariants } from "$lib/shared/components/ui/button";
    import {
        Plus,
        Pencil,
        Trash2,
        Phone,
        MapPin,
        Wallet,
        CreditCard,
        ArrowRight,
        Search,
        User,
        Users,
        Filter,
        Download,
        MoreVertical,
        PhoneCall,
        Receipt,
    } from "lucide-svelte";
    import * as AlertDialog from "$lib/shared/components/ui/alert-dialog";
    import * as DropdownMenu from "$lib/shared/components/ui/dropdown-menu";
    import { Avatar, AvatarFallback } from "$lib/shared/components/ui/avatar";
    import { Badge } from "$lib/shared/components/ui/badge";
    import { formatCurrency, cn } from "$lib/shared/lib/utils";
    import { fly } from "svelte/transition";
    import { CustomersController } from "$lib/features/sales/components/customers/customers.controller.svelte";
    import CustomerForm from "$lib/features/sales/components/customers/components/customer-form.svelte";

    const controller = new CustomersController();
</script>

<div class="container mx-auto py-8 space-y-8 animate-in fade-in duration-500">
    <!-- Hero Section -->
    <section
        class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-indigo-600 to-violet-700 p-8 md:p-12 shadow-2xl"
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
                    <Users class="mr-1.5 h-3.5 w-3.5" />
                    Customer Portfolio
                </div>
                <h1 class="text-3xl md:text-5xl font-bold tracking-tight">
                    Manajemen Pelanggan
                </h1>
                <p class="text-blue-100 max-w-xl text-lg">
                    Kelola data pelanggan, pantau tagihan, dan atur limit kredit
                    untuk memperlancar arus kas bisnis Anda.
                </p>
            </div>
            <Button
                onclick={() => {
                    controller.resetForm();
                    controller.openDialog = true;
                }}
                size="lg"
                class="bg-white text-blue-700 hover:bg-slate-100 shadow-lg border-0 font-semibold transition-all hover:scale-105 active:scale-95"
            >
                <Plus class="h-5 w-5 mr-2" /> Pelanggan Baru
            </Button>
        </div>

        <!-- Stats Grid -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
            {#each [{ label: "Total Pelanggan", value: controller.totalCustomers, icon: Users, color: "text-blue-100" }, { label: "Piutang Aktif", value: controller.activeReceivables, icon: Wallet, color: "text-indigo-100" }, { label: "Total Piutang", value: formatCurrency(controller.totalDebt), icon: Receipt, color: "text-violet-100" }, { label: "Total Limit", value: formatCurrency(controller.totalLimit), icon: CreditCard, color: "text-blue-100" }] as stat}
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
                    <div
                        class="text-xl font-bold text-white pl-1 truncate"
                        title={String(stat.value)}
                    >
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
                    placeholder="Cari nama atau telepon..."
                    class="pl-9 bg-secondary/30 border-transparent focus:bg-background focus:border-blue-500/50 transition-all rounded-lg"
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
        {#if controller.loading && controller.customers.length === 0}
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {#each Array(6) as _}
                    <div class="p-5 rounded-2xl border bg-card space-y-4">
                        <div class="flex items-center gap-4">
                            <div
                                class="h-12 w-12 rounded-full bg-muted animate-pulse"
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
                        <div class="pt-4 border-t space-y-3">
                            <div
                                class="h-10 w-full bg-muted animate-pulse rounded-lg"
                            ></div>
                            <div
                                class="h-8 w-full bg-muted animate-pulse rounded-lg"
                            ></div>
                        </div>
                    </div>
                {/each}
            </div>
        {:else if controller.filteredCustomers.length === 0}
            <div
                class="flex flex-col items-center justify-center p-20 rounded-3xl border-2 border-dashed bg-muted/5"
            >
                <div
                    class="h-20 w-20 rounded-full bg-muted/20 flex items-center justify-center mb-4 text-blue-500"
                >
                    <User class="h-10 w-10 opacity-20" />
                </div>
                <h3 class="text-xl font-semibold text-foreground">
                    Tidak ada pelanggan
                </h3>
                <p class="text-muted-foreground max-w-xs text-center mt-2">
                    Kami tidak menemukan pelanggan dengan kriteria tersebut.
                </p>
                <Button
                    variant="link"
                    onclick={() => (controller.searchQuery = "")}
                    class="mt-2">Bersihkan Pencarian</Button
                >
            </div>
        {:else}
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {#each controller.filteredCustomers as cust (cust.id)}
                    <div
                        class="group relative flex flex-col bg-card border border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                        transition:fly={{ y: 20, duration: 400 }}
                    >
                        <div class="p-6">
                            <div class="flex items-start justify-between mb-4">
                                <Avatar
                                    class="h-12 w-12 border-2 border-background shadow-sm ring-2 ring-blue-50 dark:ring-blue-900/20 group-hover:scale-110 transition-transform duration-500"
                                >
                                    <AvatarFallback
                                        class="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-bold"
                                    >
                                        {controller.getInitials(cust.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <DropdownMenu.Root>
                                    <DropdownMenu.Trigger
                                        class={cn(
                                            buttonVariants({
                                                variant: "ghost",
                                                size: "icon",
                                            }),
                                            "h-8 w-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800",
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
                                                controller.handleEdit(cust)}
                                            class="rounded-lg cursor-pointer"
                                        >
                                            <Pencil class="mr-2 h-4 w-4" /> Edit
                                            Data
                                        </DropdownMenu.Item>
                                        <DropdownMenu.Separator />
                                        <DropdownMenu.Item
                                            onclick={() =>
                                                controller.confirmDelete(
                                                    cust.id,
                                                )}
                                            class="text-red-600 focus:text-red-700 focus:bg-red-50 rounded-lg cursor-pointer"
                                        >
                                            <Trash2 class="mr-2 h-4 w-4" /> Hapus
                                            Pelanggan
                                        </DropdownMenu.Item>
                                    </DropdownMenu.Content>
                                </DropdownMenu.Root>
                            </div>

                            <div class="space-y-1">
                                <a
                                    href={`/customers/${cust.id}`}
                                    class="text-lg font-bold hover:text-blue-600 transition-colors block leading-tight truncate"
                                >
                                    {cust.name}
                                </a>
                                <div
                                    class="flex items-center gap-2 text-sm text-muted-foreground group/phone"
                                >
                                    <Phone
                                        class="h-3.5 w-3.5 text-blue-500/70"
                                    />
                                    <span class="truncate">{cust.phone}</span>
                                    <a
                                        href={`tel:${cust.phone}`}
                                        class="opacity-0 group-hover/phone:opacity-100 transition-opacity p-1 hover:bg-blue-50 rounded text-blue-600"
                                    >
                                        <PhoneCall class="h-3 w-3" />
                                    </a>
                                </div>
                            </div>

                            {#if cust.address}
                                <div
                                    class="mt-3 flex items-start gap-2 text-xs text-muted-foreground line-clamp-1"
                                >
                                    <MapPin
                                        class="h-3.5 w-3.5 text-blue-500/50 shrink-0 mt-0.5"
                                    />
                                    <span>{cust.address}</span>
                                </div>
                            {/if}

                            <div class="mt-6 grid grid-cols-2 gap-3">
                                <div
                                    class="bg-red-50/50 dark:bg-red-950/10 p-3 rounded-xl border border-red-100/50 dark:border-red-900/20"
                                >
                                    <span
                                        class="text-[10px] font-bold text-red-500 uppercase tracking-widest block mb-1"
                                        >Tagihan</span
                                    >
                                    <span
                                        class="text-sm font-bold text-red-700 dark:text-red-400"
                                        >{formatCurrency(cust.debt || 0)}</span
                                    >
                                </div>
                                <div
                                    class="bg-emerald-50/50 dark:bg-emerald-950/10 p-3 rounded-xl border border-emerald-100/50 dark:border-emerald-900/20"
                                >
                                    <span
                                        class="text-[10px] font-bold text-emerald-500 uppercase tracking-widest block mb-1"
                                        >Limit</span
                                    >
                                    <span
                                        class="text-sm font-bold text-emerald-700 dark:text-emerald-400"
                                        >{formatCurrency(
                                            cust.creditLimit || 0,
                                        )}</span
                                    >
                                </div>
                            </div>
                        </div>

                        <div
                            class="px-6 py-4 bg-muted/30 border-t mt-auto flex items-center justify-between"
                        >
                            <Badge
                                variant="outline"
                                class="bg-background text-[10px] h-5 py-0"
                                >ID: {cust.id.slice(0, 8)}</Badge
                            >
                            <Button
                                variant="ghost"
                                size="sm"
                                href={`/customers/${cust.id}`}
                                class="h-8 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-lg group/btn"
                            >
                                Lihat Detail <ArrowRight
                                    class="ml-1 h-3 w-3 group-hover/btn:translate-x-1 transition-transform"
                                />
                            </Button>
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    </div>

    <!-- Dialog Create/Edit -->
    <CustomerForm {controller} />

    <!-- Delete Alert -->
    <AlertDialog.Root bind:open={controller.openDelete}>
        <AlertDialog.Content
            class="rounded-3xl border-none shadow-2xl p-0 overflow-hidden max-w-sm bg-background"
        >
            <div
                class="bg-red-50 dark:bg-red-950/20 p-8 flex flex-col items-center text-center gap-4"
            >
                <div
                    class="h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600"
                >
                    <Trash2 class="h-8 w-8" />
                </div>
                <div>
                    <h3
                        class="text-xl font-bold text-red-700 dark:text-red-500"
                    >
                        Hapus Pelanggan?
                    </h3>
                    <p class="text-sm text-red-600/80 mt-1 font-medium">
                        Data ini akan hilang secara permanen.
                    </p>
                </div>
            </div>
            <div class="p-8 pt-0 flex gap-3">
                <AlertDialog.Cancel
                    class="flex-1 h-11 rounded-xl border-slate-200"
                    >Batal</AlertDialog.Cancel
                >
                <AlertDialog.Action
                    onclick={() => controller.handleDelete()}
                    class="flex-1 h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20"
                >
                    Hapus
                </AlertDialog.Action>
            </div>
        </AlertDialog.Content>
    </AlertDialog.Root>
</div>

<style>
    :global(.lucide) {
        stroke-width: 2px;
    }
</style>
