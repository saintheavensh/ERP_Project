<script lang="ts">
    let { children } = $props();
</script>

<div class="min-h-screen w-full bg-slate-950 text-white overflow-x-hidden">
    {@render children()}
</div>
