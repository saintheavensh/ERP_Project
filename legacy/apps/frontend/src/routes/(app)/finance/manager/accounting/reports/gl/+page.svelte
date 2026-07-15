<script lang="ts">
    import { onMount } from "svelte";
    import {
        AccountingReportService,
        type GeneralLedgerParams,
    } from "$lib/features/finance/accounting/services/accounting-reports.service";
    import { AccountsService } from "$lib/features/finance/accounting/accounts/accounts.service";
    import { Button } from "$lib/shared/components/ui/button";
    import { Input } from "$lib/shared/components/ui/input";
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
    } from "$lib/shared/components/ui/card";
    import {
        Table,
        TableBody,
        TableCell,
        TableHead,
        TableHeader,
        TableRow,
    } from "$lib/shared/components/ui/table";
    import { Loader2, ArrowLeft, Printer } from "lucide-svelte";
    import { page } from "$app/stores";

    let loading = $state(false);
    let accounts = $state<any[]>([]);
    let reportData = $state<any>(null);

    // Filters
    let selectedAccountId = $state("");
    let startDate = $state(
        new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            .toISOString()
            .split("T")[0],
    ); // First day of month
    let endDate = $state(new Date().toISOString().split("T")[0]); // Today

    onMount(async () => {
        try {
            const allAccounts = await AccountsService.getAll();
            accounts = allAccounts.sort((a: any, b: any) =>
                a.code.localeCompare(b.code),
            );

            // Auto select if param exists
            const paramId = $page.url.searchParams.get("accountId");
            if (paramId) {
                selectedAccountId = paramId;
                loadReport();
            }
        } catch (e) {
            console.error(e);
        }
    });

    async function loadReport() {
        if (!selectedAccountId) return;

        try {
            loading = true;
            reportData = await AccountingReportService.getGeneralLedger({
                accountId: selectedAccountId,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
            });
        } catch (e) {
            console.error(e);
            alert("Gagal memuat laporan");
        } finally {
            loading = false;
        }
    }

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(val);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };
</script>

<div class="space-y-6 animate-in fade-in duration-500 pb-10">
    <div class="flex items-center gap-4 no-print">
        <Button variant="ghost" size="icon" href="/accounting/reports">
            <ArrowLeft class="h-4 w-4" />
        </Button>
        <div>
            <h1 class="text-2xl font-bold text-slate-900">
                Buku Besar (General Ledger)
            </h1>
            <p class="text-slate-500">Detail mutasi per akun.</p>
        </div>
        <div class="ml-auto">
            <Button
                variant="outline"
                size="icon"
                onclick={() => window.print()}
            >
                <Printer class="h-4 w-4" />
            </Button>
        </div>
    </div>

    <!-- Filters -->
    <Card class="no-print">
        <CardContent class="p-4 flex flex-wrap gap-4 items-end">
            <div class="space-y-2 min-w-[300px]">
                <label for="account-select" class="text-sm font-medium"
                    >Akun</label
                >
                <select
                    id="account-select"
                    bind:value={selectedAccountId}
                    class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <option value="" disabled>Pilih Akun...</option>
                    {#each accounts as acc}
                        <option value={acc.id}>{acc.code} - {acc.name}</option>
                    {/each}
                </select>
            </div>

            <div class="space-y-2">
                <label for="start-date" class="text-sm font-medium"
                    >Dari Tanggal</label
                >
                <Input id="start-date" type="date" bind:value={startDate} />
            </div>

            <div class="space-y-2">
                <label for="end-date" class="text-sm font-medium"
                    >Sampai Tanggal</label
                >
                <Input id="end-date" type="date" bind:value={endDate} />
            </div>

            <Button
                onclick={loadReport}
                disabled={loading || !selectedAccountId}
            >
                {#if loading}
                    <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                {/if}
                Tampilkan
            </Button>
        </CardContent>
    </Card>

    {#if reportData}
        <Card class="print-border-none print-shadow-none">
            <CardHeader class="pb-2 text-center hidden print-block">
                <CardTitle
                    >Buku Besar: {accounts.find(
                        (a) => a.id === selectedAccountId,
                    )?.name || "-"}</CardTitle
                >
                <p class="text-sm text-slate-500">
                    Periode: {formatDate(startDate)} - {formatDate(endDate)}
                </p>
            </CardHeader>
            <CardContent>
                <div class="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead class="w-[120px]">Tanggal</TableHead>
                                <TableHead class="w-[120px]">Ref</TableHead>
                                <TableHead>Keterangan</TableHead>
                                <TableHead class="text-right w-[140px]"
                                    >Debit</TableHead
                                >
                                <TableHead class="text-right w-[140px]"
                                    >Kredit</TableHead
                                >
                                <TableHead
                                    class="text-right w-[150px] bg-slate-50"
                                    >Saldo</TableHead
                                >
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <!-- Opening Balance Row -->
                            <TableRow
                                class="bg-slate-50/50 hover:bg-slate-50/50"
                            >
                                <TableCell colspan={3} class="font-medium"
                                    >Saldo Awal (Per {formatDate(
                                        startDate,
                                    )})</TableCell
                                >
                                <TableCell class="text-right">-</TableCell>
                                <TableCell class="text-right">-</TableCell>
                                <TableCell
                                    class="text-right font-bold bg-slate-50"
                                >
                                    {formatCurrency(reportData.openingBalance)}
                                </TableCell>
                            </TableRow>

                            <!-- Transactions -->
                            {#each reportData.transactions as tx}
                                <TableRow>
                                    <TableCell class="font-mono text-xs"
                                        >{formatDate(tx.date)}</TableCell
                                    >
                                    <TableCell
                                        class="font-mono text-xs text-slate-500"
                                    >
                                        {tx.id.substring(0, 12)}...
                                    </TableCell>
                                    <TableCell>
                                        <div
                                            class="font-medium text-xs text-slate-900"
                                        >
                                            {tx.description}
                                        </div>
                                        {#if tx.lineDesc && tx.lineDesc !== tx.description}
                                            <div class="text-xs text-slate-500">
                                                {tx.lineDesc}
                                            </div>
                                        {/if}
                                    </TableCell>
                                    <TableCell
                                        class="text-right font-mono text-xs"
                                    >
                                        {#if tx.debit > 0}
                                            {formatCurrency(tx.debit)}
                                        {/if}
                                    </TableCell>
                                    <TableCell
                                        class="text-right font-mono text-xs"
                                    >
                                        {#if tx.credit > 0}
                                            {formatCurrency(tx.credit)}
                                        {/if}
                                    </TableCell>
                                    <TableCell
                                        class="text-right font-mono text-xs font-medium bg-slate-50"
                                    >
                                        {formatCurrency(tx.balance)}
                                    </TableCell>
                                </TableRow>
                            {/each}

                            {#if reportData.transactions.length === 0}
                                <TableRow>
                                    <TableCell
                                        colspan={6}
                                        class="text-center py-8 text-slate-500"
                                    >
                                        Tidak ada transaksi pada periode ini.
                                    </TableCell>
                                </TableRow>
                            {/if}

                            <!-- Closing Row -->
                            <TableRow class="bg-slate-100 font-bold border-t-2">
                                <TableCell colspan={3}>Saldo Akhir</TableCell>
                                <TableCell class="text-right">
                                    {formatCurrency(
                                        reportData.transactions.reduce(
                                            (acc: any, t: any) => acc + t.debit,
                                            0,
                                        ),
                                    )}
                                </TableCell>
                                <TableCell class="text-right">
                                    {formatCurrency(
                                        reportData.transactions.reduce(
                                            (acc: any, t: any) =>
                                                acc + t.credit,
                                            0,
                                        ),
                                    )}
                                </TableCell>
                                <TableCell class="text-right bg-slate-200">
                                    {formatCurrency(reportData.closingBalance)}
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    {/if}
</div>

<style>
    @media print {
        :global(.no-print) {
            display: none !important;
        }
        :global(.print-block) {
            display: block !important;
        }
        :global(.print-shadow-none) {
            box-shadow: none !important;
            border: none !important;
        }
        /* Ensure table prints nicely */
        :global(td),
        :global(th) {
            padding: 4px 8px !important;
            font-size: 10px !important;
        }
    }
</style>
