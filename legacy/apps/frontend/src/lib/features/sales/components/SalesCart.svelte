<script lang="ts">
    import { Button } from "$lib/shared/components/ui/button";
    import { Badge } from "$lib/shared/components/ui/badge";
    import {
        ShoppingBag,
        Trash2,
        Minus,
        Plus,
        CreditCard,
    } from "lucide-svelte";
    import { formatCurrency } from "$lib/shared/lib/utils";
    import type { SalesController } from "./sales.controller.svelte";

    let { controller }: { controller: SalesController } = $props();
</script>

<div class="flex flex-col h-full">
    <!-- Cart Header -->
    <div
        class="p-5 border-b bg-background/95 backdrop-blur z-10 flex-shrink-0 flex items-center justify-between"
    >
        <div>
            <h2
                class="font-bold text-lg flex items-center gap-2 text-foreground"
            >
                <ShoppingBag class="h-5 w-5 text-blue-600" /> Current Order
            </h2>
            <p class="text-xs text-muted-foreground mt-0.5">
                {controller.cart.length} items added
            </p>
        </div>

        {#if controller.cart.length > 0}
            <Button
                variant="ghost"
                size="icon"
                class="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-50"
                onclick={() => (controller.cart = [])}
                title="Hapus Semua"
            >
                <Trash2 class="h-4 w-4" />
            </Button>
        {/if}
    </div>

    <!-- Cart Items -->
    <div class="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/10">
        {#if controller.cart.length === 0}
            <div
                class="h-full flex flex-col items-center justify-center text-muted-foreground text-center p-8 opacity-60"
            >
                <div
                    class="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4"
                >
                    <ShoppingBag class="h-8 w-8 opacity-40" />
                </div>
                <p class="font-medium">Keranjang Kosong</p>
                <p class="text-xs mt-1">
                    Pilih produk dari katalog untuk memulai pesanan.
                </p>
            </div>
        {:else}
            {#each controller.cart as item, i (item.uniqueId)}
                <div
                    class="group bg-background p-3 rounded-xl border shadow-sm hover:shadow-md transition-all border-l-4 border-l-blue-500 flex flex-col gap-2 relative animate-in slide-in-from-right-2 duration-300"
                >
                    <div class="flex justify-between items-start gap-3">
                        <div class="min-w-0">
                            <h4
                                class="font-semibold text-sm leading-tight text-foreground"
                            >
                                {item.name}
                            </h4>
                            <div class="flex items-center gap-2 mt-1">
                                <Badge
                                    variant="secondary"
                                    class="h-4 px-1 text-[10px] font-normal bg-blue-50 text-blue-700 hover:bg-blue-100"
                                    >{item.variant}</Badge
                                >
                                {#if item.code}
                                    <span
                                        class="text-[10px] text-muted-foreground font-mono"
                                        >{item.code}</span
                                    >
                                {/if}
                            </div>
                        </div>
                        <div class="font-bold text-sm text-right">
                            {formatCurrency(item.price * item.qty)}
                        </div>
                    </div>

                    <div
                        class="flex items-center justify-between pt-1 border-t border-dashed mt-1"
                    >
                        <div class="text-[10px] text-muted-foreground">
                            @ {formatCurrency(item.price)}
                        </div>
                        <div
                            class="flex items-center bg-secondary/30 rounded-lg p-0.5"
                        >
                            <button
                                class="h-6 w-6 flex items-center justify-center rounded-md hover:bg-background text-foreground transition-colors active:scale-95 disabled:opacity-50"
                                onclick={() => controller.updateQty(i, -1)}
                            >
                                <Minus class="h-3 w-3" />
                            </button>
                            <span
                                class="w-8 text-center text-xs font-semibold tabular-nums"
                                >{item.qty}</span
                            >
                            <button
                                class="h-6 w-6 flex items-center justify-center rounded-md hover:bg-background text-foreground transition-colors active:scale-95 disabled:opacity-50"
                                onclick={() => controller.updateQty(i, 1)}
                                disabled={item.qty >= item.maxQty}
                            >
                                <Plus class="h-3 w-3" />
                            </button>
                        </div>
                    </div>
                </div>
            {/each}
        {/if}
    </div>

    <!-- Cart Footer -->
    <div
        class="p-5 bg-background border-t shadow-[0_-5px_20px_-10px_rgba(0,0,0,0.1)] z-20 space-y-4"
    >
        <div class="space-y-2">
            <div class="flex justify-between text-sm text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatCurrency(controller.subtotal)}</span>
            </div>

            <div class="flex justify-between items-center text-sm text-red-600">
                <span>Diskon</span>
                <div class="flex items-center gap-2">
                    <span class="text-xs">-</span>
                    <input
                        type="number"
                        bind:value={controller.discountAmount}
                        class="w-24 h-8 bg-muted rounded-lg text-right px-2 font-bold focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                </div>
            </div>

            {#if controller.taxSettings.enabled}
                <div class="flex justify-between text-sm text-muted-foreground">
                    <span>{controller.taxSettings.label}</span>
                    <span>{formatCurrency(controller.taxAmount)}</span>
                </div>
            {/if}

            <div
                class="flex justify-between items-end border-t border-dashed pt-2 mt-2"
            >
                <span class="font-bold text-base">Total Tagihan</span>
                <span class="font-bold text-xl text-blue-600"
                    >{formatCurrency(controller.totalWithTax)}</span
                >
            </div>
        </div>

        <Button
            size="lg"
            class="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all"
            disabled={controller.cart.length === 0}
            onclick={() => controller.openCheckout()}
        >
            <CreditCard class="mr-2 h-4 w-4" />
            Bayar Sekarang
        </Button>
    </div>
</div>
