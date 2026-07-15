<script lang="ts">
    import { Button } from "$lib/shared/components/ui/button";
    import { Plus } from "lucide-svelte";
    import type { BrandsController } from "../brands.controller.svelte";

    let { controller }: { controller: BrandsController } = $props();
</script>

<div class="flex items-center justify-between">
    <div>
        <h2 class="text-3xl font-bold tracking-tight">Brands</h2>
        <p class="text-muted-foreground">Kelola daftar brand dan logo.</p>
    </div>
    <Button onclick={() => controller.openCreateDialog()}>
        <Plus class="mr-2 h-4 w-4" />
        Tambah Brand
    </Button>
</div>
