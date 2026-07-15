<script lang="ts">
    import { Button } from "$lib/shared/components/ui/button";
    import type { BrandsController } from "../brands.controller.svelte";

    let { controller }: { controller: BrandsController } = $props();
</script>

<div
    class="flex flex-col items-center justify-center h-64 border rounded-lg border-dashed text-muted-foreground"
>
    <p>Belum ada data brand.</p>
    <Button variant="link" onclick={() => controller.openCreateDialog()}
        >Buat brand pertama</Button
    >
</div>
