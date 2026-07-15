<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";

    onMount(() => {
        goto("/shared/settings/store");
    });
</script>

<div class="flex items-center justify-center min-h-[400px]">
    <div class="text-center space-y-2">
        <p class="text-lg font-medium">Redirecting to Store Settings...</p>
        <p class="text-sm text-muted-foreground">Please wait.</p>
    </div>
</div>
