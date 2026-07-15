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
    import { Label } from "$lib/shared/components/ui/label";
    import { Textarea } from "$lib/shared/components/ui/textarea";
    import {
        Dialog,
        DialogContent,
        DialogHeader,
        DialogTitle,
        DialogTrigger,
        DialogFooter,
    } from "$lib/shared/components/ui/dialog";
    import {
        Table,
        TableBody,
        TableCell,
        TableHead,
        TableHeader,
        TableRow,
    } from "$lib/shared/components/ui/table";
    import {
        Plus,
        Trash2,
        Loader2,
        Calendar,
        Tag,
        FileText,
    } from "lucide-svelte";
    import { OperationalCostsController } from "$lib/features/finance/operational-costs/operational-costs.controller.svelte";

    const controller = new OperationalCostsController();

    onMount(() => {
        controller.init();
    });

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(val);

    const formatDate = (date: string | Date) =>
        new Date(date).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
</script>

<div class="space-y-6 animate-in fade-in duration-500 pb-10">
    <div
        class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
    >
        <div>
            <h1 class="text-2xl font-bold text-slate-900 dark:text-white">
                Biaya Operasional
            </h1>
            <p class="text-slate-500">
                Kelola pengeluaran operasional sehari-hari
            </p>
        </div>
        <Button onclick={() => controller.openAddDialog()}>
            <Plus class="h-4 w-4 mr-2" />
            Tambah Biaya
        </Button>
    </div>

    {#if controller.loading}
        <div class="flex items-center justify-center py-20">
            <Loader2 class="h-8 w-8 animate-spin text-blue-600" />
        </div>
    {:else}
        <Card class="border-0 shadow-lg rounded-2xl overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow class="bg-slate-50">
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Kategori</TableHead>
                        <TableHead>Keterangan</TableHead>
                        <TableHead class="text-right">Jumlah</TableHead>
                        <TableHead class="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {#each controller.items as item}
                        <TableRow class="hover:bg-slate-50">
                            <TableCell>{formatDate(item.date)}</TableCell>
                            <TableCell>
                                <span
                                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                >
                                    {item.category}
                                </span>
                            </TableCell>
                            <TableCell>{item.description || "-"}</TableCell>
                            <TableCell
                                class="text-right font-bold text-slate-700"
                            >
                                {formatCurrency(item.amount)}
                            </TableCell>
                            <TableCell>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    class="text-red-500 hover:text-red-700 hover:bg-red-50"
                                    onclick={() =>
                                        controller.handleDelete(item.id)}
                                >
                                    <Trash2 class="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    {:else}
                        <TableRow>
                            <TableCell
                                colspan={5}
                                class="text-center py-10 text-slate-500"
                            >
                                Belum ada data biaya operasional
                            </TableCell>
                        </TableRow>
                    {/each}
                </TableBody>
            </Table>
        </Card>
    {/if}
</div>

<!-- Add Dialog -->
<Dialog bind:open={controller.showAddDialog}>
    <DialogContent class="max-w-md">
        <DialogHeader>
            <DialogTitle>Tambah Biaya Operasional</DialogTitle>
        </DialogHeader>
        <form
            onsubmit={(e) => {
                e.preventDefault();
                controller.handleSubmit();
            }}
            class="space-y-4"
        >
            <div class="space-y-2">
                <Label>Tanggal</Label>
                <div class="relative">
                    <Calendar
                        class="absolute left-3 top-2.5 h-4 w-4 text-slate-400"
                    />
                    <Input
                        type="date"
                        bind:value={controller.date}
                        class="pl-9"
                        required
                    />
                </div>
            </div>

            <div class="space-y-2">
                <Label>Kategori</Label>
                <div class="relative">
                    <Tag
                        class="absolute left-3 top-2.5 h-4 w-4 text-slate-400"
                    />
                    <Input
                        type="text"
                        bind:value={controller.category}
                        class="pl-9"
                        placeholder="Contoh: Transport, Makan, Listrik"
                        required
                    />
                </div>
            </div>

            <div class="space-y-2">
                <Label>Jumlah (Rp)</Label>
                <Input
                    type="number"
                    bind:value={controller.amount}
                    min="0"
                    placeholder="0"
                    required
                />
            </div>

            <div class="space-y-2">
                <Label>Keterangan</Label>
                <div class="relative">
                    <FileText
                        class="absolute left-3 top-3 h-4 w-4 text-slate-400"
                    />
                    <Textarea
                        bind:value={controller.description}
                        class="pl-9 min-h-[80px]"
                        placeholder="Detail pengeluaran..."
                    />
                </div>
            </div>

            <div class="flex justify-end gap-3 pt-4">
                <Button
                    type="button"
                    variant="outline"
                    onclick={() => (controller.showAddDialog = false)}
                >
                    Batal
                </Button>
                <Button type="submit" disabled={controller.submitting}>
                    {#if controller.submitting}
                        <Loader2 class="h-4 w-4 animate-spin mr-2" />
                    {/if}
                    Simpan
                </Button>
            </div>
        </form>
    </DialogContent>
</Dialog>
