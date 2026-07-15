<script lang="ts">
    import * as Dialog from "$lib/shared/components/ui/dialog";
    import { Button } from "$lib/shared/components/ui/button";
    import { Input } from "$lib/shared/components/ui/input";
    import { Label } from "$lib/shared/components/ui/label";
    import { Textarea } from "$lib/shared/components/ui/textarea";
    import { CashRegisterService } from "../services/cash-register.service";
    import { toast } from "svelte-sonner";
    import { cn } from "$lib/shared/lib/utils";

    let { open = $bindable(false), expectedClosing = 0, onSuccess } = $props();

    let actualClosing = $state(0);
    let notes = $state("");
    let loading = $state(false);

    let difference = $derived(actualClosing - expectedClosing);
    let differenceColor = $derived(
        difference === 0
            ? "text-green-600"
            : difference < 0
              ? "text-red-600"
              : "text-blue-600",
    );

    async function handleSubmit() {
        if (actualClosing < 0) {
            toast.error("Cash count cannot be negative");
            return;
        }

        loading = true;
        try {
            const res = await CashRegisterService.close({
                actualClosing,
                notes,
            });
            toast.success(
                `Register Closed. Difference: Rp ${res.difference.toLocaleString()}`,
            );
            open = false;
            if (onSuccess) onSuccess();
        } catch (e: any) {
            toast.error(e.response?.data?.error || "Failed to close register");
        } finally {
            loading = false;
        }
    }
</script>

<Dialog.Root bind:open>
    <Dialog.Content class="sm:max-w-[425px]">
        <Dialog.Header>
            <Dialog.Title>Close Cash Register</Dialog.Title>
            <Dialog.Description>
                Perform final count of cash in drawer.
            </Dialog.Description>
        </Dialog.Header>
        <div class="grid gap-4 py-4">
            <div class="grid grid-cols-4 items-center gap-4">
                <Label class="text-right font-bold">Expected System Cash</Label>
                <div class="col-span-3 font-mono font-bold text-lg">
                    Rp {expectedClosing.toLocaleString()}
                </div>
            </div>

            <div class="grid grid-cols-4 items-center gap-4">
                <Label for="actual-closing" class="text-right"
                    >Actual Count</Label
                >
                <Input
                    id="actual-closing"
                    type="number"
                    bind:value={actualClosing}
                    class="col-span-3 font-mono"
                    min="0"
                />
            </div>

            <div class="grid grid-cols-4 items-center gap-4">
                <Label class="text-right font-bold">Difference</Label>
                <div
                    class={cn(
                        "col-span-3 font-mono font-bold text-lg",
                        differenceColor,
                    )}
                >
                    Rp {difference.toLocaleString()}
                    <span
                        class="text-xs font-normal text-muted-foreground ml-2"
                    >
                        {difference === 0
                            ? "(Match)"
                            : difference < 0
                              ? "(Shortage)"
                              : "(Overage)"}
                    </span>
                </div>
            </div>

            <div class="grid grid-cols-4 items-center gap-4">
                <Label for="notes" class="text-right">Notes</Label>
                <Textarea
                    id="notes"
                    bind:value={notes}
                    class="col-span-3"
                    placeholder="Any discrepancies or remarks..."
                />
            </div>
        </div>
        <Dialog.Footer>
            <Button
                type="submit"
                onclick={handleSubmit}
                variant="default"
                disabled={loading}
            >
                {loading ? "Closing..." : "Close Register & Print Report"}
            </Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>
