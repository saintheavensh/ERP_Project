<script lang="ts">
    import * as Dialog from "$lib/shared/components/ui/dialog";
    import { Input } from "$lib/shared/components/ui/input";
    import { Button } from "$lib/shared/components/ui/button";
    import { ShieldCheck, Loader2 } from "lucide-svelte";
    import { SalesController } from "./sales.controller.svelte";

    let { controller }: { controller: SalesController } = $props();
</script>

<Dialog.Root bind:open={controller.showApprovalModal}>
    <Dialog.Content class="sm:max-w-[425px] rounded-3xl">
        <Dialog.Header>
            <Dialog.Title class="flex items-center gap-2">
                <ShieldCheck class="h-6 w-6 text-indigo-600" />
                Manager Approval Required
            </Dialog.Title>
            <Dialog.Description>
                The requested action requires a manager override. Please enter
                an Approval ID.
            </Dialog.Description>
        </Dialog.Header>
        <div class="grid gap-4 py-4">
            <div class="space-y-2">
                <label for="approval-id" class="text-sm font-medium"
                    >Approval ID</label
                >
                <Input
                    id="approval-id"
                    bind:value={controller.approvalId}
                    placeholder="Enter approval ID from manager..."
                    class="h-12 rounded-xl border-2 focus:ring-indigo-500"
                />
            </div>
            {#if controller.pendingApprovalData}
                <div
                    class="p-4 bg-amber-50 rounded-2xl border border-amber-100 text-sm text-amber-800"
                >
                    <p
                        class="font-bold uppercase tracking-tight text-[10px] mb-1 text-amber-600"
                    >
                        REASON
                    </p>
                    <p>
                        {#if controller.pendingApprovalData.type === "DISCOUNT"}
                            High discount: <strong
                                >{controller.pendingApprovalData.amount.toFixed(
                                    1,
                                )}%</strong
                            >
                        {/if}
                    </p>
                </div>
            {/if}
        </div>
        <Dialog.Footer>
            <Button
                variant="ghost"
                onclick={() => (controller.showApprovalModal = false)}
                >Cancel</Button
            >
            <Button
                class="bg-indigo-600 hover:bg-indigo-700 rounded-xl px-8"
                onclick={() => {
                    controller.showApprovalModal = false;
                    controller.processCheckout();
                }}
                disabled={!controller.approvalId}
            >
                Confirm & Continue
            </Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>
