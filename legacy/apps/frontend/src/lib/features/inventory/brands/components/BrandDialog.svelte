<script lang="ts">
    import { Button } from "$lib/shared/components/ui/button";
    import { Input } from "$lib/shared/components/ui/input";
    import { Label } from "$lib/shared/components/ui/label";
    import {
        Dialog,
        DialogContent,
        DialogHeader,
        DialogTitle,
        DialogFooter,
    } from "$lib/shared/components/ui/dialog";
    import ImageUpload from "$lib/shared/components/custom/image-upload.svelte";
    import type { BrandsController } from "../brands.controller.svelte";

    let { controller }: { controller: BrandsController } = $props();
</script>

<Dialog bind:open={controller.isDialogOpen}>
    <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
            <DialogTitle
                >{controller.isEditing
                    ? "Edit Brand"
                    : "Tambah Brand"}</DialogTitle
            >
        </DialogHeader>
        <div class="grid gap-4 py-4">
            <div class="grid gap-2">
                <Label for="name">Nama Brand</Label>
                <Input
                    id="name"
                    bind:value={controller.formData.name}
                    placeholder="Contoh: Samsung"
                />
            </div>

            {#if !controller.isEditing}
                <div class="grid gap-2">
                    <Label for="id">ID (Optional - Auto Generated)</Label>
                    <Input
                        id="id"
                        bind:value={controller.formData.id}
                        placeholder="samsung"
                    />
                    <p class="text-xs text-muted-foreground">
                        ID unik, tidak bisa diubah setelah dibuat.
                    </p>
                </div>
            {/if}

            <div class="grid gap-2">
                <Label>Logo</Label>
                <ImageUpload bind:value={controller.formData.logo} />
            </div>
        </div>
        <DialogFooter>
            <Button variant="outline" onclick={() => controller.closeDialog()}
                >Batal</Button
            >
            <Button onclick={() => controller.handleSubmit()}
                >{controller.isEditing
                    ? "Simpan Perubahan"
                    : "Buat Brand"}</Button
            >
        </DialogFooter>
    </DialogContent>
</Dialog>
