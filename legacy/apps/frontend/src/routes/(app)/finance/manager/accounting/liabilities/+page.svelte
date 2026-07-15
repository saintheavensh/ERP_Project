<script lang="ts">
    import { onMount } from "svelte";
    import { LiabilitiesController } from "./liabilities.controller.svelte";
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
    } from "$lib/shared/components/ui/card";
    import { Button } from "$lib/shared/components/ui/button";
    import { Input } from "$lib/shared/components/ui/input";
    import { Label } from "$lib/shared/components/ui/label";
    import {
        Tabs,
        TabsContent,
        TabsList,
        TabsTrigger,
    } from "$lib/shared/components/ui/tabs";
    import {
        Table,
        TableBody,
        TableCell,
        TableHead,
        TableHeader,
        TableRow,
    } from "$lib/shared/components/ui/table";
    import {
        Dialog,
        DialogContent,
        DialogHeader,
        DialogTitle,
        DialogFooter,
    } from "$lib/shared/components/ui/dialog";
    import { Badge } from "$lib/shared/components/ui/badge";
    import {
        Loader2,
        AlertCircle,
        FileText,
        Truck,
        Users,
        Wallet,
    } from "lucide-svelte";

    const controller = new LiabilitiesController();

    onMount(() => {
        controller.init();
    });
</script>

<div class="space-y-6 pb-20 animate-in fade-in duration-500">
    <div class="flex flex-col gap-2">
        <h1 class="text-3xl font-bold tracking-tight">
            Manajemen Hutang (Liabilities)
        </h1>
        <p class="text-muted-foreground">
            Pantau dan kelola semua kewajiban pembayaran: Hutang Supplier, Biaya
            Operasional, dan Komisi Teknisi.
        </p>
    </div>

    <!-- Summary Cards -->
    <div class="grid gap-4 md:grid-cols-4">
        <Card
            class="bg-gradient-to-br from-red-500 to-rose-600 text-white border-0 shadow-lg"
        >
            <CardHeader class="pb-2">
                <CardTitle
                    class="text-sm font-medium text-red-100 flex items-center gap-2"
                >
                    <Wallet class="h-4 w-4" /> Total Kewajiban
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div class="text-2xl font-bold">
                    {controller.summary
                        ? controller.formatRp(controller.summary.total)
                        : "..."}
                </div>
                <p class="text-xs text-red-100/80 mt-1">Semua kategori</p>
            </CardContent>
        </Card>

        <Card>
            <CardHeader class="pb-2">
                <CardTitle
                    class="text-sm font-medium text-muted-foreground flex items-center gap-2"
                >
                    <Truck class="h-4 w-4" /> Hutang Supplier
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div class="text-2xl font-bold">
                    {controller.summary
                        ? controller.formatRp(controller.summary.supplierDebt)
                        : "..."}
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader class="pb-2">
                <CardTitle
                    class="text-sm font-medium text-muted-foreground flex items-center gap-2"
                >
                    <FileText class="h-4 w-4" /> Biaya Operasional
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div class="text-2xl font-bold">
                    {controller.summary
                        ? controller.formatRp(controller.summary.expenseDebt)
                        : "..."}
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader class="pb-2">
                <CardTitle
                    class="text-sm font-medium text-muted-foreground flex items-center gap-2"
                >
                    <Users class="h-4 w-4" /> Komisi Pending
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div class="text-2xl font-bold">
                    {controller.summary
                        ? controller.formatRp(controller.summary.commissionDebt)
                        : "..."}
                </div>
            </CardContent>
        </Card>
    </div>

    <Tabs value="supplier" class="space-y-4">
        <TabsList>
            <TabsTrigger value="supplier" class="gap-2"
                ><Truck class="h-4 w-4" /> Supplier Debt</TabsTrigger
            >
            <TabsTrigger value="expense" class="gap-2"
                ><FileText class="h-4 w-4" /> Operational Expenses</TabsTrigger
            >
            <TabsTrigger value="commission" class="gap-2"
                ><Users class="h-4 w-4" /> Technician Commissions</TabsTrigger
            >
        </TabsList>

        <!-- SUPPLIER DEBT TAB -->
        <TabsContent value="supplier" class="space-y-4">
            <Card>
                <CardContent class="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>No. Invoice</TableHead>
                                <TableHead>Supplier</TableHead>
                                <TableHead>Tanggal</TableHead>
                                <TableHead class="text-right"
                                    >Total Tagihan</TableHead
                                >
                                <TableHead class="text-right"
                                    >Terbayar</TableHead
                                >
                                <TableHead class="text-right"
                                    >Sisa Hutang</TableHead
                                >
                                <TableHead class="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {#if controller.loading}
                                <TableRow>
                                    <TableCell
                                        colspan={7}
                                        class="h-24 text-center"
                                    >
                                        <Loader2
                                            class="h-6 w-6 animate-spin mx-auto text-muted-foreground"
                                        />
                                    </TableCell>
                                </TableRow>
                            {:else if controller.supplierDebts.length === 0}
                                <TableRow>
                                    <TableCell
                                        colspan={7}
                                        class="h-24 text-center text-muted-foreground"
                                    >
                                        Tidak ada hutang supplier.
                                    </TableCell>
                                </TableRow>
                            {:else}
                                {#each controller.supplierDebts as item}
                                    <TableRow>
                                        <TableCell class="font-mono"
                                            >{item.notes || item.id}</TableCell
                                        >
                                        <TableCell class="font-medium"
                                            >{item.supplier?.name ||
                                                "Unknown"}</TableCell
                                        >
                                        <TableCell
                                            >{controller.formatDate(
                                                item.date,
                                            )}</TableCell
                                        >
                                        <TableCell class="text-right"
                                            >{controller.formatRp(
                                                item.totalAmount,
                                            )}</TableCell
                                        >
                                        <TableCell
                                            class="text-right text-green-600"
                                            >{controller.formatRp(
                                                item.paidAmount,
                                            )}</TableCell
                                        >
                                        <TableCell
                                            class="text-right font-bold text-red-600"
                                            >{controller.formatRp(
                                                item.remainingAmount,
                                            )}</TableCell
                                        >
                                        <TableCell class="text-right">
                                            <Button
                                                size="sm"
                                                onclick={() =>
                                                    controller.openPayDialog(
                                                        item,
                                                        "supplier",
                                                    )}
                                            >
                                                Bayar
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                {/each}
                            {/if}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>

        <!-- EXPENSE DEBT TAB -->
        <TabsContent value="expense" class="space-y-4">
            <Card>
                <CardContent class="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tanggal</TableHead>
                                <TableHead>Kategori</TableHead>
                                <TableHead>Keterangan</TableHead>
                                <TableHead>Invoice / Ref</TableHead>
                                <TableHead class="text-right">Jumlah</TableHead>
                                <TableHead class="text-right"
                                    >Jatuh Tempo</TableHead
                                >
                                <TableHead class="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {#if controller.loading}
                                <TableRow>
                                    <TableCell
                                        colspan={7}
                                        class="h-24 text-center"
                                    >
                                        <Loader2
                                            class="h-6 w-6 animate-spin mx-auto text-muted-foreground"
                                        />
                                    </TableCell>
                                </TableRow>
                            {:else if controller.expenseDebts.length === 0}
                                <TableRow>
                                    <TableCell
                                        colspan={7}
                                        class="h-24 text-center text-muted-foreground"
                                    >
                                        Tidak ada biaya operasional pending.
                                    </TableCell>
                                </TableRow>
                            {:else}
                                {#each controller.expenseDebts as item}
                                    <TableRow>
                                        <TableCell
                                            >{controller.formatDate(
                                                item.date,
                                            )}</TableCell
                                        >
                                        <TableCell>
                                            <Badge variant="outline"
                                                >{item.category}</Badge
                                            >
                                        </TableCell>
                                        <TableCell>{item.description}</TableCell
                                        >
                                        <TableCell class="font-mono text-xs"
                                            >{item.invoiceNumber ||
                                                "-"}</TableCell
                                        >
                                        <TableCell class="text-right font-bold"
                                            >{controller.formatRp(
                                                item.amount,
                                            )}</TableCell
                                        >
                                        <TableCell
                                            class="text-right text-red-600"
                                        >
                                            {item.dueDate
                                                ? controller.formatDate(
                                                      item.dueDate,
                                                  )
                                                : "-"}
                                        </TableCell>
                                        <TableCell class="text-right">
                                            <Button
                                                size="sm"
                                                onclick={() =>
                                                    controller.openPayDialog(
                                                        item,
                                                        "expense",
                                                    )}
                                            >
                                                Bayar
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                {/each}
                            {/if}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>

        <!-- COMMISSION DEBT TAB -->
        <TabsContent value="commission" class="space-y-4">
            <div
                class="flex items-center gap-4 bg-muted/20 p-4 rounded-lg border"
            >
                <AlertCircle class="h-5 w-5 text-blue-600" />
                <div class="flex-1 text-sm">
                    Menampilkan data periode: <strong
                        >{controller.period}</strong
                    >. Gunakan filter periode untuk melihat bulan lain.
                </div>
                <Input
                    type="month"
                    bind:value={controller.period}
                    class="w-48"
                    onchange={() => controller.loadCommissionDebts()}
                />
            </div>

            <Card>
                <CardContent class="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Teknisi</TableHead>
                                <TableHead class="text-center"
                                    >Jumlah Servis</TableHead
                                >
                                <TableHead class="text-right"
                                    >Total Komisi</TableHead
                                >
                                <TableHead class="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {#if controller.loading}
                                <TableRow>
                                    <TableCell
                                        colspan={4}
                                        class="h-24 text-center"
                                    >
                                        <Loader2
                                            class="h-6 w-6 animate-spin mx-auto text-muted-foreground"
                                        />
                                    </TableCell>
                                </TableRow>
                            {:else if controller.commissionDebts.length === 0}
                                <TableRow>
                                    <TableCell
                                        colspan={4}
                                        class="h-24 text-center text-muted-foreground"
                                    >
                                        Tidak ada komisi pending untuk periode
                                        ini.
                                    </TableCell>
                                </TableRow>
                            {:else}
                                {#each controller.commissionDebts as item}
                                    <TableRow>
                                        <TableCell class="font-medium">
                                            <div
                                                class="flex items-center gap-2"
                                            >
                                                <div
                                                    class="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs"
                                                >
                                                    {(item.technicianName ||
                                                        "T")[0]}
                                                </div>
                                                {item.technicianName}
                                            </div>
                                        </TableCell>
                                        <TableCell class="text-center">
                                            <Badge variant="secondary"
                                                >{(item.services || []).length} Servis</Badge
                                            >
                                        </TableCell>
                                        <TableCell
                                            class="text-right font-bold text-green-600"
                                            >{controller.formatRp(
                                                item.totalAmount,
                                            )}</TableCell
                                        >
                                        <TableCell class="text-right">
                                            <Button
                                                size="sm"
                                                onclick={() =>
                                                    controller.openPayDialog(
                                                        item,
                                                        "commission",
                                                    )}
                                            >
                                                Proses Bayar
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                {/each}
                            {/if}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>
    </Tabs>

    <!-- Payment Dialog -->
    <Dialog bind:open={controller.showPayDialog}>
        <DialogContent class="max-w-md">
            <DialogHeader>
                <DialogTitle>Proses Pembayaran</DialogTitle>
            </DialogHeader>

            <div class="space-y-4 py-4">
                <div class="p-4 bg-muted/30 rounded-lg space-y-2 text-sm">
                    <div class="flex justify-between">
                        <span class="text-muted-foreground">Tipe Hutang</span>
                        <span class="capitalize font-medium"
                            >{controller.debtType}</span
                        >
                    </div>
                    <div class="flex justify-between">
                        <span class="text-muted-foreground">Penerima</span>
                        <span
                            class="font-medium align-right text-right truncate w-1/2"
                        >
                            {controller.debtType === "supplier"
                                ? controller.selectedDebt?.supplier?.name
                                : controller.debtType === "commission"
                                  ? controller.selectedDebt?.technicianName
                                  : controller.selectedDebt?.description || "-"}
                        </span>
                    </div>
                    <div class="flex justify-between pt-2 border-t">
                        <span class="text-muted-foreground">Total Tagihan</span>
                        <span class="font-bold">
                            {controller.debtType === "supplier"
                                ? controller.formatRp(
                                      controller.selectedDebt
                                          ?.remainingAmount || 0,
                                  )
                                : controller.debtType === "commission"
                                  ? controller.formatRp(
                                        controller.selectedDebt?.totalAmount ||
                                            0,
                                    )
                                  : controller.formatRp(
                                        controller.selectedDebt?.amount || 0,
                                    )}
                        </span>
                    </div>
                </div>

                <div class="space-y-2">
                    <Label>Jumlah Bayar</Label>
                    <Input type="number" bind:value={controller.payAmount} />
                </div>

                <div class="space-y-2">
                    <Label>Metode Pembayaran</Label>
                    <select
                        bind:value={controller.payMethod}
                        class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <option value="cash">Tunai (Kas Toko)</option>
                        <option value="transfer">Transfer Bank</option>
                    </select>
                </div>

                {#if controller.debtType === "supplier"}
                    <div class="space-y-2">
                        <Label>Referensi (Opsional)</Label>
                        <Input
                            placeholder="No. Bukti Transfer"
                            bind:value={controller.payReference}
                        />
                    </div>
                {/if}

                {#if controller.debtType === "expense"}
                    <div class="space-y-2">
                        <Label>Catatan</Label>
                        <Input
                            placeholder="Catatan pembayaran..."
                            bind:value={controller.payNotes}
                        />
                    </div>
                {/if}
            </div>

            <DialogFooter>
                <Button
                    variant="ghost"
                    onclick={() => (controller.showPayDialog = false)}
                    >Batal</Button
                >
                <Button
                    onclick={() => controller.submitPayment()}
                    disabled={controller.isProcessing}
                >
                    {#if controller.isProcessing}
                        <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                    {/if}
                    Konfirmasi Bayar
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</div>
