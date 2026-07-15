<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import { CustomersService } from "$lib/features/sales/components/customers/customers.service";
    import {
        PaymentMethodsService,
        type PaymentMethod,
    } from "$lib/features/settings/settings.service";
    import { formatCurrency, cn } from "$lib/shared/lib/utils";
    import { Button, buttonVariants } from "$lib/shared/components/ui/button";
    import {
        Tabs,
        TabsContent,
        TabsList,
        TabsTrigger,
    } from "$lib/shared/components/ui/tabs";
    import { Badge } from "$lib/shared/components/ui/badge";
    import {
        ArrowLeft,
        Wallet,
        Upload,
        Calendar,
        FileText,
        ArrowRight,
        Receipt,
        CreditCard,
        User,
        Phone,
        MapPin,
        Clock,
        CheckCircle2,
        AlertCircle,
        ExternalLink,
        DollarSign,
        Banknote,
        Download,
        TrendingUp,
    } from "lucide-svelte";
    import {
        Dialog,
        DialogContent,
        DialogDescription,
        DialogFooter,
        DialogHeader,
        DialogTitle,
    } from "$lib/shared/components/ui/dialog";
    import { Input } from "$lib/shared/components/ui/input";
    import { Label } from "$lib/shared/components/ui/label";
    import { Separator } from "$lib/shared/components/ui/separator";
    import {
        Avatar,
        AvatarFallback,
        AvatarImage,
    } from "$lib/shared/components/ui/avatar";
    import CurrencyInput from "$lib/shared/components/custom/currency-input.svelte";
    import { toast } from "svelte-sonner";
    import { fade, fly, scale } from "svelte/transition";

    let customer = $state<any>(null);
    let sales = $state<any[]>([]);
    let unpaidSales = $state<any[]>([]);
    let loading = $state(true);

    // Payment State
    let openPaymentDialog = $state(false);
    let selectedSale = $state<any>(null);
    let paymentAmount = $state(0);
    let paymentMethod = $state<"cash" | "transfer" | "qris">("cash");
    let selectedBank = $state("");
    let paymentNotes = $state("");
    let proofFile = $state<File | null>(null);
    let paying = $state(false);

    // Bank options from settings
    let paymentMethods = $state<PaymentMethod[]>([]);
    let transferMethod = $derived(
        paymentMethods.find((m) => m.type === "transfer"),
    );
    let bankOptions = $derived(
        transferMethod?.variants
            ?.filter((v) => v.enabled)
            ?.map((v) => ({
                value: v.id,
                label: `${v.name}${v.accountNumber ? " - " + v.accountNumber : ""}`,
            })) || [],
    );

    async function loadData() {
        const id = $page.params.id;
        if (!id) return;

        loading = true;
        try {
            const [custData, salesData, unpaidData, paymentMethodsData] =
                await Promise.all([
                    CustomersService.getById(id),
                    CustomersService.getSales(id),
                    CustomersService.getUnpaidSales(id),
                    PaymentMethodsService.getEnabled(),
                ]);
            customer = custData;
            paymentMethods = paymentMethodsData;
            sales = salesData;
            unpaidSales = unpaidData;
        } catch (e) {
            console.error(e);
            toast.error("Gagal memuat data pelanggan");
        } finally {
            loading = false;
        }
    }

    onMount(() => {
        loadData();
    });

    function formatDate(dateStr: string) {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    function openPayment(sale: any) {
        selectedSale = sale;
        // Calculate remaining amount from payments
        const paidAmount = (sale.payments || [])
            .filter((p: any) => p.method !== "tempo")
            .reduce((sum: number, p: any) => sum + p.amount, 0);
        const remaining = sale.finalAmount - paidAmount;
        paymentAmount = remaining > 0 ? remaining : 0;
        paymentMethod = "cash";
        selectedBank = "";
        paymentNotes = "";
        proofFile = null;
        openPaymentDialog = true;
    }

    async function handlePayment() {
        if (!customer) return;
        if (paymentAmount <= 0) return toast.error("Nominal harus > 0");

        paying = true;
        try {
            let proofUrl = undefined;
            if (proofFile) {
                try {
                    proofUrl = await CustomersService.uploadProof(proofFile);
                } catch (e) {
                    console.error("Upload failed", e);
                    toast.error(
                        "Gagal upload bukti transfer. Melanjutkan tanpa bukti.",
                    );
                }
            }

            const notes =
                paymentMethod === "transfer" && selectedBank
                    ? `${selectedBank.toUpperCase()}${paymentNotes ? " - " + paymentNotes : ""}`
                    : paymentNotes;

            await CustomersService.payDebt(
                customer.id,
                paymentAmount,
                paymentMethod,
                notes,
                selectedSale?.id,
                proofUrl,
            );

            toast.success("Pembayaran berhasil!");
            openPaymentDialog = false;
            loadData();
        } catch (e: any) {
            toast.error(
                e.response?.data?.message || "Gagal memproses pembayaran",
            );
        } finally {
            paying = false;
        }
    }

    function handleFileChange(e: Event) {
        const input = e.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            proofFile = input.files[0];
        }
    }

    function getInitials(name: string) {
        if (!name) return "??";
        return name
            .split(" ")
            .map((n) => n[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();
    }
</script>

<div class="container mx-auto py-8 space-y-8 animate-in fade-in duration-500">
    <!-- Header/Hero -->
    <section
        class="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-700 via-indigo-600 to-violet-700 p-8 md:p-12 shadow-2xl"
    >
        <div
            class="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10"
        ></div>
        <div
            class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"
        ></div>

        <div class="relative z-10">
            <Button
                variant="ghost"
                href="/customers"
                class="mb-8 text-white hover:bg-white/10 rounded-xl group transition-all"
            >
                <ArrowLeft
                    class="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform"
                />
                Kembali ke Daftar
            </Button>

            <div
                class="flex flex-col md:flex-row items-start md:items-center justify-between gap-8"
            >
                <div class="flex items-center gap-6">
                    <Avatar
                        class="h-20 w-20 md:h-24 md:w-24 border-4 border-white/20 shadow-2xl group animate-in zoom-in duration-500"
                    >
                        <AvatarFallback
                            class="bg-white/10 backdrop-blur-xl text-white text-3xl font-bold"
                        >
                            {customer ? getInitials(customer.name) : "..."}
                        </AvatarFallback>
                    </Avatar>
                    <div class="space-y-1 text-white">
                        <div
                            class="inline-flex items-center rounded-full bg-white/20 backdrop-blur-md px-3 py-1 text-xs font-semibold text-white ring-1 ring-inset ring-white/30 mb-2"
                        >
                            <Badge
                                variant="outline"
                                class="border-none p-0 text-white h-auto leading-none"
                                >ID: {customer?.id || "..."}</Badge
                            >
                        </div>
                        <h1
                            class="text-3xl md:text-5xl font-bold tracking-tight"
                        >
                            {customer ? customer.name : "Memuat..."}
                        </h1>
                        {#if customer}
                            <div
                                class="flex flex-wrap items-center gap-4 text-blue-100 text-sm md:text-base opacity-90"
                            >
                                <span class="flex items-center gap-1.5"
                                    ><Phone class="h-4 w-4" />
                                    {customer.phone}</span
                                >
                                {#if customer.address}
                                    <span class="flex items-center gap-1.5"
                                        ><MapPin class="h-4 w-4" />
                                        {customer.address}</span
                                    >
                                {/if}
                            </div>
                        {/if}
                    </div>
                </div>

                {#if customer}
                    <div class="flex gap-3 w-full md:w-auto">
                        <Button
                            variant="secondary"
                            class="flex-1 md:flex-none bg-white/10 hover:bg-white/20 border-white/20 text-white backdrop-blur-xl rounded-2xl h-12 px-6"
                        >
                            <ExternalLink class="h-4 w-4 mr-2" /> Share Details
                        </Button>
                        <Button
                            size="lg"
                            class="flex-1 md:flex-none bg-white text-blue-700 hover:bg-slate-50 transition-all hover:scale-105 active:scale-95 rounded-2xl h-12 px-8 font-bold shadow-xl shadow-black/20"
                        >
                            Edit Profile
                        </Button>
                    </div>
                {/if}
            </div>

            <!-- Dashboard Stats -->
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-12">
                {#each [{ label: "Total Hutang", value: formatCurrency(customer?.debt || 0), icon: Wallet, color: "bg-red-500/20 text-red-200", trend: "Outstanding" }, { label: "Limit Kredit", value: formatCurrency(customer?.creditLimit || 0), icon: CreditCard, color: "bg-emerald-500/20 text-emerald-200", trend: "Available" }, { label: "Total Transaksi", value: sales.length, icon: Receipt, color: "bg-indigo-500/20 text-indigo-200", trend: "Lifetime" }, { label: "Credit Used", value: customer?.creditLimit ? `${Math.round(((customer?.debt || 0) / customer.creditLimit) * 100)}%` : "0%", icon: TrendingUp, color: "bg-amber-500/20 text-amber-200", trend: "Utilization" }] as stat}
                    <div
                        class="bg-white/10 backdrop-blur-xl rounded-3xl p-5 border border-white/10 group hover:bg-white/15 transition-all duration-300"
                    >
                        <div class="flex items-start justify-between mb-3">
                            <div class={cn("p-2.5 rounded-2xl", stat.color)}>
                                <stat.icon class="h-5 w-5" />
                            </div>
                            <span
                                class="text-[10px] uppercase tracking-wider font-bold text-white/40"
                                >{stat.trend}</span
                            >
                        </div>
                        <div class="space-y-1">
                            <p class="text-sm font-medium text-white/70">
                                {stat.label}
                            </p>
                            <h3
                                class="text-xl md:text-2xl font-bold text-white truncate"
                                title={String(stat.value)}
                            >
                                {stat.value}
                            </h3>
                        </div>
                    </div>
                {/each}
            </div>
        </div>
    </section>

    {#if loading}
        <div class="flex flex-col items-center justify-center p-20 gap-4">
            <div
                class="h-12 w-12 border-4 border-blue-500/20 border-t-blue-600 rounded-full animate-spin"
            ></div>
            <p class="text-muted-foreground font-medium">
                Menyinkronkan data pelanggan...
            </p>
        </div>
    {:else if customer}
        <main class="grid gap-8">
            <Tabs value="unpaid" class="w-full">
                <div class="flex items-center justify-between mb-6">
                    <TabsList
                        class="bg-muted/50 p-1 rounded-2xl h-12 w-full md:w-auto"
                    >
                        <TabsTrigger
                            value="unpaid"
                            class="rounded-xl px-8 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
                        >
                            Tagihan Aktif
                            <Badge
                                variant="secondary"
                                class="ml-2 bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400"
                            >
                                {unpaidSales.length}
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger
                            value="history"
                            class="rounded-xl px-8 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
                        >
                            Riwayat
                        </TabsTrigger>
                    </TabsList>

                    <div class="hidden md:flex items-center gap-2">
                        <Button variant="outline" size="sm" class="rounded-xl">
                            <Download class="h-4 w-4 mr-2" /> Export PDF
                        </Button>
                    </div>
                </div>

                <TabsContent
                    value="unpaid"
                    class="mt-0 space-y-6 animate-in slide-in-from-bottom-4 duration-500"
                >
                    {#if unpaidSales.length === 0}
                        <div
                            class="flex flex-col items-center justify-center p-20 rounded-[2.5rem] border-2 border-dashed bg-muted/5"
                        >
                            <div
                                class="h-20 w-20 rounded-full bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center mb-6 text-emerald-600"
                            >
                                <CheckCircle2 class="h-10 w-10" />
                            </div>
                            <h3 class="text-2xl font-bold text-foreground">
                                Semua Tagihan Lunas
                            </h3>
                            <p
                                class="text-muted-foreground max-w-sm text-center mt-2 text-lg"
                            >
                                Pelanggan ini tidak memiliki tunggakan
                                pembayaran saat ini.
                            </p>
                        </div>
                    {:else}
                        <div class="grid gap-4">
                            {#each unpaidSales as sale (sale.id)}
                                {@const paidAmount = (sale.payments || [])
                                    .filter((p: any) => p.method !== "tempo")
                                    .reduce(
                                        (sum: number, p: any) => sum + p.amount,
                                        0,
                                    )}
                                {@const remainingAmount =
                                    sale.finalAmount - paidAmount}
                                {@const progressPercent = Math.min(
                                    100,
                                    Math.round(
                                        (paidAmount / sale.finalAmount) * 100,
                                    ),
                                )}

                                <div
                                    class="group overflow-hidden rounded-[2rem] border bg-card hover:border-blue-500/30 transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1"
                                >
                                    <div class="p-6 md:p-8">
                                        <div
                                            class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
                                        >
                                            <div
                                                class="flex items-center gap-5"
                                            >
                                                <div
                                                    class="h-14 w-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-500"
                                                >
                                                    <Receipt class="h-7 w-7" />
                                                </div>
                                                <div class="space-y-1">
                                                    <div
                                                        class="flex items-center gap-3"
                                                    >
                                                        <a
                                                            href="/sales/history/{sale.id}"
                                                            class="text-xl font-bold hover:text-blue-600 transition-colors"
                                                        >
                                                            INV-{sale.id
                                                                .slice(-6)
                                                                .toUpperCase()}
                                                        </a>
                                                        <Badge
                                                            class={cn(
                                                                "rounded-full px-3",
                                                                sale.paymentStatus ===
                                                                    "partial"
                                                                    ? "bg-amber-100 text-amber-700 hover:bg-amber-100 border-none px-4 py-1"
                                                                    : "bg-red-100 text-red-700 hover:bg-red-100 border-none px-4 py-1",
                                                            )}
                                                        >
                                                            {sale.paymentStatus ===
                                                            "partial"
                                                                ? "Sebagian"
                                                                : "Belum Lunas"}
                                                        </Badge>
                                                    </div>
                                                    <div
                                                        class="flex items-center gap-2 text-sm text-muted-foreground"
                                                    >
                                                        <Calendar
                                                            class="h-3.5 w-3.5"
                                                        />
                                                        {formatDate(
                                                            sale.createdAt,
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div
                                                class="flex items-center gap-8 w-full md:w-auto"
                                            >
                                                <div
                                                    class="text-right flex-1 md:flex-none"
                                                >
                                                    <p
                                                        class="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1"
                                                    >
                                                        Sisa Tagihan
                                                    </p>
                                                    <p
                                                        class="text-2xl font-black text-red-600 tracking-tight leading-none"
                                                    >
                                                        {formatCurrency(
                                                            remainingAmount,
                                                        )}
                                                    </p>
                                                </div>
                                                <Button
                                                    onclick={() =>
                                                        openPayment(sale)}
                                                    class="h-14 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 font-bold transition-all hover:scale-105 active:scale-95"
                                                >
                                                    <Wallet
                                                        class="h-5 w-5 mr-3"
                                                    />
                                                    Bayar Sekarang
                                                </Button>
                                            </div>
                                        </div>

                                        <!-- Progress Visualization -->
                                        <div
                                            class="mt-8 pt-8 border-t space-y-3"
                                        >
                                            <div
                                                class="flex justify-between items-end"
                                            >
                                                <div class="space-y-1">
                                                    <p
                                                        class="text-xs text-muted-foreground font-medium uppercase tracking-wider"
                                                    >
                                                        Realisasi Pembayaran
                                                    </p>
                                                    <p
                                                        class="text-sm font-bold"
                                                    >
                                                        <span
                                                            class="text-emerald-600"
                                                            >{formatCurrency(
                                                                paidAmount,
                                                            )}</span
                                                        >
                                                        <span
                                                            class="text-muted-foreground mx-1"
                                                            >/</span
                                                        >
                                                        <span
                                                            class="text-foreground"
                                                            >{formatCurrency(
                                                                sale.finalAmount,
                                                            )}</span
                                                        >
                                                    </p>
                                                </div>
                                                <span
                                                    class="text-sm font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1 rounded-full"
                                                >
                                                    {progressPercent}%
                                                </span>
                                            </div>
                                            <div
                                                class="relative h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner"
                                            >
                                                <div
                                                    class="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full transition-all duration-1000 ease-out shadow-lg"
                                                    style="width: {progressPercent}%"
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    {/if}
                </TabsContent>

                <TabsContent
                    value="history"
                    class="mt-0 space-y-6 animate-in slide-in-from-bottom-4 duration-500"
                >
                    <div class="grid gap-4">
                        {#if sales.length === 0}
                            <div
                                class="p-20 text-center border-2 border-dashed rounded-[2.5rem] bg-muted/5"
                            >
                                <p class="text-muted-foreground text-lg">
                                    Belum ada riwayat transaksi ditemukan.
                                </p>
                            </div>
                        {:else}
                            {#each sales as sale}
                                <div
                                    class="group flex items-center justify-between p-6 rounded-3xl border bg-card hover:bg-muted/50 transition-all"
                                >
                                    <div class="flex items-center gap-5">
                                        <div
                                            class="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors"
                                        >
                                            <Clock class="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p
                                                class="font-bold text-lg leading-tight"
                                            >
                                                INV-{sale.id
                                                    .slice(-6)
                                                    .toUpperCase()}
                                            </p>
                                            <p
                                                class="text-sm text-muted-foreground"
                                            >
                                                {formatDate(sale.createdAt)}
                                            </p>
                                        </div>
                                    </div>

                                    <div class="flex items-center gap-8">
                                        <Badge
                                            variant="outline"
                                            class={cn(
                                                "capitalize px-4 py-1.5 rounded-full border-2 font-bold",
                                                sale.paymentStatus === "paid"
                                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                    : sale.paymentStatus ===
                                                        "partial"
                                                      ? "bg-amber-50 text-amber-700 border-amber-200"
                                                      : "bg-red-50 text-red-700 border-red-200",
                                            )}
                                        >
                                            {sale.paymentStatus === "paid"
                                                ? "Lunas"
                                                : sale.paymentStatus ===
                                                    "partial"
                                                  ? "Sebagian"
                                                  : "Belum Bayar"}
                                        </Badge>
                                        <p
                                            class="text-lg font-bold min-w-[12rem] text-right"
                                        >
                                            {formatCurrency(sale.finalAmount)}
                                        </p>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            href={`/sales/history/${sale.id}`}
                                            class="h-10 w-10 p-0 rounded-full hover:bg-blue-50 hover:text-blue-600"
                                        >
                                            <ArrowRight class="h-5 w-5" />
                                        </Button>
                                    </div>
                                </div>
                            {/each}
                        {/if}
                    </div>
                </TabsContent>
            </Tabs>
        </main>
    {/if}

    <!-- Specialized Payment Dialog -->
    <Dialog bind:open={openPaymentDialog}>
        <DialogContent
            class="sm:max-w-[700px] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl"
        >
            <div
                class="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 md:p-10 text-white relative"
            >
                <div class="absolute top-0 right-0 p-10 opacity-10">
                    <Wallet class="h-32 w-32" />
                </div>
                <Badge
                    variant="secondary"
                    class="bg-white/20 text-white border-none mb-4"
                    >Pembayaran Invoice</Badge
                >
                <DialogTitle
                    class="text-3xl md:text-4xl font-black tracking-tight leading-tight"
                >
                    Konfirmasi Pembayaran
                </DialogTitle>
                <DialogDescription
                    class="text-blue-100 text-lg mt-2 font-medium"
                >
                    Invoice: <span class="font-bold text-white"
                        >INV-{selectedSale?.id.slice(-6).toUpperCase()}</span
                    >
                </DialogDescription>
            </div>

            <div
                class="p-8 md:p-10 space-y-8 bg-background max-h-[70vh] overflow-y-auto"
            >
                <!-- Summary Card -->
                {#if selectedSale}
                    {@const paid = (selectedSale.payments || [])
                        .filter((p: any) => p.method !== "tempo")
                        .reduce((sum: number, p: any) => sum + p.amount, 0)}
                    {@const left = selectedSale.finalAmount - paid}

                    <div class="grid grid-cols-2 gap-4">
                        <div
                            class="bg-slate-50 dark:bg-slate-900 rounded-3xl p-5 border"
                        >
                            <p
                                class="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1"
                            >
                                Total Tagihan
                            </p>
                            <p class="text-xl font-bold">
                                {formatCurrency(selectedSale.finalAmount)}
                            </p>
                        </div>
                        <div
                            class="bg-red-50 dark:bg-red-950/20 rounded-3xl p-5 border border-red-100 dark:border-red-900/30"
                        >
                            <p
                                class="text-xs font-bold uppercase tracking-wider text-red-500 mb-1"
                            >
                                Sisa Yang Harus Dibayar
                            </p>
                            <p class="text-xl font-black text-red-600">
                                {formatCurrency(left)}
                            </p>
                        </div>
                    </div>

                    <Separator />

                    <!-- Payment Method Layout -->
                    <div class="grid gap-6">
                        <div class="space-y-4">
                            <Label
                                class="text-base font-bold flex items-center gap-2"
                            >
                                <Banknote class="h-5 w-5 text-blue-500" /> Pilih
                                Metode Pembayaran
                            </Label>
                            <div class="grid grid-cols-3 gap-4">
                                {#each [{ id: "cash", label: "Tunai", icon: "💵", color: "peer-checked:border-emerald-500 peer-checked:bg-emerald-50 text-emerald-700" }, { id: "transfer", label: "Transfer", icon: "🏦", color: "peer-checked:border-blue-500 peer-checked:bg-blue-50 text-blue-700" }, { id: "qris", label: "QRIS", icon: "📱", color: "peer-checked:border-purple-500 peer-checked:bg-purple-50 text-purple-700" }] as method}
                                    <label class="cursor-pointer group">
                                        <input
                                            type="radio"
                                            name="method"
                                            value={method.id}
                                            class="peer sr-only"
                                            checked={paymentMethod ===
                                                method.id}
                                            onchange={() => {
                                                paymentMethod =
                                                    method.id as any;
                                                if (method.id !== "transfer")
                                                    selectedBank = "";
                                            }}
                                        />
                                        <div
                                            class={cn(
                                                "flex flex-col items-center gap-2 p-5 rounded-3xl border-2 border-slate-100 dark:border-slate-800 transition-all duration-300 group-hover:bg-slate-50 dark:group-hover:bg-slate-900 group-active:scale-95",
                                                method.color,
                                            )}
                                        >
                                            <span
                                                class="text-3xl filter drop-shadow-sm"
                                                >{method.icon}</span
                                            >
                                            <span class="text-sm font-bold"
                                                >{method.label}</span
                                            >
                                        </div>
                                    </label>
                                {/each}
                            </div>
                        </div>

                        {#if paymentMethod === "transfer"}
                            <div
                                class="space-y-3 p-6 rounded-3xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 animate-in fade-in zoom-in duration-300"
                            >
                                <Label
                                    class="font-bold flex items-center gap-2"
                                >
                                    <DollarSign class="h-4 w-4 text-blue-500" />
                                    Bank Tujuan Transfer
                                </Label>
                                <select
                                    class="w-full h-12 px-4 rounded-xl border-2 border-blue-200 dark:border-blue-900/50 bg-background text-sm font-bold focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                                    bind:value={selectedBank}
                                >
                                    <option value=""
                                        >Pilih rekening tujuan...</option
                                    >
                                    {#each bankOptions as bank}
                                        <option value={bank.value}
                                            >{bank.label}</option
                                        >
                                    {/each}
                                </select>
                            </div>
                        {/if}

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div class="space-y-3">
                                <Label
                                    class="font-bold flex items-center gap-2"
                                >
                                    <Banknote
                                        class="h-4 w-4 text-emerald-500"
                                    /> Nominal Bayar
                                </Label>
                                <div class="relative">
                                    <span
                                        class="absolute left-4 top-1/2 -translate-y-1/2 font-black text-emerald-600"
                                        >Rp</span
                                    >
                                    <CurrencyInput
                                        class="h-14 pl-11 rounded-2xl border-2 border-slate-100 bg-slate-50 font-black text-xl text-emerald-700 focus:bg-background focus:border-emerald-500 transition-all"
                                        bind:value={paymentAmount}
                                    />
                                </div>
                            </div>

                            <div class="space-y-3">
                                <Label
                                    class="font-bold flex items-center gap-2"
                                >
                                    <Upload class="h-4 w-4 text-indigo-500" /> Bukti
                                    Pembayaran
                                </Label>
                                <label
                                    class="flex items-center justify-center w-full h-14 px-4 border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 rounded-2xl cursor-pointer transition-all group overflow-hidden relative"
                                >
                                    {#if proofFile}
                                        <div
                                            class="flex items-center gap-2 text-indigo-600 overflow-hidden"
                                        >
                                            <CheckCircle2
                                                class="h-5 w-5 shrink-0"
                                            />
                                            <span
                                                class="text-Suffixed-sm font-bold truncate"
                                                >{proofFile.name}</span
                                            >
                                        </div>
                                    {:else}
                                        <div
                                            class="flex items-center gap-2 text-slate-500 group-hover:text-indigo-600 transition-colors"
                                        >
                                            <FileText class="h-5 w-5" />
                                            <span
                                                class="text-Suffixed-sm font-bold"
                                                >Pilih file bukti...</span
                                            >
                                        </div>
                                    {/if}
                                    <input
                                        type="file"
                                        class="hidden"
                                        accept="image/*"
                                        onchange={handleFileChange}
                                    />
                                </label>
                            </div>
                        </div>

                        <div class="space-y-3">
                            <Label class="font-bold">Catatan Pembayaran</Label>
                            <Input
                                bind:value={paymentNotes}
                                placeholder="Misal: Lunas sisa nota, Bayar DP, dll"
                                class="h-12 rounded-xl border-slate-100 bg-slate-50 focus:bg-background"
                            />
                        </div>
                    </div>
                {/if}
            </div>

            <DialogFooter
                class="p-8 bg-slate-50 dark:bg-slate-900/50 flex flex-row items-center justify-end gap-3 border-t"
            >
                <Button
                    variant="ghost"
                    class="h-14 px-8 rounded-2xl font-bold"
                    onclick={() => (openPaymentDialog = false)}
                >
                    Batal
                </Button>
                <Button
                    class="h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/20 font-black text-lg transition-all hover:scale-105 active:scale-95 px-8"
                    onclick={handlePayment}
                    disabled={paying}
                >
                    {paying ? "Sedang Diproses..." : "Konfirmasi & Bayar"}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</div>

<style>
    :global(.lucide) {
        stroke-width: 2.5px;
    }

    ::-webkit-scrollbar {
        width: 6px;
    }
    ::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.1);
        border-radius: 10px;
    }
    ::-webkit-scrollbar-track {
        background: transparent;
    }
</style>
