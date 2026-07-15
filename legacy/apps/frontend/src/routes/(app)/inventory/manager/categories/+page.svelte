<script lang="ts">
    import { CategoriesController } from "$lib/features/inventory/categories/categories.controller.svelte";
    import { Button } from "$lib/shared/components/ui/button";
    import { Input } from "$lib/shared/components/ui/input";
    import { Search, Filter, Download } from "lucide-svelte";
    import {
        AlertDialog,
        AlertDialogAction,
        AlertDialogCancel,
        AlertDialogContent,
        AlertDialogDescription,
        AlertDialogFooter,
        AlertDialogHeader,
        AlertDialogTitle,
    } from "$lib/shared/components/ui/alert-dialog";
    import CategoryHeader from "$lib/features/inventory/categories/components/CategoryHeader.svelte";
    import CategoryList from "$lib/features/inventory/categories/components/CategoryList.svelte";
    import CategoryDialog from "$lib/features/inventory/categories/components/CategoryDialog.svelte";

    const controller = new CategoriesController();
</script>

<div class="container mx-auto py-8 space-y-8 animate-in fade-in duration-500">
    <!-- Hero Section -->
    <CategoryHeader {controller} />

    <!-- Main Content -->
    <div class="grid gap-6">
        <!-- Toolbar -->
        <div
            class="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border bg-card shadow-sm"
        >
            <div class="relative w-full sm:w-72">
                <Search
                    class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                />
                <Input
                    placeholder="Cari kategori..."
                    class="pl-9 bg-secondary/30 border-transparent focus:bg-background focus:border-primary transition-all"
                />
            </div>
            <div class="flex items-center gap-2">
                <Button variant="outline" size="sm" class="h-9">
                    <Filter class="h-3.5 w-3.5 mr-2" /> Filter
                </Button>
                <Button variant="outline" size="sm" class="h-9">
                    <Download class="h-3.5 w-3.5 mr-2" /> Export
                </Button>
            </div>
        </div>

        <!-- Hierarchical Table -->
        <CategoryList {controller} />
    </div>

    <!-- Create/Edit Dialog -->
    <CategoryDialog {controller} />

    <!-- Alert Dialog -->
    <AlertDialog bind:open={controller.deleteOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Hapus Kategori?</AlertDialogTitle>
                <AlertDialogDescription>
                    Tindakan ini tidak dapat dibatalkan. Pastikan tidak ada
                    produk yang menggunakan kategori ini.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction
                    class="bg-red-600 hover:bg-red-700"
                    onclick={() => controller.handleDelete()}
                    >Ya, Hapus</AlertDialogAction
                >
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
</div>
