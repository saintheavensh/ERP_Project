<script lang="ts">
    import {
        Table,
        TableBody,
        TableCell,
        TableHead,
        TableHeader,
        TableRow,
    } from "$lib/shared/components/ui/table";
    import { Card } from "$lib/shared/components/ui/card";
    import { Button } from "$lib/shared/components/ui/button";
    import { Loader2, Settings } from "lucide-svelte";
    import {
        formatCurrency,
        getCategoryIcon,
        getCategoryLabel,
        getStatusBadge,
    } from "./assets.utils";
    import type { AssetsController } from "../assets.controller.svelte";

    let { controller }: { controller: AssetsController } = $props();
</script>

{#if controller.loading}
    <div class="flex items-center justify-center py-20">
        <Loader2 class="h-8 w-8 animate-spin text-blue-600" />
    </div>
{:else}
    <Card class="border-0 shadow-lg rounded-2xl overflow-hidden">
        <Table>
            <TableHeader>
                <TableRow class="bg-slate-50">
                    <TableHead>Aset</TableHead>
                    <TableHead class="w-28">Kategori</TableHead>
                    <TableHead class="text-right">Nilai Buku</TableHead>
                    <TableHead class="text-right">Penyusutan/Bln</TableHead>
                    <TableHead class="text-right">Biaya/Jam</TableHead>
                    <TableHead class="w-24">Status</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {#each controller.assets as asset}
                    {@const Icon = getCategoryIcon(asset.category)}
                    <TableRow class="hover:bg-slate-50">
                        <TableCell>
                            <div class="flex items-center gap-3">
                                <div class="p-2 bg-slate-100 rounded-lg">
                                    <Icon class="h-4 w-4 text-slate-600" />
                                </div>
                                <div>
                                    <p class="font-medium">{asset.name}</p>
                                    <p class="text-xs text-slate-500">
                                        {asset.id}
                                    </p>
                                </div>
                            </div>
                        </TableCell>
                        <TableCell class="text-sm"
                            >{getCategoryLabel(asset.category)}</TableCell
                        >
                        <TableCell class="text-right font-mono">
                            {formatCurrency(asset.currentValue || 0)}
                        </TableCell>
                        <TableCell class="text-right font-mono">
                            {formatCurrency(asset.monthlyDepreciation || 0)}
                        </TableCell>
                        <TableCell class="text-right font-mono text-blue-600">
                            {formatCurrency(asset.toolCostPerHour || 0)}
                        </TableCell>
                        <TableCell>
                            <span
                                class="text-xs px-2 py-1 rounded-full {getStatusBadge(
                                    asset.status,
                                )}"
                            >
                                {asset.status === "active"
                                    ? "Aktif"
                                    : asset.status === "disposed"
                                      ? "Dibuang"
                                      : "Habis"}
                            </span>
                        </TableCell>
                        <TableCell>
                            <Button
                                variant="ghost"
                                size="sm"
                                class="h-8 w-8 p-0"
                                onclick={() => {
                                    controller.editingId = asset.id;
                                    controller.form = {
                                        name: asset.name,
                                        category: asset.category,
                                        purchaseDate: new Date(
                                            asset.purchaseDate,
                                        )
                                            .toISOString()
                                            .slice(0, 10),
                                        purchaseCost: asset.purchaseCost,
                                        salvageValue: asset.salvageValue,
                                        usefulLifeMonths:
                                            asset.usefulLifeMonths,
                                        notes: asset.notes || "",
                                        sourceAccountId:
                                            asset.sourceAccountId || "",
                                        accountId: asset.accountId || "",
                                    };
                                    controller.showAddDialog = true;
                                }}
                            >
                                <span class="sr-only">Edit</span>
                                <Settings class="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                class="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                onclick={async () => {
                                    if (
                                        !confirm(
                                            `Hapus aset "${asset.name}"? Tindakan ini tidak dapat dibatalkan.`,
                                        )
                                    )
                                        return;
                                    try {
                                        controller.loading = true;
                                        await controller.deleteAsset(asset.id);
                                    } catch (e: any) {
                                        console.error(
                                            "Failed to delete asset",
                                            e,
                                        );
                                        alert(
                                            e.response?.data?.error ||
                                                "Gagal menghapus aset",
                                        );
                                        controller.loading = false;
                                    }
                                }}
                            >
                                <span class="sr-only">Delete</span>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    class="h-4 w-4"
                                    ><path d="M3 6h18" /><path
                                        d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"
                                    /><path
                                        d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"
                                    /><line
                                        x1="10"
                                        x2="10"
                                        y1="11"
                                        y2="17"
                                    /><line
                                        x1="14"
                                        x2="14"
                                        y1="11"
                                        y2="17"
                                    /></svg
                                >
                            </Button>
                        </TableCell>
                    </TableRow>
                {:else}
                    <TableRow>
                        <TableCell
                            colspan={6}
                            class="text-center py-10 text-slate-500"
                        >
                            Belum ada aset. Klik "Tambah Aset" untuk
                            menambahkan.
                        </TableCell>
                    </TableRow>
                {/each}
            </TableBody>
        </Table>
    </Card>
{/if}
