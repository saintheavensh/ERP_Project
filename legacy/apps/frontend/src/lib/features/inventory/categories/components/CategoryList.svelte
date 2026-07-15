<script lang="ts">
    import {
        Table,
        TableBody,
        TableCell,
        TableHead,
        TableHeader,
        TableRow,
    } from "$lib/shared/components/ui/table";
    import {
        DropdownMenu,
        DropdownMenuContent,
        DropdownMenuItem,
        DropdownMenuTrigger,
    } from "$lib/shared/components/ui/dropdown-menu";
    import { Button, buttonVariants } from "$lib/shared/components/ui/button";
    import { Badge } from "$lib/shared/components/ui/badge";
    import { Skeleton } from "$lib/shared/components/ui/skeleton";
    import {
        FolderTree,
        ChevronRight,
        Plus,
        MoreHorizontal,
        Pencil,
        Trash2,
    } from "lucide-svelte";
    import { slide } from "svelte/transition";
    import type { CategoriesController } from "../categories.controller.svelte";

    let { controller }: { controller: CategoriesController } = $props();
</script>

<div class="rounded-xl border bg-card shadow-sm overflow-hidden">
    <Table>
        <TableHeader class="bg-muted/40">
            <TableRow
                class="hover:bg-transparent border-b-slate-200/60 dark:border-slate-700/60"
            >
                <TableHead class="w-[50%] py-4 pl-6">Nama Kategori</TableHead>
                <TableHead class="hidden md:table-cell">Deskripsi</TableHead>
                <TableHead class="text-center w-[100px]">Sub-Item</TableHead>
                <TableHead class="text-right w-[150px] pr-6">Aksi</TableHead>
            </TableRow>
        </TableHeader>
        <TableBody>
            {#if controller.isLoading}
                {#each Array(5) as _}
                    <TableRow>
                        <TableCell class="pl-6"
                            ><Skeleton class="h-6 w-48 rounded" /></TableCell
                        >
                        <TableCell
                            ><Skeleton class="h-4 w-full rounded" /></TableCell
                        >
                        <TableCell
                            ><Skeleton
                                class="h-4 w-10 mx-auto rounded"
                            /></TableCell
                        >
                        <TableCell class="pr-6"
                            ><Skeleton
                                class="h-8 w-8 ml-auto rounded"
                            /></TableCell
                        >
                    </TableRow>
                {/each}
            {:else if controller.hierarchicalList.length === 0}
                <TableRow>
                    <TableCell
                        colspan={4}
                        class="h-48 text-center text-muted-foreground"
                    >
                        <div
                            class="flex flex-col items-center justify-center gap-2"
                        >
                            <div
                                class="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-2"
                            >
                                <FolderTree class="h-6 w-6 opacity-30" />
                            </div>
                            <p class="font-medium">Belum ada kategori</p>
                            <p class="text-sm">
                                Mulai dengan menambahkan kategori baru
                            </p>
                        </div>
                    </TableCell>
                </TableRow>
            {:else}
                {#each controller.hierarchicalList as cat (cat.id)}
                    {#if cat.visible}
                        <tr
                            class="border-b transition-colors hover:bg-muted/30 data-[state=selected]:bg-muted group"
                            transition:slide={{
                                duration: 200,
                                axis: "y",
                            }}
                        >
                            <TableCell class="font-medium p-2 pl-6">
                                <div
                                    class="flex items-center"
                                    style="padding-left: {cat.level * 28}px;"
                                >
                                    <!-- Collapse Toggle -->
                                    {#if cat.hasChildren}
                                        <button
                                            onclick={() =>
                                                controller.toggleExpand(cat.id)}
                                            class="mr-2 p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md text-muted-foreground transition-all duration-200"
                                        >
                                            <ChevronRight
                                                class={`h-4 w-4 transition-transform duration-200 ${controller.expandedMap[cat.id] ? "rotate-90" : ""}`}
                                            />
                                        </button>
                                    {:else}
                                        <div class="w-6 mr-2"></div>
                                    {/if}

                                    <!-- Category Icon & Name -->
                                    <div class="flex items-center gap-3">
                                        <div
                                            class={`p-1.5 rounded-lg ${cat.level === 0 ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`}
                                        >
                                            <FolderTree class="h-4 w-4" />
                                        </div>
                                        <span
                                            class={cat.level === 0
                                                ? "font-semibold text-foreground"
                                                : "text-muted-foreground group-hover:text-foreground transition-colors"}
                                        >
                                            {cat.name}
                                        </span>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell
                                class="hidden md:table-cell text-muted-foreground text-sm"
                            >
                                {cat.description || "-"}
                            </TableCell>
                            <TableCell class="text-center">
                                {#if cat.childrenCount > 0}
                                    <Badge
                                        variant="secondary"
                                        class="font-normal bg-secondary/50 hover:bg-secondary"
                                    >
                                        {cat.childrenCount} sub
                                    </Badge>
                                {:else}
                                    <span
                                        class="text-muted-foreground/30 text-xs"
                                        >-</span
                                    >
                                {/if}
                            </TableCell>
                            <TableCell class="text-right p-2 pr-6">
                                <div
                                    class="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                >
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        class="h-8 w-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                                        title="Tambah Sub-Kategori"
                                        onclick={() =>
                                            controller.handleAddSub(cat)}
                                    >
                                        <Plus class="h-4 w-4" />
                                    </Button>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger
                                            class={buttonVariants({
                                                variant: "ghost",
                                                size: "icon",
                                                className: "h-8 w-8",
                                            })}
                                        >
                                            <MoreHorizontal class="h-4 w-4" />
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent
                                            align="end"
                                            class="w-48"
                                        >
                                            <DropdownMenuItem
                                                onclick={() =>
                                                    controller.handleEdit(cat)}
                                            >
                                                <Pencil class="mr-2 h-4 w-4" /> Edit
                                                Details
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                class="text-red-600 focus:text-red-700 focus:bg-red-50"
                                                onclick={() =>
                                                    controller.confirmDelete(
                                                        cat.id,
                                                    )}
                                            >
                                                <Trash2 class="mr-2 h-4 w-4" /> Delete
                                                Category
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </TableCell>
                        </tr>
                    {/if}
                {/each}
            {/if}
        </TableBody>
    </Table>
</div>
