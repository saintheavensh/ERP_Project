import { toast } from "svelte-sonner";
import type { TaxSettings } from "$lib/features/settings/settings.service";
import type { CartItem } from "./sales.controller.svelte";

export class CartManager {
    items = $state<CartItem[]>([]);
    taxSettings = $state<TaxSettings>({
        enabled: false,
        rate: 0,
        label: "Tax",
        inclusive: false,
    });
    discountAmount = $state(0);

    get subtotal() {
        return this.items.reduce((sum, item) => sum + item.price * item.qty, 0);
    }

    get taxAmount() {
        if (!this.taxSettings.enabled) return 0;
        const subtotalAfterDiscount = Math.max(0, this.subtotal - this.discountAmount);
        const rate = this.taxSettings.rate / 100;
        if (this.taxSettings.inclusive) {
            return subtotalAfterDiscount - subtotalAfterDiscount / (1 + rate);
        } else {
            return subtotalAfterDiscount * rate;
        }
    }

    get totalWithTax() {
        const subtotalAfterDiscount = Math.max(0, this.subtotal - this.discountAmount);
        if (this.taxSettings.inclusive) {
            return subtotalAfterDiscount;
        }
        return subtotalAfterDiscount + this.taxAmount;
    }

    addToCart(product: any, variant: any) {
        if (variant.stock <= 0) {
            toast.error("Stok habis!");
            return;
        }

        const uniqueId = `${product.id}-${variant.name}`;
        const existingIdx = this.items.findIndex((c) => c.uniqueId === uniqueId);

        if (existingIdx >= 0) {
            if (this.items[existingIdx].qty + 1 > variant.stock) {
                toast.error("Stok tidak mencukupi");
                return;
            }
            this.items[existingIdx].qty += 1;
        } else {
            this.items = [
                ...this.items,
                {
                    uniqueId,
                    productId: product.id,
                    name: product.name,
                    variant: variant.name,
                    price: variant.price,
                    qty: 1,
                    maxQty: variant.stock,
                    code: product.code,
                },
            ];
        }
    }

    removeFromCart(index: number) {
        this.items = this.items.filter((_, i) => i !== index);
    }

    updateQty(index: number, delta: number) {
        const item = this.items[index];
        const newQty = item.qty + delta;

        if (newQty <= 0) {
            this.removeFromCart(index);
        } else if (newQty > item.maxQty) {
            toast.error("Maksimal stok: " + item.maxQty);
        } else {
            this.items[index].qty = newQty;
        }
    }

    clear() {
        this.items = [];
    }
}
