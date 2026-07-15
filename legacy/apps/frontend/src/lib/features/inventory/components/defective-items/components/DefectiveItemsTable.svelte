<script lang="ts">
    import { Badge } from "$lib/shared/components/ui/badge";
    import { Button } from "$lib/shared/components/ui/button";
    import { Checkbox } from "$lib/shared/components/ui/checkbox";
    import {
        Table,
        TableHeader,
        TableRow,
        TableHead,
        TableBody,
        TableCell,
    } from "$lib/shared/components/ui/table";
    import { Textarea } from "$lib/shared/components/ui/textarea";
    import {
        Dialog,
        DialogContent,
        DialogHeader,
        DialogTitle,
        DialogFooter,
    } from "$lib/shared/components/ui/dialog";

    let {
        items,
        selectedItems,
        onToggleSelect,
        onSelectAllPending,
        onProcessReturn,
        type = "pending",
    }: {
        items: any[];
        selectedItems: string[];
        onToggleSelect: (id: string) => void;
        onSelectAllPending: () => void;
        onProcessReturn: (ids: string[], notes?: string) => void;
        type?: "pending" | "processed";
    } = $props();

    let showReturnDialog = $state(false);
    let returnNotes = $state("");

    function getStatusBadgeVariant(status: string) {
        const variants: Record<
            string,
            "default" | "secondary" | "destructive" | "outline"
        > = {
            pending: "default", // or warning color if available, default usually is primary
            processed: "secondary", // success color
            cancelled: "destructive",
        };
        return variants[status.toLowerCase()] || "secondary";
    }

    function handleProcessReturnSubmit() {
        onProcessReturn(selectedItems, returnNotes);
        showReturnDialog = false;
        returnNotes = ""; // reset
    }

    let allSelected = $derived(
        items.length > 0 && selectedItems.length === items.length,
    );
</script>

<div class="space-y-4">
    {#if type === "pending" && selectedItems.length > 0}
        <div
            class="flex justify-end bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-lg items-center shadow-sm"
        >
            <span
                class="mr-4 text-sm font-medium text-slate-700 dark:text-slate-300"
            >
                {selectedItems.length} items selected
            </span>
            <Button
                onclick={() => (showReturnDialog = true)}
                class="bg-blue-600 hover:bg-blue-700 text-white"
            >
                Process Return
            </Button>
        </div>
    {/if}

    <div class="border rounded-md">
        <Table>
            <TableHeader class="bg-slate-50 dark:bg-slate-900/50">
                <TableRow>
                    {#if type === "pending"}
                        <TableHead class="w-12 text-center">
                            <Checkbox
                                id="select-all"
                                checked={allSelected}
                                onCheckedChange={onSelectAllPending}
                            />
                        </TableHead>
                    {/if}
                    <TableHead>Product</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead class="text-right">Quantity</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {#if items.length === 0}
                    <TableRow>
                        <TableCell
                            colspan={type === "pending" ? 8 : 7}
                            class="text-center py-8 text-slate-500"
                        >
                            No {type} defective items found.
                        </TableCell>
                    </TableRow>
                {/if}
                {#each items as item (item.id)}
                    <TableRow>
                        {#if type === "pending"}
                            <TableCell class="text-center">
                                <Checkbox
                                    id={`select-${item.id}`}
                                    checked={selectedItems.includes(item.id)}
                                    onCheckedChange={() =>
                                        onToggleSelect(item.id)}
                                />
                            </TableCell>
                        {/if}
                        <TableCell class="font-medium">
                            {item.product?.name || item.productId}
                        </TableCell>
                        <TableCell>
                            <span class="font-mono text-xs"
                                >{item.batch?.batchNumber || item.batchId}</span
                            >
                        </TableCell>
                        <TableCell class="text-right font-semibold">
                            {item.qty}
                        </TableCell>
                        <TableCell>
                            <span class="text-sm">{item.reason}</span>
                        </TableCell>
                        <TableCell>
                            <span
                                class="text-xs uppercase tracking-wider text-slate-500"
                                >{item.source?.replace("_", " ")}</span
                            >
                        </TableCell>
                        <TableCell>
                            <Badge
                                variant={getStatusBadgeVariant(item.status)}
                                class={item.status === "pending"
                                    ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300 hover:bg-amber-200"
                                    : item.status === "processed"
                                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300 hover:bg-emerald-200"
                                      : ""}
                            >
                                {item.status.toUpperCase()}
                            </Badge>
                        </TableCell>
                        <TableCell class="text-sm text-slate-500">
                            {new Date(item.createdAt).toLocaleDateString()}
                        </TableCell>
                    </TableRow>
                {/each}
            </TableBody>
        </Table>
    </div>
</div>

<Dialog bind:open={showReturnDialog}>
    <DialogContent>
        <DialogHeader>
            <DialogTitle>Process Purchase Return</DialogTitle>
        </DialogHeader>
        <div class="py-4">
            <p class="mb-4 text-sm text-slate-600">
                You are about to process a return for {selectedItems.length} defective
                items to their respective suppliers.
            </p>
            <div class="space-y-2">
                <label for="return-notes" class="text-sm font-medium"
                    >Return Notes (Optional)</label
                >
                <Textarea
                    id="return-notes"
                    bind:value={returnNotes}
                    placeholder="E.g. Returning items due to factory defects..."
                    rows={4}
                />
            </div>
        </div>
        <DialogFooter>
            <Button
                variant="outline"
                onclick={() => (showReturnDialog = false)}
            >
                Cancel
            </Button>
            <Button onclick={handleProcessReturnSubmit}>Confirm Process</Button>
        </DialogFooter>
    </DialogContent>
</Dialog>
