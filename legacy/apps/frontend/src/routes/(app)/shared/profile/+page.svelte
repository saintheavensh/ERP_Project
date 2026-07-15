<script lang="ts">
    import * as Card from "$lib/shared/components/ui/card";
    import { User } from "lucide-svelte";
</script>

<div class="container mx-auto py-6 space-y-6">
    <header>
        <h1
            class="text-3xl font-bold tracking-tight text-slate-900 dark:text-white"
        >
            User Profile
        </h1>
        <p class="text-slate-500">Manage your account settings</p>
    </header>

    <Card.Root class="p-12 text-center">
        <User class="h-16 w-16 mx-auto mb-4 text-purple-500" />
        <Card.Title class="text-2xl font-semibold mb-2"
            >Profile Page Coming Soon</Card.Title
        >
        <Card.Description class="text-gray-500 max-w-md mx-auto">
            Soon you'll be able to: update your personal information, change
            password, set preferences, and view activity logs.
        </Card.Description>
        <div class="mt-6 text-sm text-gray-400">
            Expected release: Next sprint
        </div>
    </Card.Root>
</div>
