<script lang="ts">
    import { Button } from "$lib/shared/components/ui/button";
    import {
        Card,
        CardContent,
        CardDescription,
        CardFooter,
        CardHeader,
        CardTitle,
    } from "$lib/shared/components/ui/card";
    import { Input } from "$lib/shared/components/ui/input";
    import { Label } from "$lib/shared/components/ui/label";
    import { Separator } from "$lib/shared/components/ui/separator";
    import { Switch } from "$lib/shared/components/ui/switch";
    import { Badge } from "$lib/shared/components/ui/badge";
    import {
        Dialog,
        DialogContent,
        DialogDescription,
        DialogFooter,
        DialogHeader,
        DialogTitle,
    } from "$lib/shared/components/ui/dialog";
    import {
        Select,
        SelectContent,
        SelectItem,
        SelectTrigger,
    } from "$lib/shared/components/ui/select";
    import { toast } from "svelte-sonner";
    import {
        Loader2,
        Plus,
        Trash2,
        CreditCard,
        MinusCircle,
        Edit,
    } from "lucide-svelte";
    import { onMount } from "svelte";
    import {
        PaymentMethodsService,
        PAYMENT_ICONS,
        PAYMENT_TYPES,
        type PaymentMethod,
    } from "$lib/features/settings/settings.service";

    import { api } from "$lib/shared/lib/api-client";

    let paymentMethods = $state<PaymentMethod[]>([]);
    let assetAccounts = $state<any[]>([]); // For dropdown
    let loading = $state(true);
    let showAddMethod = $state(false);
    let saving = $state(false);

    let newMethod = $state({
        name: "",
        icon: "💳",
        type: "custom" as PaymentMethod["type"],
        accountId: "",
    });

    let methodToEdit = $state<PaymentMethod | null>(null);
    let editMethodDialogOpen = $state(false);
    let editFeeConfig = $state<{
        enabled: boolean;
        type: "percent" | "fixed";
        value: number;
    }>({ enabled: false, type: "percent", value: 0 });

    let newVariantByMethod = $state<
        Record<
            string,
            {
                name: string;
                accountNumber: string;
                accountHolder: string;
                accountId: string;
            }
        >
    >({});

    async function loadPaymentMethods() {
        loading = true;
        try {
            const [methodsRes, accountsRes] = await Promise.all([
                PaymentMethodsService.getAll(),
                api.get("/accounting/accounts?typeId=ASSET"),
            ]);
            paymentMethods = methodsRes;
            assetAccounts = accountsRes.data;
        } catch (e) {
            console.error(e);
            toast.error("Gagal memuat data");
        } finally {
            loading = false;
        }
    }

    onMount(() => {
        loadPaymentMethods();
    });

    async function addPaymentMethod() {
        if (!newMethod.name) return;
        saving = true;
        try {
            await PaymentMethodsService.create({
                name: newMethod.name,
                type: newMethod.type,
                icon: newMethod.icon,
                accountId: newMethod.accountId || undefined,
            } as any);
            await loadPaymentMethods();
            newMethod = { name: "", icon: "💳", type: "custom", accountId: "" };
            showAddMethod = false;
            toast.success("Metode pembayaran berhasil ditambahkan");
        } catch (e) {
            toast.error("Gagal menambah metode pembayaran");
        } finally {
            saving = false;
        }
    }

    async function togglePaymentMethod(id: string, enabled: boolean) {
        // Optimistic update
        const idx = paymentMethods.findIndex((p) => p.id === id);
        if (idx !== -1) paymentMethods[idx].enabled = enabled;

        try {
            await PaymentMethodsService.update(id, { enabled });
        } catch (e) {
            toast.error("Gagal mengubah status metode");
            if (idx !== -1) paymentMethods[idx].enabled = !enabled; // Revert
        }
    }

    async function removePaymentMethod(id: string) {
        if (!confirm("Nonaktifkan pembayaran ini?")) return;
        try {
            await PaymentMethodsService.disable(id);
            await loadPaymentMethods();
            toast.success("Metode pembayaran dinonaktifkan");
        } catch (e) {
            toast.error("Gagal menonaktifkan metode");
        }
    }

    function getNewVariant(methodId: string) {
        if (!newVariantByMethod[methodId]) {
            newVariantByMethod[methodId] = {
                name: "",
                accountNumber: "",
                accountHolder: "",
                accountId: "",
            };
        }
        return newVariantByMethod[methodId];
    }

    async function addVariant(methodId: string) {
        const variant = newVariantByMethod[methodId];
        if (!variant?.name) return;

        try {
            await PaymentMethodsService.addVariant(methodId, {
                name: variant.name,
                accountNumber: variant.accountNumber || undefined,
                accountHolder: variant.accountHolder || undefined,
                accountId: variant.accountId || undefined,
            });
            await loadPaymentMethods();
            newVariantByMethod[methodId] = {
                name: "",
                accountNumber: "",
                accountHolder: "",
                accountId: "",
            };
            toast.success("Varian berhasil ditambahkan");
        } catch (e) {
            toast.error("Gagal menambah varian: " + String(e));
        }
    }

    async function removeVariant(methodId: string, variantId: string) {
        if (!confirm("Hapus varian ini?")) return;
        try {
            await PaymentMethodsService.disableVariant(methodId, variantId);
            await loadPaymentMethods();
            toast.success("Varian dinonaktifkan");
        } catch (e) {
            toast.error("Gagal menonaktifkan varian");
        }
    }

    function openEditDialog(method: PaymentMethod) {
        methodToEdit = method;
        editFeeConfig = method.feeConfig
            ? { ...method.feeConfig }
            : { enabled: false, type: "percent", value: 0 };
        editMethodDialogOpen = true;
    }

    async function saveEditMethod() {
        if (!methodToEdit) return;
        saving = true;
        try {
            await PaymentMethodsService.update(methodToEdit.id, {
                feeConfig: editFeeConfig,
            });
            await loadPaymentMethods();
            editMethodDialogOpen = false;
            toast.success("Pengaturan metode berhasil disimpan");
        } catch (e) {
            toast.error("Gagal menyimpan perubahan");
        } finally {
            saving = false;
        }
    }

    const TEMPLATES = [
        { name: "QRIS", type: "qris" as const, icon: "📱" },
        { name: "OVO / ShopeePay", type: "ewallet" as const, icon: "👛" },
        { name: "BCA Transfer", type: "transfer" as const, icon: "🏦" },
        { name: "Mandiri Transfer", type: "transfer" as const, icon: "🏦" },
    ];

    async function applyTemplate(tpl: (typeof TEMPLATES)[0]) {
        newMethod = {
            name: tpl.name,
            type: tpl.type,
            icon: tpl.icon,
            accountId: "",
        };
        toast.info(
            `Templat ${tpl.name} dipilih. Akun GL akan otomatis dibuat jika belum ada.`,
        );
    }
</script>

<div class="space-y-6 max-w-4xl mx-auto py-6">
    <div class="flex items-center justify-between">
        <div>
            <h3 class="text-2xl font-bold tracking-tight">Metode Pembayaran</h3>
            <p class="text-muted-foreground">
                Daftar cara pembayaran pelanggan. Setiap metode akan otomatis
                memiliki akun terpisah di pembukuan.
            </p>
        </div>
        <div class="flex gap-2">
            <Button variant="outline" onclick={() => (showAddMethod = true)}>
                <Plus class="h-4 w-4 mr-2" /> Tambah Manual
            </Button>
        </div>
    </div>

    <!-- Quick Templates -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        {#each TEMPLATES as tpl}
            <button
                class="flex flex-col items-center justify-center p-4 border rounded-xl hover:border-primary hover:bg-primary/5 transition-all text-center gap-2 group"
                onclick={() => {
                    applyTemplate(tpl);
                    showAddMethod = true;
                }}
            >
                <div
                    class="text-3xl group-hover:scale-110 transition-transform"
                >
                    {tpl.icon}
                </div>
                <div class="text-xs font-bold">{tpl.name}</div>
            </button>
        {/each}
    </div>

    {#if loading}
        <div class="flex items-center justify-center py-12">
            <Loader2 class="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
    {:else if paymentMethods.length === 0}
        <div class="text-center py-12 border-2 border-dashed rounded-lg">
            <CreditCard class="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 class="text-lg font-medium">Belum ada metode pembayaran</h3>
            <p class="text-muted-foreground mb-4">
                Pilih salah satu templat di atas atau klik "Tambah Manual".
            </p>
        </div>
    {:else}
        <div class="grid gap-6">
            {#each paymentMethods as method (method.id)}
                <Card
                    class={!method.enabled
                        ? "opacity-60 bg-muted/30"
                        : "shadow-sm hover:shadow-md transition-shadow"}
                >
                    <CardContent class="p-6">
                        <div class="flex items-start justify-between">
                            <div class="flex items-center gap-4">
                                <div
                                    class="text-4xl bg-slate-100 p-3 rounded-2xl"
                                >
                                    {method.icon}
                                </div>
                                <div>
                                    <div class="flex items-center gap-2">
                                        <h4 class="font-bold text-lg">
                                            {method.name}
                                        </h4>
                                        <Badge
                                            variant="outline"
                                            class="text-[10px] uppercase font-bold px-2 py-0"
                                            >{method.type}</Badge
                                        >
                                    </div>
                                    <div class="flex flex-wrap gap-2 mt-2">
                                        {#if method.accountId}
                                            {@const acc = assetAccounts.find(
                                                (a) =>
                                                    a.id === method.accountId,
                                            )}
                                            <Badge
                                                variant="secondary"
                                                class="text-[10px] font-mono bg-blue-50 text-blue-700 border-blue-200"
                                            >
                                                GL: {acc?.code} - {acc?.name ||
                                                    "Memuat..."}
                                            </Badge>
                                        {:else}
                                            <Badge
                                                variant="outline"
                                                class="text-[10px] text-orange-600 border-orange-200 bg-orange-50 italic"
                                            >
                                                Belum Terhubung ke Akuntansi
                                            </Badge>
                                        {/if}

                                        {#if method.feeConfig?.enabled}
                                            <Badge
                                                variant="outline"
                                                class="text-[10px] border-emerald-200 bg-emerald-50 text-emerald-700"
                                            >
                                                MDR: {method.feeConfig
                                                    .value}{method.feeConfig
                                                    .type === "percent"
                                                    ? "%"
                                                    : ""}
                                            </Badge>
                                        {/if}
                                    </div>
                                </div>
                            </div>
                            <div class="flex items-center gap-2">
                                <Switch
                                    checked={method.enabled}
                                    onCheckedChange={(c) =>
                                        togglePaymentMethod(method.id, c)}
                                />
                                <div class="border-l h-6 mx-2"></div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    class="h-8 w-8 rounded-full"
                                    onclick={() => openEditDialog(method)}
                                >
                                    <Edit class="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    class="h-8 w-8 rounded-full text-destructive hover:bg-destructive/10"
                                    onclick={() =>
                                        removePaymentMethod(method.id)}
                                >
                                    <Trash2 class="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {#if method.type !== "cash" && method.enabled}
                            <div class="mt-6 pt-4 border-t border-dashed">
                                <div
                                    class="flex items-center justify-between mb-4"
                                >
                                    <h5
                                        class="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                                    >
                                        Detail Rekening / Varian
                                    </h5>
                                </div>

                                <div class="grid gap-3">
                                    {#if method.variants && method.variants.length > 0}
                                        <div class="grid sm:grid-cols-2 gap-3">
                                            {#each method.variants.filter((v) => v.enabled) as variant}
                                                <div
                                                    class="flex items-center justify-between p-3 bg-slate-50 rounded-xl border group hover:border-primary transition-colors"
                                                >
                                                    <div class="flex flex-col">
                                                        <span
                                                            class="font-bold text-sm tracking-tight"
                                                            >{variant.name}</span
                                                        >
                                                        <div
                                                            class="flex items-center gap-2 mt-1"
                                                        >
                                                            {#if variant.accountNumber}
                                                                <span
                                                                    class="font-mono text-[10px] bg-white border px-1.5 py-0.5 rounded leading-none"
                                                                >
                                                                    {variant.accountNumber}
                                                                </span>
                                                            {/if}
                                                            {#if variant.accountHolder}
                                                                <span
                                                                    class="text-[10px] text-muted-foreground truncate max-w-[100px]"
                                                                >
                                                                    a.n {variant.accountHolder}
                                                                </span>
                                                            {/if}
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        class="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onclick={() =>
                                                            removeVariant(
                                                                method.id,
                                                                variant.id,
                                                            )}
                                                    >
                                                        <MinusCircle
                                                            class="h-4 w-4"
                                                        />
                                                    </Button>
                                                </div>
                                            {/each}
                                        </div>
                                    {/if}

                                    <!-- Elegant Variant Form -->
                                    <div
                                        class="mt-2 p-4 bg-muted/30 rounded-2xl border border-dashed text-sm"
                                    >
                                        <div
                                            class="flex items-center gap-2 mb-3"
                                        >
                                            <Plus
                                                class="h-3 w-3 text-muted-foreground"
                                            />
                                            <span
                                                class="font-bold text-xs text-muted-foreground"
                                                >TAMBAH REKENING BARU</span
                                            >
                                        </div>
                                        <div
                                            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3"
                                        >
                                            <Input
                                                placeholder="Nama (e.g. BCA Mandiri)"
                                                class="h-8 text-xs"
                                                value={newVariantByMethod[
                                                    method.id
                                                ]?.name || ""}
                                                oninput={(e) => {
                                                    if (
                                                        !newVariantByMethod[
                                                            method.id
                                                        ]
                                                    )
                                                        newVariantByMethod[
                                                            method.id
                                                        ] = {
                                                            name: "",
                                                            accountNumber: "",
                                                            accountHolder: "",
                                                            accountId: "",
                                                        };
                                                    newVariantByMethod[
                                                        method.id
                                                    ].name =
                                                        e.currentTarget.value;
                                                }}
                                            />
                                            <Input
                                                placeholder="No. Rekening"
                                                class="h-8 text-xs"
                                                value={newVariantByMethod[
                                                    method.id
                                                ]?.accountNumber || ""}
                                                oninput={(e) => {
                                                    if (
                                                        !newVariantByMethod[
                                                            method.id
                                                        ]
                                                    )
                                                        newVariantByMethod[
                                                            method.id
                                                        ] = {
                                                            name: "",
                                                            accountNumber: "",
                                                            accountHolder: "",
                                                            accountId: "",
                                                        };
                                                    newVariantByMethod[
                                                        method.id
                                                    ].accountNumber =
                                                        e.currentTarget.value;
                                                }}
                                            />
                                            <Input
                                                placeholder="Pemilik"
                                                class="h-8 text-xs"
                                                value={newVariantByMethod[
                                                    method.id
                                                ]?.accountHolder || ""}
                                                oninput={(e) => {
                                                    if (
                                                        !newVariantByMethod[
                                                            method.id
                                                        ]
                                                    )
                                                        newVariantByMethod[
                                                            method.id
                                                        ] = {
                                                            name: "",
                                                            accountNumber: "",
                                                            accountHolder: "",
                                                            accountId: "",
                                                        };
                                                    newVariantByMethod[
                                                        method.id
                                                    ].accountHolder =
                                                        e.currentTarget.value;
                                                }}
                                            />
                                            <Button
                                                size="sm"
                                                class="h-8 text-xs"
                                                onclick={() =>
                                                    addVariant(method.id)}
                                            >
                                                Simpan Varian
                                            </Button>
                                        </div>
                                        <p
                                            class="text-[10px] text-muted-foreground mt-2 italic"
                                        >
                                            * Akun GL akan otomatis dibuat untuk
                                            setiap varian jika Anda tidak
                                            memilih akun manual.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        {/if}
                    </CardContent>
                </Card>
            {/each}
        </div>
    {/if}

    <!-- Add Method Dialog -->
    <Dialog bind:open={showAddMethod}>
        <DialogContent class="sm:max-w-md rounded-3xl">
            <DialogHeader>
                <DialogTitle class="text-xl">Buat Metode Pembayaran</DialogTitle
                >
                <DialogDescription>
                    Sistem akan otomatis membuat Akun GL di Chart of Accounts.
                </DialogDescription>
            </DialogHeader>
            <div class="grid gap-6 py-4">
                <div class="space-y-2">
                    <Label
                        class="text-xs font-bold uppercase text-muted-foreground"
                        >Nama Metode</Label
                    >
                    <Input
                        bind:value={newMethod.name}
                        placeholder="Contoh: SeaBank, ShopeePay"
                        class="h-11 text-lg font-bold"
                    />
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-2">
                        <Label
                            class="text-xs font-bold uppercase text-muted-foreground"
                            >Kategori</Label
                        >
                        <Select type="single" bind:value={newMethod.type}>
                            <SelectTrigger class="h-10">
                                {PAYMENT_TYPES.find(
                                    (t) => t.id === newMethod.type,
                                )?.label || "Pilih Tipe"}
                            </SelectTrigger>
                            <SelectContent>
                                {#each PAYMENT_TYPES as type}
                                    <SelectItem value={type.id}
                                        >{type.label}</SelectItem
                                    >
                                {/each}
                            </SelectContent>
                        </Select>
                    </div>
                    <div class="space-y-2">
                        <Label
                            class="text-xs font-bold uppercase text-muted-foreground"
                            >Ikon</Label
                        >
                        <Select type="single" bind:value={newMethod.icon}>
                            <SelectTrigger class="h-10">
                                <span class="text-xl">{newMethod.icon}</span>
                                <span class="ml-2"
                                    >{PAYMENT_ICONS.find(
                                        (i) => i.icon === newMethod.icon,
                                    )?.label || "Ikon"}</span
                                >
                            </SelectTrigger>
                            <SelectContent>
                                {#each PAYMENT_ICONS as icon}
                                    <SelectItem value={icon.icon}>
                                        <span class="text-xl mr-2"
                                            >{icon.icon}</span
                                        >
                                        {icon.label}
                                    </SelectItem>
                                {/each}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div
                    class="space-y-2 p-4 bg-blue-50/50 rounded-2xl border border-blue-100"
                >
                    <Label class="text-xs font-bold uppercase text-blue-700"
                        >Hubungkan Akun GL (Opsional)</Label
                    >
                    <select
                        bind:value={newMethod.accountId}
                        class="flex h-10 w-full rounded-xl border-blue-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value=""
                            >✨ Buat Baru Otomatis (Kas & Bank)</option
                        >
                        {#each assetAccounts as acc}
                            <option value={acc.id}
                                >{acc.code} - {acc.name}</option
                            >
                        {/each}
                    </select>
                    <p class="text-[10px] text-blue-600 leading-relaxed mt-1">
                        Sangat disarankan untuk memisahkan setiap bank/e-wallet
                        agar saldo di Kasir sama dengan saldo asli di
                        rekening/dompet Anda.
                    </p>
                </div>
            </div>
            <DialogFooter class="sm:justify-between gap-4">
                <Button
                    variant="ghost"
                    class="rounded-xl px-8"
                    onclick={() => (showAddMethod = false)}>Batal</Button
                >
                <Button
                    onclick={addPaymentMethod}
                    class="rounded-xl px-8 font-bold"
                    disabled={saving || !newMethod.name}>Simpan Metode</Button
                >
            </DialogFooter>
        </DialogContent>
    </Dialog>

    <!-- Edit Method Dialog -->
    <Dialog bind:open={editMethodDialogOpen}>
        <DialogContent class="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Edit Metode: {methodToEdit?.name}</DialogTitle>
                <DialogDescription>
                    Konfigurasi biaya layanan (MDR) dan detail lainnya.
                </DialogDescription>
            </DialogHeader>
            <div class="grid gap-6 py-4">
                <div class="space-y-4 border rounded-lg p-4 bg-slate-50">
                    <div class="flex items-center justify-between">
                        <Label class="text-base">Biaya Layanan / MDR</Label>
                        <Switch bind:checked={editFeeConfig.enabled} />
                    </div>
                    <p class="text-xs text-muted-foreground">
                        Biaya tambahan yang dibebankan ke pelanggan (surcharge).
                    </p>

                    {#if editFeeConfig.enabled}
                        <div
                            class="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2"
                        >
                            <div class="space-y-2">
                                <Label>Tipe Biaya</Label>
                                <Select
                                    type="single"
                                    bind:value={editFeeConfig.type}
                                >
                                    <SelectTrigger>
                                        {editFeeConfig.type === "percent"
                                            ? "Persentase (%)"
                                            : "Nominal Tetap (Rp)"}
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="percent"
                                            >Persentase (%)</SelectItem
                                        >
                                        <SelectItem value="fixed"
                                            >Nominal Tetap (Rp)</SelectItem
                                        >
                                    </SelectContent>
                                </Select>
                            </div>
                            <div class="space-y-2">
                                <Label>Nilai</Label>
                                <Input
                                    type="number"
                                    bind:value={editFeeConfig.value}
                                    min="0"
                                />
                            </div>
                        </div>
                    {/if}
                </div>
            </div>
            <DialogFooter>
                <Button
                    variant="outline"
                    onclick={() => (editMethodDialogOpen = false)}>Batal</Button
                >
                <Button onclick={saveEditMethod} disabled={saving}
                    >Simpan Perubahan</Button
                >
            </DialogFooter>
        </DialogContent>
    </Dialog>
</div>
