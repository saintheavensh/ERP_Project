<script lang="ts">
    import { Camera } from "lucide-svelte";
    import { fade } from "svelte/transition";
    import type { TicketDetailController } from "../../../ticket-detail.controller.svelte";

    let { controller }: { controller: TicketDetailController } = $props();
</script>

{#if controller.serviceOrder.photos?.length}
    <div
        class="bg-card rounded-[2rem] shadow-lg border-2 border-slate-100 p-8"
        transition:fade
    >
        <h3 class="font-bold text-xl mb-6 flex items-center gap-3">
            <div class="p-2 bg-slate-100 rounded-xl">
                <Camera class="h-6 w-6 text-slate-500" />
            </div>
            Dokumentasi Fisik Unit
        </h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            {#each controller.serviceOrder.photos as photo, i}
                <button
                    class="group aspect-square rounded-[1.5rem] overflow-hidden border-2 border-slate-100 hover:border-primary transition-all shadow-sm"
                    onclick={() => window.open(photo, "_blank")}
                >
                    <img
                        src={photo}
                        alt="Kondisi {i + 1}"
                        class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                </button>
            {/each}
        </div>
    </div>
{/if}
