<script lang="ts">
    import { Button } from "$lib/shared/components/ui/button";
    import { Input } from "$lib/shared/components/ui/input";
    import { Label } from "$lib/shared/components/ui/label";
    import {
        Dialog,
        DialogContent,
        DialogDescription,
        DialogFooter,
        DialogHeader,
        DialogTitle,
    } from "$lib/shared/components/ui/dialog";
    import { CornerDownRight } from "lucide-svelte";
    import type { CategoriesController } from "../categories.controller.svelte";

    let { controller }: { controller: CategoriesController } = $props();
</script>

<Dialog
    bind:open={controller.open}
    onOpenChange={(isOpen) => !isOpen && controller.resetForm()}
>
    <DialogContent class="sm:max-w-[500px]">
        <DialogHeader>
            <DialogTitle class="text-xl font-semibold">
                {#if controller.editingId}
                    Edit Kategori
                {:else if controller.parentId}
                    Sub-Kategori Baru
                {:else}
                    Buat Kategori Baru
                {/if}
            </DialogTitle>
            <DialogDescription>
                {#if controller.parentId && !controller.editingId}
                    Menambahkan sub-kategori ke dalam: <span
                        class="font-bold text-primary"
                        >{controller.getParentName(controller.parentId)}</span
                    >
                {:else if controller.editingId}
                    Perbarui informasi kategori.
                {:else}
                    Tambahkan kategori utama baru ke inventaris.
                {/if}
            </DialogDescription>
        </DialogHeader>

        <div class="grid gap-6 py-4">
            {#if controller.parentId && !controller.editingId}
                <div class="relative p-4 rounded-lg border bg-muted/30">
                    <Label
                        class="text-xs font-semibold uppercase text-muted-foreground absolute -top-2 left-3 bg-background px-1"
                        >Induk</Label
                    >
                    <div class="flex items-center gap-2">
                        <CornerDownRight
                            class="h-4 w-4 text-muted-foreground"
                        />
                        <span class="font-medium text-foreground">
                            {controller.getParentName(controller.parentId)}
                        </span>
                    </div>
                </div>
            {/if}

            <div class="grid gap-2">
                <Label for="name">Nama Kategori</Label>
                <Input
                    id="name"
                    bind:value={controller.name}
                    placeholder="Contoh: Sparepart, Aksesoris..."
                    class="transition-all focus:ring-2 focus:ring-primary/20"
                />
            </div>

            <div class="grid gap-2">
                <Label for="desc">Deskripsi</Label>
                <Input
                    id="desc"
                    bind:value={controller.description}
                    placeholder="Keterangan singkat..."
                    class="transition-all focus:ring-2 focus:ring-primary/20"
                />
            </div>
        </div>

        <DialogFooter>
            <Button variant="outline" onclick={() => controller.closeDialog()}
                >Batal</Button
            >
            <Button onclick={() => controller.handleSubmit()}>
                {#if controller.editingId}
                    Simpan Perubahan
                {:else}
                    Buat Kategori
                {/if}
            </Button>
        </DialogFooter>
    </DialogContent>
</Dialog>
