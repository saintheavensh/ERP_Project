<script lang="ts">
    import * as Dialog from "$lib/shared/components/ui/dialog";
    import * as Select from "$lib/shared/components/ui/select";
    import { Button } from "$lib/shared/components/ui/button";
    import { Input } from "$lib/shared/components/ui/input";
    import { Label } from "$lib/shared/components/ui/label";
    import { Textarea } from "$lib/shared/components/ui/textarea";
    import { CashRegisterService } from "../services/cash-register.service";
    import { toast } from "svelte-sonner";

    let { open = $bindable(false), onSuccess } = $props();

    let amount = $state<number>(0);
    // Use string for category value
    let category = $state<string>("operasional");
    let description = $state("");
    let loading = $state(false);

    const categories = [
        {
            value: "operasional",
            label: "Operasional (Makan, Minum, Transport)",
        },
        { value: "perlengkapan", label: "Perlengkapan Toko" },
        { value: "gaji", label: "Gaji / Upah Harian" },
        { value: "lain-lain", label: "Lain-lain" },
    ];

    async function handleSubmit() {
        if (!amount || amount <= 0) {
            toast.error("Amount must be greater than 0");
            return;
        }
        if (!description) {
            toast.error("Description is required");
            return;
        }

        loading = true;
        try {
            await CashRegisterService.recordExpense({
                amount,
                category,
                description,
            });
            toast.success("Expense Recorded Successfully");
            open = false;
            // Reset form
            amount = 0;
            description = "";
            category = "operasional";
            if (onSuccess) onSuccess();
        } catch (e: any) {
            toast.error(e.response?.data?.error || "Failed to record expense");
        } finally {
            loading = false;
        }
    }
</script>

<Dialog.Root bind:open>
    <Dialog.Content class="sm:max-w-[425px]">
        <Dialog.Header>
            <Dialog.Title>Record Expense</Dialog.Title>
            <Dialog.Description>
                Catat pengeluaran tunai dari kasir (Maks Rp 500.000 tanpa
                approval)
            </Dialog.Description>
        </Dialog.Header>
        <div class="grid gap-4 py-4">
            <div class="grid grid-cols-4 items-center gap-4">
                <Label for="amount" class="text-right">Jumlah (Rp)</Label>
                <Input
                    id="amount"
                    type="number"
                    bind:value={amount}
                    class="col-span-3"
                    min="1"
                />
            </div>
            <div class="grid grid-cols-4 items-center gap-4">
                <Label for="category" class="text-right">Kategori</Label>
                <div class="col-span-3">
                    <Select.Root type="single" bind:value={category}>
                        <Select.Trigger>
                            {categories.find((c) => c.value === category)
                                ?.label || "Pilih Kategori"}
                        </Select.Trigger>
                        <Select.Content>
                            {#each categories as cat}
                                <Select.Item value={cat.value}
                                    >{cat.label}</Select.Item
                                >
                            {/each}
                        </Select.Content>
                    </Select.Root>
                </div>
            </div>
            <div class="grid grid-cols-4 items-center gap-4">
                <Label for="description" class="text-right">Keterangan</Label>
                <Textarea
                    id="description"
                    bind:value={description}
                    class="col-span-3"
                    placeholder="Contoh: Beli air galon"
                />
            </div>
        </div>
        <Dialog.Footer>
            <Button
                type="submit"
                onclick={handleSubmit}
                disabled={loading}
                variant="destructive"
            >
                {loading ? "Saving..." : "Record Expense"}
            </Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>
