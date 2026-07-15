<script lang="ts">
    import { Button } from "$lib/shared/components/ui/button";
    import { Input } from "$lib/shared/components/ui/input";
    import { Label } from "$lib/shared/components/ui/label";
    import * as Select from "$lib/shared/components/ui/select";
    import { Textarea } from "$lib/shared/components/ui/textarea";
    import { ProductsService } from "$lib/features/inventory/products/products.service"; // Adjust if necessary based on real location
    import type {
        CreateDefectiveItemDTO,
        DefectiveItemSource,
    } from "../types/defective-items.types";
    import { toast } from "svelte-sonner";

    // Svelte 5 props
    let {
        onSubmit,
        onClose,
    }: {
        onSubmit: (data: CreateDefectiveItemDTO) => Promise<void>;
        onClose: () => void;
    } = $props();

    let formData: CreateDefectiveItemDTO = $state({
        productId: "",
        batchId: "",
        qty: 1,
        reason: "",
        source: "manual",
    });

    let notes = $state(""); // Optional notes to append to reason

    let products: any[] = $state([]);
    let batches: any[] = $state([]);
    let loadingProducts = $state(false);
    let loadingBatches = $state(false);
    let submitting = $state(false);

    async function loadProducts() {
        loadingProducts = true;
        try {
            // Adjust based on the actual ProductsService API
            products = await ProductsService.getAll();
        } catch (e) {
            console.error("Failed to load products", e);
            toast.error("Failed to load products");
        } finally {
            loadingProducts = false;
        }
    }

    async function loadBatches(productId: string) {
        if (!productId) return;
        loadingBatches = true;
        try {
            const product = await ProductsService.get(productId);
            batches = product.batches || [];
        } catch (e) {
            console.error("Failed to load batches", e);
            toast.error("Failed to load batches");
        } finally {
            loadingBatches = false;
        }
    }

    // Call loadProducts on mount implicitly when form is opened
    $effect(() => {
        if (products.length === 0) {
            loadProducts();
        }
    });

    // Load batches when product changes
    $effect(() => {
        if (formData.productId) {
            loadBatches(formData.productId);
            // Reset batch selection
            formData.batchId = "";
        }
    });

    async function handleSubmit() {
        if (
            !formData.productId ||
            !formData.batchId ||
            !formData.reason ||
            formData.qty <= 0
        ) {
            toast.error("Please fill all required fields correctly.");
            return;
        }

        submitting = true;
        // Append notes to reason if provided, separated by a dash or newline.
        const submittedReason = notes
            ? `${formData.reason} - ${notes}`
            : formData.reason;

        try {
            await onSubmit({
                ...formData,
                reason: submittedReason,
            });
            onClose();
        } catch (error) {
            // Error handled by controller, just catch here
        } finally {
            submitting = false;
        }
    }

    // Prepare lists for Select
    let productOptions = $derived(
        products.map((p) => ({ value: p.id, label: p.name })),
    );
    let batchOptions = $derived(
        batches.map((b) => ({
            value: b.id,
            label: `${b.batchNumber} (Stock: ${b.currentStock})`,
            disabled: b.currentStock <= 0,
        })),
    );

    // Removed old Shadcn Select states since we now bind natively

    const reasonOptions = [
        { value: "Rusak saat pengiriman", label: "Rusak saat pengiriman" },
        { value: "Cacat Produksi", label: "Cacat Produksi" },
        { value: "Salah Kirim", label: "Salah Kirim" },
        { value: "Expired", label: "Expired" },
        { value: "Lainnya", label: "Lainnya" },
    ];

    const sourceOptions = [
        { value: "manual", label: "Manual Report" },
        { value: "sales_return", label: "Sales Return" },
        { value: "service_return", label: "Service Return" },
    ];
</script>

<div class="space-y-6 pt-2">
    <div class="space-y-2">
        <Label for="product">Product</Label>
        <select
            id="product"
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={loadingProducts}
            bind:value={formData.productId}
        >
            <option value="" disabled selected
                >{loadingProducts ? "Loading..." : "Select product"}</option
            >
            {#each productOptions as opt}
                <option value={opt.value}>{opt.label}</option>
            {/each}
        </select>
    </div>

    <div class="space-y-2">
        <Label for="batch">Batch</Label>
        <select
            id="batch"
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!formData.productId || loadingBatches}
            bind:value={formData.batchId}
        >
            <option value="" disabled selected>
                {!formData.productId
                    ? "Select product first"
                    : loadingBatches
                      ? "Loading batches..."
                      : "Select batch"}
            </option>
            {#each batchOptions as opt}
                <option value={opt.value} disabled={opt.disabled}
                    >{opt.label}</option
                >
            {/each}
        </select>
    </div>

    <div class="grid grid-cols-2 gap-4">
        <div class="space-y-2">
            <Label for="qty">Quantity</Label>
            <Input id="qty" type="number" min="1" bind:value={formData.qty} />
        </div>
        <div class="space-y-2">
            <Label for="source">Source</Label>
            <select
                id="source"
                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                bind:value={formData.source}
            >
                {#each sourceOptions as opt}
                    <option value={opt.value}>{opt.label}</option>
                {/each}
            </select>
        </div>
    </div>

    <div class="space-y-2">
        <Label for="reason">Reason</Label>
        <select
            id="reason"
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
            bind:value={formData.reason}
        >
            <option value="" disabled selected>Select reason</option>
            {#each reasonOptions as opt}
                <option value={opt.value}>{opt.label}</option>
            {/each}
        </select>
    </div>

    <div class="space-y-2">
        <Label for="notes">Additional Notes</Label>
        <Textarea
            id="notes"
            bind:value={notes}
            placeholder="Details about the defect..."
            rows={3}
        />
    </div>

    <div class="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onclick={onClose}>Cancel</Button>
        <Button onclick={handleSubmit} disabled={submitting}>
            {submitting ? "Submitting..." : "Report Defective Item"}
        </Button>
    </div>
</div>
