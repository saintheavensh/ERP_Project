<script lang="ts">
    import { Button, buttonVariants } from "$lib/shared/components/ui/button";
    import { Input } from "$lib/shared/components/ui/input";
    import { Label } from "$lib/shared/components/ui/label";
    import {
        Dialog,
        DialogContent,
        DialogFooter,
    } from "$lib/shared/components/ui/dialog";
    import {
        Select,
        SelectContent,
        SelectItem,
        SelectTrigger,
    } from "$lib/shared/components/ui/select";
    import * as Popover from "$lib/shared/components/ui/popover";
    import * as Command from "$lib/shared/components/ui/command";
    import { Separator } from "$lib/shared/components/ui/separator";
    import {
        CreditCard,
        User,
        ChevronsUpDown,
        Check,
        Wallet,
        Plus,
        X,
    } from "lucide-svelte";
    import CurrencyInput from "$lib/shared/components/custom/currency-input.svelte";
    import { formatCurrency, cn } from "$lib/shared/lib/utils";
    import type { SalesController } from "./sales.controller.svelte";

    let { controller }: { controller: SalesController } = $props();
</script>

<Dialog bind:open={controller.paymentOpen}>
    <DialogContent
        class="max-w-[800px] p-0 gap-0 overflow-hidden shadow-2xl sm:rounded-2xl border-0"
    >
        <div
            class="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white text-center relative overflow-hidden"
        >
            <div
                class="absolute inset-0 bg-white/10 pattern-dots opacity-20"
            ></div>
            <h2
                class="text-2xl font-bold relative z-10 flex items-center justify-center gap-2"
            >
                <CreditCard class="h-6 w-6" />
                Checkout & Pembayaran
            </h2>
            <p class="text-blue-100 relative z-10 mt-1">
                Selesaikan pembayaran untuk {controller.cart.length} item
            </p>
        </div>

        <div
            class="flex-1 overflow-y-auto max-h-[70vh] p-6 bg-zinc-50/50 dark:bg-zinc-900/50"
        >
            <div class="grid md:grid-cols-2 gap-8">
                <!-- Bill & Customer Info -->
                <div class="space-y-6">
                    <div
                        class="bg-card rounded-xl border shadow-sm p-4 text-center"
                    >
                        <p
                            class="text-xs uppercase tracking-wider text-muted-foreground font-semibold"
                        >
                            Total Tagihan
                        </p>
                        <div
                            class="text-4xl font-bold text-foreground mt-1 tracking-tight"
                        >
                            {formatCurrency(controller.totalAmount)}
                        </div>
                    </div>

                    <div class="space-y-4">
                        <h3
                            class="text-sm font-semibold flex items-center gap-2 text-muted-foreground border-b pb-2"
                        >
                            <User class="h-4 w-4" /> Informasi Pelanggan
                        </h3>

                        <div class="space-y-3">
                            <div class="space-y-1.5">
                                <Label class="text-xs">Pilih Pelanggan</Label>
                                <Popover.Root
                                    bind:open={controller.customerOpen}
                                >
                                    <Popover.Trigger
                                        class={cn(
                                            buttonVariants({
                                                variant: "outline",
                                            }),
                                            "w-full justify-between bg-card",
                                        )}
                                        role="combobox"
                                        aria-expanded={controller.customerOpen}
                                    >
                                        {#if controller.selectedCustomerId}
                                            <span
                                                class="font-medium text-foreground"
                                                >{controller.customerOptions.find(
                                                    (c) =>
                                                        c.value ===
                                                        controller.selectedCustomerId,
                                                )?.label}</span
                                            >
                                        {:else}
                                            <span class="text-muted-foreground"
                                                >Pilih / Cari Pelanggan...</span
                                            >
                                        {/if}
                                        <ChevronsUpDown
                                            class="ml-2 h-4 w-4 opacity-50"
                                        />
                                    </Popover.Trigger>
                                    <Popover.Content
                                        class="w-[300px] p-0"
                                        align="start"
                                    >
                                        <Command.Root>
                                            <Command.Input
                                                placeholder="Cari nama..."
                                            />
                                            <Command.Empty
                                                >Pelanggan tidak ditemukan.</Command.Empty
                                            >
                                            <Command.Group
                                                class="max-h-[200px] overflow-y-auto"
                                            >
                                                {#each controller.customerOptions as customer}
                                                    <Command.Item
                                                        value={customer.label}
                                                        onSelect={() => {
                                                            controller.selectedCustomerId =
                                                                customer.value;
                                                            controller.customerOpen = false;
                                                        }}
                                                    >
                                                        <Check
                                                            class={cn(
                                                                "mr-2 h-4 w-4",
                                                                controller.selectedCustomerId ===
                                                                    customer.value
                                                                    ? "opacity-100"
                                                                    : "opacity-0",
                                                            )}
                                                        />
                                                        {customer.label}
                                                    </Command.Item>
                                                {/each}
                                            </Command.Group>
                                        </Command.Root>
                                    </Popover.Content>
                                </Popover.Root>
                            </div>

                            {#if !controller.selectedCustomerId}
                                <div
                                    class="flex items-center gap-3 pl-3 border-l-2 border-blue-200 dark:border-blue-800"
                                >
                                    <div class="flex-1 space-y-1.5">
                                        <Label
                                            class="text-xs text-muted-foreground"
                                            >Nama Manual (Walk-in)</Label
                                        >
                                        <Input
                                            placeholder="Nama Pelanggan / Guest"
                                            bind:value={
                                                controller.customerNameManual
                                            }
                                            class="h-9 bg-card"
                                        />
                                    </div>
                                </div>
                            {/if}

                            <div class="space-y-1.5 pt-2">
                                <Label class="text-xs">Catatan (Opsional)</Label
                                >
                                <Input
                                    placeholder="Invoice ref, keterangan..."
                                    bind:value={controller.notes}
                                    class="h-9 bg-card"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Payment Methods -->
                <div class="space-y-5">
                    <div
                        class="flex items-center justify-between border-b pb-2"
                    >
                        <h3
                            class="text-sm font-semibold flex items-center gap-2 text-muted-foreground"
                        >
                            <Wallet class="h-4 w-4" /> Metode Pembayaran
                        </h3>
                        <Button
                            variant="ghost"
                            size="sm"
                            class="h-7 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onclick={() => controller.addPaymentRow()}
                            disabled={controller.payments.length >= 2 ||
                                (controller.payments[0] &&
                                    controller.getSelectedMethod(
                                        controller.payments[0].methodId,
                                    )?.type === "cash") ||
                                controller.availableMethods.length === 0}
                        >
                            <Plus class="h-3 w-3 mr-1" /> Split Payment
                        </Button>
                    </div>

                    <div class="space-y-3">
                        {#if controller.availableMethods.length === 0}
                            <div
                                class="text-center p-6 bg-muted/30 rounded-lg text-sm text-muted-foreground"
                            >
                                <div class="animate-pulse">
                                    Memuat metode pembayaran...
                                </div>
                            </div>
                        {:else}
                            {#each controller.payments as payment, i}
                                {@const selectedMethod =
                                    controller.getSelectedMethod(
                                        payment.methodId,
                                    )}
                                <div
                                    class="p-3 border rounded-xl bg-card shadow-sm space-y-3 animate-in slide-in-from-right duration-300"
                                >
                                    <div
                                        class="flex justify-between items-center text-xs text-muted-foreground"
                                    >
                                        <span
                                            class="font-bold uppercase tracking-wider"
                                            >Pembayaran #{i + 1}</span
                                        >
                                        {#if controller.payments.length > 1}
                                            <button
                                                class="text-red-500 hover:text-red-600 transition-colors"
                                                onclick={() =>
                                                    controller.removePaymentRow(
                                                        i,
                                                    )}
                                            >
                                                <X class="h-3.5 w-3.5" />
                                            </button>
                                        {/if}
                                    </div>

                                    <div class="grid gap-3">
                                        <Select
                                            type="single"
                                            value={payment.methodId}
                                            onValueChange={(val) =>
                                                controller.handleMethodChange(
                                                    i,
                                                    val,
                                                )}
                                        >
                                            <SelectTrigger
                                                class="bg-secondary/10 border-muted"
                                            >
                                                <div
                                                    class="flex items-center gap-2"
                                                >
                                                    {#if selectedMethod?.icon}
                                                        <span class="text-lg"
                                                            >{selectedMethod.icon}</span
                                                        >
                                                    {/if}
                                                    <span class="truncate"
                                                        >{selectedMethod?.name ||
                                                            "Pilih Metode"}</span
                                                    >
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {#each controller.availableMethods as method}
                                                    {#if (method.type !== "custom" && method.id !== "PM-TEMPO") || controller.selectedCustomerId}
                                                        <SelectItem
                                                            value={method.id}
                                                            class="cursor-pointer"
                                                        >
                                                            <span class="mr-2"
                                                                >{method.icon}</span
                                                            >
                                                            {method.name}
                                                        </SelectItem>
                                                    {/if}
                                                {/each}
                                            </SelectContent>
                                        </Select>

                                        {#if selectedMethod?.variants && selectedMethod.variants.length > 0}
                                            <Select
                                                type="single"
                                                value={payment.variantId}
                                                onValueChange={(val) =>
                                                    controller.handleVariantChange(
                                                        i,
                                                        val,
                                                    )}
                                            >
                                                <SelectTrigger
                                                    class="bg-secondary/10 border-muted border-dashed"
                                                >
                                                    <span
                                                        >{selectedMethod.variants.find(
                                                            (v) =>
                                                                v.id ===
                                                                payment.variantId,
                                                        )?.name ||
                                                            "Pilih Bank / Akun"}</span
                                                    >
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {#each selectedMethod.variants as variant}
                                                        <SelectItem
                                                            value={variant.id}
                                                        >
                                                            {variant.name}
                                                            {variant.accountNumber
                                                                ? `(${variant.accountNumber})`
                                                                : ""}
                                                        </SelectItem>
                                                    {/each}
                                                </SelectContent>
                                            </Select>
                                        {/if}

                                        <div class="relative">
                                            <div
                                                class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground font-semibold"
                                            >
                                                Rp
                                            </div>
                                            <CurrencyInput
                                                class="pl-10 text-right font-mono font-bold text-lg h-11 bg-secondary/10 border-muted focus:border-blue-500 transition-colors"
                                                bind:value={payment.amount}
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>
                                </div>
                            {/each}
                        {/if}
                    </div>

                    <!-- Summary Calculation -->
                    <div
                        class="bg-muted/40 p-4 rounded-xl space-y-2 text-sm border"
                    >
                        <div class="flex justify-between text-muted-foreground">
                            <span>Total Dibayar</span>
                            <span class="font-medium text-foreground"
                                >{formatCurrency(controller.totalPaid)}</span
                            >
                        </div>
                        <Separator class="bg-border/50" />
                        {#if controller.remaining > 0}
                            <div
                                class="flex justify-between items-center text-red-600 font-bold text-lg"
                            >
                                <span>Kurang</span>
                                <span
                                    >{formatCurrency(
                                        controller.remaining,
                                    )}</span
                                >
                            </div>
                        {:else}
                            <div
                                class="flex justify-between items-center text-green-600 font-bold text-lg"
                            >
                                <span>Kembalian</span>
                                <span>{formatCurrency(controller.change)}</span>
                            </div>
                        {/if}
                    </div>
                </div>
            </div>
        </div>

        <DialogFooter class="p-4 border-t bg-background">
            <Button
                variant="outline"
                onclick={() => (controller.paymentOpen = false)}
                disabled={controller.loading}
                class="w-full sm:w-auto"
            >
                Batal
            </Button>
            <Button
                onclick={() => controller.processCheckout()}
                disabled={controller.loading || controller.remaining > 0}
                class="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20"
            >
                {#if controller.loading}
                    <div
                        class="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"
                    ></div>
                    Memproses...
                {:else}
                    Konfirmasi Pembayaran
                {/if}
            </Button>
        </DialogFooter>
    </DialogContent>
</Dialog>
