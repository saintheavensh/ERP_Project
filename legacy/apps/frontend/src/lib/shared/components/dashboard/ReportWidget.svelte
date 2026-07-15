<script lang="ts">
    import {
        Card,
        CardHeader,
        CardTitle,
        CardContent,
        CardDescription,
    } from "$lib/shared/components/ui/card";
    import { Skeleton } from "$lib/shared/components/ui/skeleton";
    import { cn } from "$lib/shared/lib/utils";
    import type { Snippet } from "svelte";

    interface Props {
        title: string;
        description?: string;
        loading?: boolean;
        class?: string;
        headerAction?: Snippet;
        children?: Snippet;
        footer?: Snippet;
    }

    let {
        title,
        description,
        loading = false,
        class: className,
        headerAction,
        children,
        footer,
    }: Props = $props();
</script>

<Card
    class={cn(
        "overflow-hidden border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-3xl",
        className,
    )}
>
    <CardHeader class="border-b border-slate-100/50 pb-4">
        <div class="flex items-center justify-between">
            <div>
                <CardTitle class="text-lg font-bold">{title}</CardTitle>
                {#if description}
                    <CardDescription>{description}</CardDescription>
                {/if}
            </div>
            {#if headerAction}
                {@render headerAction()}
            {/if}
        </div>
    </CardHeader>
    <CardContent class="p-6">
        {#if loading}
            <div class="space-y-4">
                <Skeleton class="h-[200px] w-full rounded-2xl" />
                <div class="flex gap-4">
                    <Skeleton class="h-10 w-full" />
                    <Skeleton class="h-10 w-full" />
                </div>
            </div>
        {:else if children}
            {@render children()}
        {/if}
    </CardContent>
    {#if footer}
        <div
            class="p-4 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-100/50"
        >
            {@render footer()}
        </div>
    {/if}
</Card>
