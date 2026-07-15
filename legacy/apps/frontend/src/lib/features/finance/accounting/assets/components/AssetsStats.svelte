<script lang="ts">
    import { Card, CardContent } from "$lib/shared/components/ui/card";
    import { formatCurrency } from "./assets.utils";
    import type { AssetsController } from "../assets.controller.svelte";

    let { controller }: { controller: AssetsController } = $props();
</script>

<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
    <Card class="border-0 shadow-md rounded-xl">
        <CardContent class="p-4">
            <p class="text-sm text-slate-500">Total Aset</p>
            <p class="text-2xl font-bold">{controller.assets.length}</p>
        </CardContent>
    </Card>
    <Card class="border-0 shadow-md rounded-xl">
        <CardContent class="p-4">
            <p class="text-sm text-slate-500">Nilai Buku Total</p>
            <p class="text-2xl font-bold">
                {formatCurrency(
                    controller.assets.reduce(
                        (s, a) => s + (a.currentValue || 0),
                        0,
                    ),
                )}
            </p>
        </CardContent>
    </Card>
    <Card class="border-0 shadow-md rounded-xl">
        <CardContent class="p-4">
            <p class="text-sm text-slate-500">Penyusutan/Bulan</p>
            <p class="text-2xl font-bold">
                {formatCurrency(
                    controller.assets.reduce(
                        (s, a) => s + (a.monthlyDepreciation || 0),
                        0,
                    ),
                )}
            </p>
        </CardContent>
    </Card>
</div>
