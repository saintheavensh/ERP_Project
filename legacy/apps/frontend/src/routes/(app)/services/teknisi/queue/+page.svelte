<script lang="ts">
    import * as Card from "$lib/shared/components/ui/card";
    import { Clock } from "lucide-svelte";
</script>

<div class="container mx-auto py-6 space-y-6">
    <header>
        <h1
            class="text-3xl font-bold tracking-tight text-slate-900 dark:text-white"
        >
            Service Queue
        </h1>
        <p class="text-slate-500">Manage and monitor service requests</p>
    </header>

    <Card.Root class="p-12 text-center">
        <Clock class="h-16 w-16 mx-auto mb-4 text-blue-500" />
        <Card.Title class="text-2xl font-semibold mb-2"
            >Service Queue Coming Soon</Card.Title
        >
        <Card.Description class="text-gray-500 max-w-md mx-auto">
            The service queue feature is currently under development. You'll be
            able to manage technician assignments and track service progress
            here.
        </Card.Description>
        <div class="mt-6 text-sm text-gray-400">
            Expected release: Next sprint
        </div>
    </Card.Root>
</div>
