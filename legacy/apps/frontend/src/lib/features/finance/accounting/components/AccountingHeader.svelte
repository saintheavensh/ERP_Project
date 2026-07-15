<script lang="ts">
    import { Button } from "$lib/shared/components/ui/button";
    import { Wallet, Landmark, Loader2, AlertCircle } from "lucide-svelte";
    import { type AccountingController } from "../accounting.controller.svelte";

    interface Props {
        controller: AccountingController;
    }

    let { controller }: Props = $props();
</script>

<div
    class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
>
    <div>
        <h1
            class="text-3xl font-bold tracking-tight text-slate-900 dark:text-white"
        >
            Keuangan & Akuntansi
        </h1>
        <p class="text-slate-500 mt-1">Pantau kesehatan keuangan bisnis Anda</p>
    </div>

    <div class="flex items-center gap-3">
        {#if controller.loading}
            <div class="flex items-center text-sm text-muted-foreground">
                <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                Memuat...
            </div>
        {/if}
        <Button variant="outline" href="/accounting/register" class="gap-2">
            <Wallet class="h-4 w-4" />
            Kas Harian
        </Button>
        <Button href="/accounting/accounts" class="gap-2">
            <Landmark class="h-4 w-4" />
            Chart of Accounts
        </Button>
    </div>
</div>

{#if controller.error}
    <div
        class="p-4 rounded-xl bg-red-50 text-red-600 border border-red-100 flex items-center gap-3"
    >
        <AlertCircle class="h-5 w-5" />
        <span class="font-medium">{controller.error}</span>
    </div>
{/if}
