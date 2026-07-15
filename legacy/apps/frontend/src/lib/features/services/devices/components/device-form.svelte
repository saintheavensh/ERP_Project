<script lang="ts">
    import { Input } from "$lib/shared/components/ui/input";
    import { Button } from "$lib/shared/components/ui/button";
    import { Label } from "$lib/shared/components/ui/label";
    import { Textarea } from "$lib/shared/components/ui/textarea";
    import {
        Dialog,
        DialogContent,
        DialogDescription,
        DialogFooter,
        DialogHeader,
        DialogTitle,
    } from "$lib/shared/components/ui/dialog";
    import { Loader2 } from "lucide-svelte";
    import ImageUpload from "$lib/shared/components/custom/image-upload.svelte";
    import { DevicesController } from "../devices.controller.svelte";

    let { controller } = $props<{ controller: DevicesController }>();
</script>

<Dialog
    bind:open={controller.openDialog}
    onOpenChange={(o) => !o && controller.resetForm()}
>
    <DialogContent class="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
            <DialogTitle>
                {controller.editingId ? "Edit Device" : "Add New Device"}
            </DialogTitle>
            <DialogDescription>
                Fill in the device details below.
            </DialogDescription>
        </DialogHeader>

        <div class="grid gap-6 py-4">
            <!-- Basic Info -->
            <div class="grid grid-cols-2 gap-4">
                <div class="grid gap-2">
                    <Label for="brand">Brand *</Label>
                    <Input
                        id="brand"
                        bind:value={controller.form.brand}
                        placeholder="e.g. Samsung"
                    />
                </div>
                <div class="grid gap-2">
                    <Label for="model">Model *</Label>
                    <Input
                        id="model"
                        bind:value={controller.form.model}
                        placeholder="e.g. Galaxy S24"
                    />
                </div>
                <div class="grid gap-2">
                    <Label for="series">Series</Label>
                    <Input
                        id="series"
                        bind:value={controller.form.series}
                        placeholder="e.g. Galaxy S Series"
                    />
                </div>
                <div class="grid gap-2">
                    <Label for="code">Code</Label>
                    <Input
                        id="code"
                        bind:value={controller.form.code}
                        placeholder="Internal Code"
                    />
                </div>
            </div>

            <!-- Image -->
            <div class="grid gap-2">
                <Label>Device Image</Label>
                <ImageUpload bind:value={controller.form.image} />
            </div>

            <!-- Specifications -->
            <div class="grid gap-4 border-t pt-4">
                <h4 class="font-medium">Technical Specifications</h4>

                <div class="grid grid-cols-2 gap-4">
                    <div class="grid gap-2">
                        <Label for="chipset">Chipset</Label>
                        <Input
                            id="chipset"
                            bind:value={controller.form.chipset}
                            placeholder="e.g. Snapdragon 8 Gen 3"
                        />
                    </div>
                    <div class="grid gap-2">
                        <Label for="colors">Colors</Label>
                        <Input
                            id="colors"
                            bind:value={controller.form.colors}
                            placeholder="Comma separated"
                        />
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div class="grid gap-2">
                        <Label for="os">OS</Label>
                        <Input
                            id="os"
                            bind:value={controller.form.os}
                            placeholder="e.g. Android 14"
                        />
                    </div>
                    <div class="grid gap-2">
                        <Label for="release">Release</Label>
                        <Input
                            id="release"
                            bind:value={controller.form.release}
                            placeholder="e.g. 2024, January"
                        />
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div class="grid gap-2">
                        <Label for="display">Display Resolution</Label>
                        <Input
                            id="display"
                            bind:value={controller.form.display}
                            placeholder="e.g. 1080 x 2340 pixels"
                        />
                    </div>
                    <div class="grid gap-2">
                        <Label for="displayType">Display Type</Label>
                        <Input
                            id="displayType"
                            bind:value={controller.form.displayType}
                            placeholder="e.g. Dynamic LTPO AMOLED 2X"
                        />
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div class="grid gap-2">
                        <Label for="mainCamera">Main Camera</Label>
                        <Input
                            id="mainCamera"
                            bind:value={controller.form.mainCamera}
                            placeholder="e.g. 50 MP, f/1.8"
                        />
                    </div>
                    <div class="grid gap-2">
                        <Label for="selfieCamera">Selfie Camera</Label>
                        <Input
                            id="selfieCamera"
                            bind:value={controller.form.selfieCamera}
                            placeholder="e.g. 12 MP, f/2.2"
                        />
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div class="grid gap-2">
                        <Label for="battery">Battery</Label>
                        <Input
                            id="battery"
                            bind:value={controller.form.battery}
                            placeholder="e.g. Li-Ion 4000 mAh"
                        />
                    </div>
                    <div class="grid gap-2">
                        <Label for="usb">USB</Label>
                        <Input
                            id="usb"
                            bind:value={controller.form.usb}
                            placeholder="e.g. USB Type-C 3.2"
                        />
                    </div>
                </div>

                <div class="grid gap-2">
                    <Label for="specs">Additional Specs (JSON/Text)</Label>
                    <Textarea
                        id="specs"
                        bind:value={controller.form.specs}
                        class="h-20"
                    />
                </div>
            </div>
        </div>

        <DialogFooter>
            <Button
                variant="outline"
                onclick={() => (controller.openDialog = false)}
            >
                Cancel
            </Button>
            <Button
                onclick={() => controller.handleSubmit()}
                disabled={controller.isSubmitting}
            >
                {#if controller.isSubmitting}
                    <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                {/if}
                {controller.editingId ? "Update" : "Create"}
            </Button>
        </DialogFooter>
    </DialogContent>
</Dialog>
