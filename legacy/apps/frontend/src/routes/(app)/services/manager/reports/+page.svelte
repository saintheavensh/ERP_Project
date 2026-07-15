<script lang="ts">
    import * as Card from "$lib/shared/components/ui/card";
    import { BarChart3 } from "lucide-svelte";
</script>

<div class="container mx-auto py-6 space-y-6">
    <header>
        <h1
            class="text-3xl font-bold tracking-tight text-slate-900 dark:text-white"
        >
            Service Reports
        </h1>
        <p class="text-slate-500">Analytics and performance metrics</p>
    </header>

    <Card.Root class="p-12 text-center">
        <BarChart3 class="h-16 w-16 mx-auto mb-4 text-green-500" />
        <Card.Title class="text-2xl font-semibold mb-2"
            >Service Reports Coming Soon</Card.Title
        >
        <Card.Description class="text-gray-500 max-w-md mx-auto">
            We're building comprehensive service analytics including: technician
            performance, service trends, revenue analysis, and customer
            satisfaction metrics.
        </Card.Description>
        <div class="mt-6 text-sm text-gray-400">
            Expected release: Next sprint
        </div>
    </Card.Root>
</div>
