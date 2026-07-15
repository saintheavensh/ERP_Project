<script lang="ts">
    import { Badge } from "$lib/shared/components/ui/badge";
    import { Button, buttonVariants } from "$lib/shared/components/ui/button";
    import * as DropdownMenu from "$lib/shared/components/ui/dropdown-menu";
    import { cn } from "$lib/shared/lib/utils";
    import {
        Calendar,
        Gavel,
        MessageCircle,
        Printer,
        User,
        UserPlus,
    } from "lucide-svelte";
    import type { TicketDetailController } from "../../ticket-detail.controller.svelte";

    let { controller }: { controller: TicketDetailController } = $props();

    function handleLiquidate(type: "resell" | "cannibalize") {
        controller.liquidationType = type;
        controller.showLiquidateConfirm = true;
    }
</script>

<div class="sticky top-0 z-30 -mx-6 -mt-6 mb-8">
    <div
        class="absolute inset-0 bg-white/80 backdrop-blur-md border-b border-white/20 shadow-sm"
    ></div>

    <div class="relative px-6 py-4">
        <div
            class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
        >
            <div class="flex items-center gap-4">
                <div
                    class="h-14 w-1 bg-gradient-to-b {controller.statusConfig
                        .gradient} rounded-full"
                ></div>
                <div>
                    <div class="flex items-center gap-3 mb-1">
                        <h1
                            class="text-3xl font-black tracking-tighter text-slate-800"
                        >
                            #{controller.serviceOrder.no}
                        </h1>
                        <Badge
                            variant="secondary"
                            class="{controller.statusConfig.bg} {controller
                                .statusConfig
                                .color} border-none font-bold uppercase tracking-widest px-3"
                        >
                            {@const Icon = controller.statusConfig.icon}
                            <Icon class="w-3 h-3 mr-1.5" />
                            {controller.statusConfig.label}
                        </Badge>
                        {#if controller.serviceOrder.isWalkin}
                            <Badge
                                variant="outline"
                                class="rounded-full px-3 py-1 font-bold bg-amber-50 text-amber-600 border-amber-200"
                            >
                                <User class="h-3.5 w-3.5 mr-1.5" /> Walk-in
                            </Badge>
                        {:else}
                            <Badge
                                variant="outline"
                                class="rounded-full px-3 py-1 font-bold bg-white/50 backdrop-blur-sm"
                            >
                                <Calendar class="h-3.5 w-3.5 mr-1.5" /> Regular
                            </Badge>
                        {/if}
                    </div>
                    <div class="flex items-center gap-6 mt-4">
                        <div class="flex flex-col">
                            <span
                                class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 leading-none"
                                >Customer</span
                            >
                            <span
                                class="font-black text-xl tracking-tight text-slate-800 leading-none"
                            >
                                {controller.serviceOrder.customer?.name ||
                                    "Unknown"}
                            </span>
                        </div>
                        <div class="w-px h-8 bg-slate-200"></div>
                        <div class="flex flex-col">
                            <span
                                class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 leading-none"
                                >Penerima</span
                            >
                            <div class="flex items-center gap-2">
                                <div
                                    class="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center border shadow-sm"
                                >
                                    <User class="h-3 w-3 text-slate-400" />
                                </div>
                                <span
                                    class="text-sm font-bold text-slate-600 tracking-tight uppercase"
                                >
                                    {controller.serviceOrder.creator?.name ||
                                        "Admin"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div
                class="flex flex-wrap items-center gap-3 bg-white/60 backdrop-blur-xl p-2.5 rounded-[2rem] border-2 border-white shadow-xl"
            >
                <Button
                    variant="secondary"
                    size="sm"
                    onclick={() => controller.handlePrint("sticker")}
                    class="rounded-full font-black text-[10px] uppercase tracking-widest bg-white hover:bg-slate-50 border shadow-sm px-6 h-10 transition-all hover:scale-105 active:scale-95"
                >
                    <Printer class="h-4 w-4 mr-2 text-slate-400" /> Cetak Label
                </Button>
                <Button
                    variant="secondary"
                    size="sm"
                    onclick={() => controller.handlePrint("receipt")}
                    class="rounded-full font-black text-[10px] uppercase tracking-widest bg-white hover:bg-slate-50 border shadow-sm px-6 h-10 transition-all hover:scale-105 active:scale-95"
                >
                    <Printer class="h-4 w-4 mr-2 text-slate-400" /> Cetak Nota
                </Button>

                <div class="w-px h-6 bg-slate-200 mx-1 hidden sm:block"></div>

                {#if controller.canViewContact}
                    <Button
                        variant="secondary"
                        size="sm"
                        class="rounded-full font-black text-[10px] uppercase tracking-widest bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-200 px-6 h-10 transition-all hover:scale-105 active:scale-95 border-none"
                        onclick={() => controller.handleChatCustomer()}
                    >
                        <MessageCircle class="h-4 w-4 mr-2" /> WhatsApp
                    </Button>
                {/if}
                {#if controller.canLiquidate}
                    <div
                        class="ml-2 pl-2 border-l border-slate-200 hidden sm:block"
                    >
                        <DropdownMenu.Root>
                            <DropdownMenu.Trigger
                                class={cn(
                                    buttonVariants({
                                        variant: "secondary",
                                        size: "sm",
                                    }),
                                    "rounded-full font-black text-[10px] uppercase tracking-widest bg-red-100 text-red-600 hover:bg-red-200 shadow-sm border-none px-4 h-10 transition-all hover:scale-105 active:scale-95",
                                )}
                            >
                                <Gavel class="h-4 w-4 mr-2" /> Likuidasi
                            </DropdownMenu.Trigger>
                            <DropdownMenu.Content>
                                <DropdownMenu.Label
                                    >Opsi Likuidasi</DropdownMenu.Label
                                >
                                <DropdownMenu.Separator />
                                <DropdownMenu.Item
                                    onclick={() => handleLiquidate("resell")}
                                >
                                    Jual Unit (Resell)
                                </DropdownMenu.Item>
                                <DropdownMenu.Item
                                    onclick={() =>
                                        handleLiquidate("cannibalize")}
                                >
                                    Kanibalisasi (Sparepart)
                                </DropdownMenu.Item>
                            </DropdownMenu.Content>
                        </DropdownMenu.Root>
                    </div>
                {/if}
                {#if controller.canAssignTechnician}
                    <Button
                        variant="secondary"
                        size="sm"
                        class="rounded-full font-black text-[10px] uppercase tracking-widest bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-200 px-6 h-10 transition-all hover:scale-105 active:scale-95 border-none"
                        onclick={() => (controller.showAssignModal = true)}
                    >
                        <UserPlus class="h-4 w-4 mr-2" /> Tunjuk Teknisi
                    </Button>
                {/if}
            </div>
        </div>
    </div>
</div>
