<script lang="ts">
    import { Button } from "$lib/shared/components/ui/button";
    import { Input } from "$lib/shared/components/ui/input";
    import { Label } from "$lib/shared/components/ui/label";
    import { Textarea } from "$lib/shared/components/ui/textarea";
    import type {
        CreateServiceToolDTO,
        ServiceTool,
    } from "../types/service-tools.types";
    import { toast } from "svelte-sonner";

    let {
        tool = null,
        onSubmit,
        onClose,
    }: {
        tool?: ServiceTool | null;
        onSubmit: (data: CreateServiceToolDTO | any) => Promise<void>;
        onClose: () => void;
    } = $props();

    let submitting = $state(false);

    // Take a snapshot to avoid Svelte 5 warning about non-reactive props in $state
    let initialData: CreateServiceToolDTO = (() => {
        return tool
            ? {
                  name: tool.name || "",
                  brand: tool.brand || "",
                  qty: tool.qty || 1,
                  condition: tool.condition || "good",
                  price: tool.price || 0,
                  notes: tool.notes || "",
                  userId: tool.userId || "",
                  purchaseDate: tool.purchaseDate
                      ? new Date(tool.purchaseDate).toISOString().split("T")[0]
                      : "",
              }
            : {
                  name: "",
                  brand: "",
                  qty: 1,
                  condition: "good",
                  price: 0,
                  notes: "",
                  userId: "",
                  purchaseDate: "",
              };
    })();

    let formData = $state<CreateServiceToolDTO>(initialData);

    async function handleSubmit(e: Event) {
        e.preventDefault();

        if (!formData.name) return toast.error("Tool name is required");
        if (formData.qty <= 0)
            return toast.error("Quantity must be greater than zero");

        submitting = true;
        try {
            await onSubmit(formData);
        } finally {
            submitting = false;
        }
    }
</script>

<form onsubmit={handleSubmit} class="space-y-6">
    <div class="space-y-4">
        <div class="space-y-2">
            <Label for="name">Tool Name *</Label>
            <Input
                id="name"
                bind:value={formData.name}
                placeholder="e.g. Obeng Plus Relife"
                required
            />
        </div>

        <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
                <Label for="brand">Brand</Label>
                <Input
                    id="brand"
                    bind:value={formData.brand}
                    placeholder="e.g. Relife"
                />
            </div>
            <div class="space-y-2">
                <Label for="qty">Quantity *</Label>
                <Input
                    id="qty"
                    type="number"
                    min="1"
                    bind:value={formData.qty}
                    required
                />
            </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
                <Label for="condition">Condition *</Label>
                <select
                    id="condition"
                    class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                    bind:value={formData.condition}
                >
                    <option value="good">Good / Baru</option>
                    <option value="damaged">Damaged / Rusak</option>
                    <option value="lost">Lost / Hilang</option>
                </select>
            </div>
            <div class="space-y-2">
                <Label for="price">Price (Rp)</Label>
                <Input
                    id="price"
                    type="number"
                    min="0"
                    bind:value={formData.price}
                />
            </div>
        </div>

        <div class="space-y-2">
            <Label for="userId">Assigned Technician (ID)</Label>
            <Input
                id="userId"
                bind:value={formData.userId}
                placeholder="UUID Optional (Leave blank for HQ)"
            />
            <p class="text-xs text-slate-500">
                Leaving this blank means it's stored in main HQ/warehouse.
            </p>
        </div>

        <div class="space-y-2">
            <Label for="notes">Notes</Label>
            <Textarea
                id="notes"
                bind:value={formData.notes}
                placeholder="Any additional details or serial numbers..."
                rows={3}
            />
        </div>
    </div>

    <div
        class="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800"
    >
        <Button
            type="button"
            variant="outline"
            onclick={onClose}
            disabled={submitting}
        >
            Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
            {submitting ? "Saving..." : tool ? "Save Changes" : "Add Tool"}
        </Button>
    </div>
</form>
