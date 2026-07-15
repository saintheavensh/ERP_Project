<script lang="ts">
    import { onMount } from "svelte";
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
    } from "$lib/shared/components/ui/card";
    import { Button } from "$lib/shared/components/ui/button";
    import { Input } from "$lib/shared/components/ui/input";
    import {
        Table,
        TableBody,
        TableCell,
        TableHead,
        TableHeader,
        TableRow,
    } from "$lib/shared/components/ui/table";
    import {
        Eye,
        FileText,
        Search,
        Calendar,
        Maximize2,
        ChevronRight,
        CheckCircle2,
        XCircle,
        Loader2,
    } from "lucide-svelte";
    import { Badge } from "$lib/shared/components/ui/badge";
    import { JournalsController } from "$lib/features/finance/accounting/journals/journals.controller.svelte";

    const controller = new JournalsController();

    onMount(() => {
        controller.init();
    });

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(val);

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    function getReferenceTypeLabel(type: string) {
        const types: Record<string, string> = {
            manual: "Manual Journal",
            invoice: "Invoice",
            payment: "Payment",
            receipt: "Receipt",
            expense: "Expense",
            purchase: "Purchase",
            purchase_return: "Purchase Return",
            sales_return: "Sales Return",
            opname: "Stock Opname",
            depreciation: "Depreciation",
        };
        return types[type] || type;
    }

    function getStatusBadge(status: string) {
        switch (status) {
            case "posted":
                return "bg-green-100 text-green-700";
            case "void":
                return "bg-red-100 text-red-700";
            default:
                return "bg-yellow-100 text-yellow-700";
        }
    }
</script>

<div class="space-y-6 animate-in fade-in duration-500 pb-10">
    <!-- Header -->
    <div
        class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
    >
        <div>
            <div class="flex items-center gap-2 text-slate-500 text-sm mb-1">
                <a href="/accounting" class="hover:text-blue-600">Akuntansi</a>
                <ChevronRight class="h-4 w-4" />
                <span class="text-slate-900 font-medium">Jurnal Umum</span>
            </div>
            <h1 class="text-2xl font-bold text-slate-900 dark:text-white">
                General Journal
            </h1>
        </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Journal List -->
        <div class="lg:col-span-2">
            {#if controller.loading}
                <div class="flex items-center justify-center py-20">
                    <Loader2 class="h-8 w-8 animate-spin text-blue-600" />
                </div>
            {:else}
                <Card class="border-0 shadow-lg rounded-2xl overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow class="bg-slate-50">
                                <TableHead class="w-28">Tanggal</TableHead>
                                <TableHead>Deskripsi</TableHead>
                                <TableHead class="w-28">Tipe</TableHead>
                                <TableHead class="text-right w-32"
                                    >Jumlah</TableHead
                                >
                                <TableHead class="w-20">Status</TableHead>
                                <TableHead class="w-16"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {#each controller.journals as journal}
                                <TableRow
                                    class="hover:bg-slate-50 cursor-pointer"
                                    onclick={() =>
                                        controller.viewJournal(journal.id)}
                                >
                                    <TableCell class="font-mono text-sm">
                                        {formatDate(journal.date)}
                                    </TableCell>
                                    <TableCell>
                                        <p
                                            class="font-medium truncate max-w-[250px]"
                                        >
                                            {journal.description}
                                        </p>
                                        <p class="text-xs text-slate-500">
                                            {journal.id}
                                        </p>
                                    </TableCell>
                                    <TableCell>
                                        <span
                                            class="text-xs bg-slate-100 px-2 py-1 rounded-full"
                                        >
                                            {getReferenceTypeLabel(
                                                journal.referenceType,
                                            )}
                                        </span>
                                    </TableCell>
                                    <TableCell class="text-right font-mono">
                                        {formatCurrency(journal.totalDebit)}
                                    </TableCell>
                                    <TableCell>
                                        <span
                                            class="text-xs px-2 py-1 rounded-full {getStatusBadge(
                                                journal.status,
                                            )}"
                                        >
                                            {journal.status === "posted"
                                                ? "Posted"
                                                : "Void"}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onclick={() =>
                                                controller.viewJournal(
                                                    journal.id,
                                                )}
                                        >
                                            <Eye class="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            {:else}
                                <TableRow>
                                    <TableCell
                                        colspan={6}
                                        class="text-center py-10 text-slate-500"
                                    >
                                        Belum ada jurnal
                                    </TableCell>
                                </TableRow>
                            {/each}
                        </TableBody>
                    </Table>
                </Card>
            {/if}
        </div>

        <!-- Journal Detail -->
        <div>
            {#if controller.selectedJournal}
                <Card class="border-0 shadow-lg rounded-2xl sticky top-4">
                    <CardHeader class="border-b">
                        <CardTitle class="text-lg flex items-center gap-2">
                            <FileText class="h-5 w-5 text-blue-600" />
                            Detail Jurnal
                        </CardTitle>
                    </CardHeader>
                    <CardContent class="space-y-4 p-4">
                        <div class="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p class="text-slate-500">ID</p>
                                <p class="font-mono">
                                    {controller.selectedJournal.id}
                                </p>
                            </div>
                            <div>
                                <p class="text-slate-500">Tanggal</p>
                                <p>
                                    {formatDate(
                                        controller.selectedJournal.date,
                                    )}
                                </p>
                            </div>
                            <div class="col-span-2">
                                <p class="text-slate-500">Deskripsi</p>
                                <p class="font-medium">
                                    {controller.selectedJournal.description}
                                </p>
                            </div>
                        </div>

                        <div class="border-t pt-4">
                            <p class="text-sm font-medium mb-2">
                                Detail Transaksi
                            </p>
                            <div class="space-y-2">
                                {#if controller.selectedJournal.lines}
                                    {#each controller.selectedJournal.lines as line}
                                        <div
                                            class="flex justify-between text-sm p-2 bg-slate-50 rounded"
                                        >
                                            <div>
                                                <p class="font-medium">
                                                    {line.accountName ||
                                                        line.accountId}
                                                </p>
                                                <p
                                                    class="text-xs text-slate-500"
                                                >
                                                    {line.description}
                                                </p>
                                            </div>
                                            <div class="text-right">
                                                {#if line.debit > 0}
                                                    <p
                                                        class="text-green-600 font-mono"
                                                    >
                                                        D {formatCurrency(
                                                            line.debit,
                                                        )}
                                                    </p>
                                                {/if}
                                                {#if line.credit > 0}
                                                    <p
                                                        class="text-red-600 font-mono"
                                                    >
                                                        C {formatCurrency(
                                                            line.credit,
                                                        )}
                                                    </p>
                                                {/if}
                                            </div>
                                        </div>
                                    {/each}
                                {/if}
                            </div>
                        </div>

                        <!-- Totals -->
                        <div
                            class="border-t pt-4 flex justify-between text-sm font-bold"
                        >
                            <span>Total</span>
                            <div class="text-right">
                                <p class="text-green-600">
                                    D {formatCurrency(
                                        controller.selectedJournal.totalDebit,
                                    )}
                                </p>
                                <p class="text-red-600">
                                    C {formatCurrency(
                                        controller.selectedJournal.totalCredit,
                                    )}
                                </p>
                            </div>
                        </div>

                        {#if controller.selectedJournal.status === "posted"}
                            <div
                                class="flex items-center gap-2 text-green-600 text-sm"
                            >
                                <CheckCircle2 class="h-4 w-4" />
                                <span>Balanced & Posted</span>
                            </div>
                        {:else}
                            <div
                                class="flex items-center gap-2 text-red-600 text-sm"
                            >
                                <XCircle class="h-4 w-4" />
                                <span>Voided</span>
                            </div>
                        {/if}
                    </CardContent>
                </Card>
            {:else}
                <Card class="border-0 shadow-md rounded-2xl">
                    <CardContent class="p-8 text-center text-slate-500">
                        <FileText
                            class="h-12 w-12 mx-auto mb-4 text-slate-300"
                        />
                        <p>Pilih jurnal untuk melihat detail</p>
                    </CardContent>
                </Card>
            {/if}
        </div>
    </div>
</div>
