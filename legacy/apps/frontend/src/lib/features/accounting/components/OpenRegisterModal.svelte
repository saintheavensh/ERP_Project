<script lang="ts">
    import * as Dialog from "$lib/shared/components/ui/dialog";
    import { Button } from "$lib/shared/components/ui/button";
    import { Input } from "$lib/shared/components/ui/input";
    import { Label } from "$lib/shared/components/ui/label";
    import { CashRegisterService } from "../services/cash-register.service";
    import { toast } from "svelte-sonner";

    let { open = $bindable(false), onSuccess } = $props();

    let openingBalance = $state(0);
    let loading = $state(false);

    async function handleSubmit() {
        if (openingBalance < 0) {
            toast.error("Opening balance cannot be negative");
            return;
        }

        loading = true;
        try {
            await CashRegisterService.open(openingBalance);
            toast.success("Cash Register Opened Successfully");
            open = false;
            if (onSuccess) onSuccess();
        } catch (e: any) {
            toast.error(e.response?.data?.error || "Failed to open register");
        } finally {
            loading = false;
        }
    }
</script>

<Dialog.Root bind:open>
    <Dialog.Content class="sm:max-w-[425px]">
        <Dialog.Header>
            <Dialog.Title>Open Cash Register</Dialog.Title>
            <Dialog.Description>
                Enter the starting cash amount in the drawer to begin the
                session.
            </Dialog.Description>
        </Dialog.Header>
        <div class="grid gap-4 py-4">
            <div class="grid grid-cols-4 items-center gap-4">
                <Label for="opening-balance" class="text-right">Balance</Label>
                <Input
                    id="opening-balance"
                    type="number"
                    bind:value={openingBalance}
                    class="col-span-3"
                    min="0"
                />
            </div>
        </div>
        <Dialog.Footer>
            <Button type="submit" onclick={handleSubmit} disabled={loading}>
                {loading ? "Opening..." : "Open Register"}
            </Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>
