<script lang="ts">
    import { Button } from "$lib/shared/components/ui/button";
    import { Plus, Boxes, Layers, FolderTree } from "lucide-svelte";
    import { scale, fade } from "svelte/transition";
    import type { CategoriesController } from "../categories.controller.svelte";

    let { controller }: { controller: CategoriesController } = $props();
</script>

<section
    class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 p-8 md:p-12 shadow-2xl"
    in:scale={{ duration: 600, start: 0.95, opacity: 0 }}
>
    <div
        class="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10"
    ></div>
    <div
        class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"
    ></div>

    <div
        class="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
    >
        <div class="space-y-2 text-white">
            <div
                class="inline-flex items-center rounded-full bg-white/20 backdrop-blur-md px-3 py-1 text-xs font-medium text-white ring-1 ring-inset ring-white/30"
                in:fade={{ delay: 200, duration: 400 }}
            >
                <Boxes class="mr-2 h-3 w-3" /> Inventory Management
            </div>
            <h1
                class="text-4xl md:text-5xl font-extrabold tracking-tight lg:text-6xl"
                in:fade={{ delay: 300, duration: 500 }}
            >
                Kategori Produk
            </h1>
            <p
                class="max-w-xl text-lg text-indigo-100"
                in:fade={{ delay: 400, duration: 500 }}
            >
                Organisir produk anda dengan struktur kategori yang rapi dan
                hierarkis untuk memudahkan manajemen inventori.
            </p>
        </div>

        <Button
            size="lg"
            class="bg-white text-indigo-600 hover:bg-indigo-50 shadow-lg hover:shadow-xl transition-all duration-300 font-semibold rounded-full px-8"
            onclick={() => controller.handleCreateNew()}
        >
            <Plus class="h-5 w-5 mr-2" /> Kategori Baru
        </Button>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mt-10">
        {#each [{ label: "Total Kategori", value: controller.totalCategories, icon: Layers, color: "text-blue-200" }, { label: "Kategori Induk", value: controller.rootCategories, icon: FolderTree, color: "text-purple-200" }, { label: "Sub Kategori", value: controller.subCategories, icon: Boxes, color: "text-pink-200" }] as stat, i}
            {@const Icon = stat.icon}
            <div
                class="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 hover:bg-white/20 transition-all duration-300"
                in:fade={{ delay: 600 + i * 100, duration: 500 }}
            >
                <div class="flex items-center gap-2 mb-1">
                    <div class="p-1.5 rounded-lg bg-white/20 {stat.color}">
                        <Icon class="h-4 w-4" />
                    </div>
                    <div
                        class="text-xs font-medium text-indigo-100 uppercase tracking-wider"
                    >
                        {stat.label}
                    </div>
                </div>
                <div class="text-2xl font-bold text-white pl-1">
                    {stat.value}
                </div>
            </div>
        {/each}
    </div>
</section>
