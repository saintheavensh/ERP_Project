<script lang="ts">
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
    } from "$lib/shared/components/ui/card";
    import { Button } from "$lib/shared/components/ui/button";
    import {
        ShoppingCart,
        Search,
        User,
        Wrench,
        History,
        Lock,
        Unlock,
        Banknote,
        LogOut,
        ArrowRight,
        Clock,
        AlertCircle,
    } from "lucide-svelte";
    import { authStore } from "$lib/shared/lib/auth-store.svelte";
    import {
        CashRegisterService,
        type CashRegisterStatus,
    } from "$lib/features/accounting/services/cash-register.service";
    import OpenRegisterModal from "$lib/features/accounting/components/OpenRegisterModal.svelte";
    import CloseRegisterModal from "$lib/features/accounting/components/CloseRegisterModal.svelte";
    import ExpenseModal from "$lib/features/accounting/components/ExpenseModal.svelte";
    import { onMount } from "svelte";
    import { toast } from "svelte-sonner";
    import { fly, fade } from "svelte/transition";

    import QuickServiceModal from "$lib/features/services/service/components/QuickServiceModal.svelte";

    const user = $derived(authStore.user);

    let registerStatus = $state<CashRegisterStatus | null>(null);
    let loading = $state(true);

    let showOpenModal = $state(false);
    let showCloseModal = $state(false);
    let showExpenseModal = $state(false);
    let showQuickServiceModal = $state(false);

    async function loadStatus() {
        loading = true;
        try {
            registerStatus = await CashRegisterService.getStatus();
        } catch (e) {
            console.error(e);
            toast.error("Failed to load register status");
        } finally {
            loading = false;
        }
    }

    onMount(() => {
        loadStatus();
    });

    const isOpen = $derived(registerStatus?.isOpen || false);

    function formatCurrency(amount: number) {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(amount);
    }

    function formatTime(dateStr: string) {
        return new Date(dateStr).toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
        });
    }
</script>

<div class="min-h-[calc(100vh-4rem)] flex flex-col gap-6 relative">
    {#if !loading && !isOpen}
        <!-- Closed State - Exclusive View -->
        <div
            class="flex-1 flex flex-col items-center justify-center min-h-[60vh] text-center p-6 animate-in fade-in duration-500"
        >
            <div
                class="absolute inset-0 bg-grid-slate-200/50 dark:bg-grid-slate-800/20 [mask-image:radial-gradient(ellipse_at_center,black,transparent)] pointer-events-none"
            ></div>

            <div
                class="relative bg-card/50 backdrop-blur-xl border shadow-2xl rounded-3xl p-12 max-w-lg w-full flex flex-col items-center gap-6"
            >
                <div
                    class="h-24 w-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg flex items-center justify-center mb-2 transform rotate-3 hover:rotate-6 transition-transform"
                >
                    <Lock class="h-10 w-10 text-white" />
                </div>

                <div class="space-y-2">
                    <h2
                        class="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600"
                    >
                        Register Closed
                    </h2>
                    <p
                        class="text-muted-foreground text-lg leading-relaxed max-w-sm mx-auto"
                    >
                        Sesi kasir belum dibuka. Silakan buka register untuk
                        memulai transaksi hari ini.
                    </p>
                </div>

                <Button
                    size="lg"
                    class="w-full max-w-xs h-12 text-lg font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                    onclick={() => (showOpenModal = true)}
                >
                    <Unlock class="mr-2 h-5 w-5" />
                    Buka Register
                </Button>
            </div>
        </div>
    {:else}
        <!-- Dashboard Header -->
        <div
            class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4"
        >
            <div class="flex items-center gap-4">
                <div
                    class="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center"
                >
                    <User class="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h1 class="text-2xl font-bold tracking-tight">
                        Kasir Point of Sale
                    </h1>
                    <p class="text-sm text-muted-foreground">
                        Operator: <span class="font-medium text-foreground"
                            >{user?.name || "Unknown"}</span
                        >
                    </p>
                </div>
            </div>

            <div class="flex items-center gap-3">
                <div
                    class="flex flex-col items-end mr-2 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-md border border-green-100 dark:border-green-800"
                >
                    <span
                        class="text-[10px] uppercase font-bold text-green-600 dark:text-green-400 tracking-wider"
                        >Session Status</span
                    >
                    <span
                        class="font-bold text-green-700 dark:text-green-300 flex items-center gap-1"
                    >
                        <span
                            class="h-2 w-2 rounded-full bg-green-500 animate-pulse"
                        ></span>
                        ACTIVE
                    </span>
                </div>
                <Button
                    variant="destructive"
                    size="sm"
                    onclick={() => (showCloseModal = true)}
                    class="gap-2 h-10 px-4"
                >
                    <LogOut class="h-4 w-4" />
                    Tutup Sesi
                </Button>
            </div>
        </div>

        <!-- Top Stats Row -->
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card
                class="bg-gradient-to-br from-blue-600 to-blue-700 text-white border-none shadow-md"
            >
                <CardHeader
                    class="flex flex-row items-center justify-between space-y-0 pb-2"
                >
                    <CardTitle class="text-sm font-medium text-blue-100"
                        >Total Penjualan</CardTitle
                    >
                    <ShoppingCart class="h-4 w-4 text-blue-100" />
                </CardHeader>
                <CardContent>
                    <div class="text-2xl font-bold">
                        {formatCurrency(registerStatus?.totalSales || 0)}
                    </div>
                    <p class="text-xs text-blue-200 mt-1">
                        {registerStatus?.transactionCount || 0} Transactions today
                    </p>
                </CardContent>
            </Card>

            <Card class="bg-card">
                <CardHeader
                    class="flex flex-row items-center justify-between space-y-0 pb-2"
                >
                    <CardTitle class="text-sm font-medium text-muted-foreground"
                        >Uang di Laci (Est)</CardTitle
                    >
                    <Banknote class="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div class="text-2xl font-bold text-foreground">
                        {formatCurrency(registerStatus?.expectedClosing || 0)}
                    </div>
                    <p class="text-xs text-muted-foreground mt-1">
                        Opening: {formatCurrency(
                            registerStatus?.openingBalance || 0,
                        )}
                    </p>
                </CardContent>
            </Card>

            <Card class="bg-card">
                <CardHeader
                    class="flex flex-row items-center justify-between space-y-0 pb-2"
                >
                    <CardTitle class="text-sm font-medium text-muted-foreground"
                        >Service Ready</CardTitle
                    >
                    <Wrench class="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                    <div class="text-2xl font-bold text-foreground">
                        {registerStatus?.totalServices || 0}
                    </div>
                    <p class="text-xs text-muted-foreground mt-1">
                        Siap diambil
                    </p>
                </CardContent>
            </Card>

            <Card class="bg-card">
                <CardHeader
                    class="flex flex-row items-center justify-between space-y-0 pb-2"
                >
                    <CardTitle class="text-sm font-medium text-muted-foreground"
                        >Pengeluaran</CardTitle
                    >
                    <ArrowRight class="h-4 w-4 text-red-500 rotate-45" />
                </CardHeader>
                <CardContent>
                    <div class="text-2xl font-bold text-red-600">
                        - {formatCurrency(registerStatus?.totalExpenses || 0)}
                    </div>
                    <p class="text-xs text-muted-foreground mt-1">
                        Tunai dari register
                    </p>
                </CardContent>
            </Card>
        </div>

        <!-- Main Workspace -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full grow">
            <!-- Left Column: Quick Actions -->
            <div class="lg:col-span-2 space-y-4">
                <h3 class="text-lg font-semibold flex items-center gap-2">
                    <Clock class="h-4 w-4" /> Quick Actions
                </h3>

                <div
                    class="grid grid-cols-2 md:grid-cols-3 gap-4 auto-rows-[100px]"
                >
                    <!-- Primary Action: New Sale -->
                    <Button
                        href="/sales"
                        class="col-span-2 row-span-2 h-full flex flex-col items-center justify-center gap-3 text-lg bg-blue-600 hover:bg-blue-700 shadow-sm"
                    >
                        <ShoppingCart class="h-8 w-8" />
                        <span class="font-bold">Transaksi Baru</span>
                    </Button>

                    <!-- Service Pickup -->
                    <Button
                        href="/service"
                        variant="outline"
                        class="h-full flex flex-col items-center justify-center gap-2 border-green-200 bg-green-50 hover:bg-green-100 dark:bg-green-900/10 dark:hover:bg-green-900/20 dark:border-green-800"
                    >
                        <Wrench
                            class="h-6 w-6 text-green-600 dark:text-green-400"
                        />
                        <span
                            class="text-green-700 dark:text-green-300 font-medium"
                            >Ambil Service</span
                        >
                    </Button>

                    <!-- Quick Service -->
                    <Button
                        onclick={() => (showQuickServiceModal = true)}
                        variant="outline"
                        class="h-full flex flex-col items-center justify-center gap-2 border-orange-200 bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/10 dark:hover:bg-orange-900/20 dark:border-orange-800"
                    >
                        <AlertCircle
                            class="h-6 w-6 text-orange-600 dark:text-orange-400"
                        />
                        <span
                            class="text-orange-700 dark:text-orange-300 font-medium"
                            >Service Masuk</span
                        >
                    </Button>

                    <!-- Inventory Check -->
                    <Button
                        href="/inventory"
                        variant="outline"
                        class="h-full flex flex-col items-center justify-center gap-2"
                    >
                        <Search class="h-6 w-6" />
                        <span>Cari Stok</span>
                    </Button>

                    <!-- Expense -->
                    <Button
                        onclick={() => (showExpenseModal = true)}
                        variant="outline"
                        class="h-full flex flex-col items-center justify-center gap-2 border-red-200 bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/20 dark:border-red-800"
                    >
                        <Banknote
                            class="h-6 w-6 text-red-600 dark:text-red-400"
                        />
                        <span class="text-red-700 dark:text-red-300 font-medium"
                            >Catat Pengeluaran</span
                        >
                    </Button>

                    <!-- History -->
                    <Button
                        href="#"
                        variant="ghost"
                        class="h-full flex flex-col items-center justify-center gap-2"
                    >
                        <History class="h-6 w-6 text-muted-foreground" />
                        <span class="text-muted-foreground">Riwayat</span>
                    </Button>
                </div>
            </div>

            <!-- Right Column: Recent Activity Feed -->
            <div class="lg:col-span-1">
                <Card
                    class="h-full border-none shadow-sm bg-slate-50 dark:bg-slate-900/50"
                >
                    <CardHeader class="pb-3 border-b">
                        <CardTitle
                            class="text-base flex items-center justify-between"
                        >
                            <span>Recent Activity</span>
                            <span
                                class="text-xs font-normal text-muted-foreground"
                                >Live Feed</span
                            >
                        </CardTitle>
                    </CardHeader>
                    <CardContent class="p-0 overflow-y-auto max-h-[500px]">
                        {#if registerStatus?.recentTransactions && registerStatus.recentTransactions.length > 0}
                            <div class="divide-y">
                                {#each registerStatus.recentTransactions as tx}
                                    <div
                                        class="p-3 hover:bg-background/50 transition-colors flex items-center justify-between"
                                    >
                                        <div
                                            class="flex items-start gap-3 overflow-hidden"
                                        >
                                            <div
                                                class={`mt-1 h-2 w-2 rounded-full shrink-0 ${tx.amount > 0 ? "bg-green-500" : "bg-red-500"}`}
                                            ></div>
                                            <div class="min-w-0">
                                                <p
                                                    class="text-sm font-medium truncate"
                                                >
                                                    {tx.description ||
                                                        tx.transactionType}
                                                </p>
                                                <p
                                                    class="text-xs text-muted-foreground"
                                                >
                                                    {formatTime(tx.createdAt)} •
                                                    {tx.paymentMethod}
                                                </p>
                                            </div>
                                        </div>
                                        <span
                                            class={`text-sm font-bold whitespace-nowrap ${tx.amount > 0 ? "text-green-600" : "text-red-600"}`}
                                        >
                                            {tx.amount > 0
                                                ? "+"
                                                : ""}{formatCurrency(tx.amount)}
                                        </span>
                                    </div>
                                {/each}
                            </div>
                        {:else}
                            <div
                                class="p-8 text-center text-muted-foreground text-sm"
                            >
                                <History
                                    class="h-8 w-8 mx-auto mb-2 opacity-50"
                                />
                                <p>Belum ada transaksi di sesi ini.</p>
                            </div>
                        {/if}
                    </CardContent>
                </Card>
            </div>
        </div>
    {/if}
</div>

<OpenRegisterModal bind:open={showOpenModal} onSuccess={loadStatus} />
<CloseRegisterModal
    bind:open={showCloseModal}
    expectedClosing={registerStatus?.expectedClosing || 0}
    onSuccess={loadStatus}
/>
<ExpenseModal bind:open={showExpenseModal} onSuccess={loadStatus} />
<QuickServiceModal bind:open={showQuickServiceModal} onSuccess={loadStatus} />
