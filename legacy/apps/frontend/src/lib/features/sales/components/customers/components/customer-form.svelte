<script lang="ts">
    import { Input } from "$lib/shared/components/ui/input";
    import { Button } from "$lib/shared/components/ui/button";
    import { Label } from "$lib/shared/components/ui/label";
    import {
        Dialog,
        DialogContent,
        DialogDescription,
        DialogFooter,
        DialogHeader,
        DialogTitle,
    } from "$lib/shared/components/ui/dialog";
    import { User, Phone, MapPin, CreditCard, Loader2 } from "lucide-svelte";
    import CurrencyInput from "$lib/shared/components/custom/currency-input.svelte";
    import { CustomersController } from "../customers.controller.svelte";

    let { controller } = $props<{ controller: CustomersController }>();
</script>

<Dialog
    bind:open={controller.openDialog}
    onOpenChange={(o) => !o && controller.resetForm()}
>
    <DialogContent
        class="sm:max-w-[500px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl"
    >
        <div
            class="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white"
        >
            <DialogTitle class="text-2xl font-bold">
                {controller.editingId
                    ? "Perbarui Pelanggan"
                    : "Tambah Pelanggan Baru"}
            </DialogTitle>
            <DialogDescription class="text-blue-100 mt-1">
                Silakan lengkapi informasi profil dan pengaturan limit kredit.
            </DialogDescription>
        </div>

        <div class="p-8 space-y-5 bg-background">
            <div class="grid gap-5">
                <div class="grid gap-2">
                    <Label
                        for="name"
                        class="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2"
                    >
                        <User class="h-3.5 w-3.5 text-blue-500" /> Nama Lengkap
                        <span class="text-red-500">*</span>
                    </Label>
                    <Input
                        id="name"
                        bind:value={controller.name}
                        placeholder="Contoh: Toko Berkah Jaya"
                        class="h-11 rounded-xl"
                    />
                </div>

                <div class="grid gap-2">
                    <Label
                        for="phone"
                        class="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2"
                    >
                        <Phone class="h-3.5 w-3.5 text-blue-500" /> Nomor Telepon
                        <span class="text-red-500">*</span>
                    </Label>
                    <Input
                        id="phone"
                        bind:value={controller.phone}
                        placeholder="08xxxxxxxx"
                        class="h-11 rounded-xl"
                    />
                </div>

                <div class="grid gap-2">
                    <Label
                        for="address"
                        class="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2"
                    >
                        <MapPin class="h-3.5 w-3.5 text-blue-500" /> Alamat
                    </Label>
                    <Input
                        id="address"
                        bind:value={controller.address}
                        placeholder="Alamat lengkap pengiriman"
                        class="h-11 rounded-xl"
                    />
                </div>

                <div class="grid gap-2">
                    <Label
                        for="creditLimit"
                        class="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2"
                    >
                        <CreditCard class="h-3.5 w-3.5 text-blue-500" /> Limit Kredit
                    </Label>
                    <div class="relative">
                        <span
                            class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-bold z-10"
                            >Rp</span
                        >
                        <CurrencyInput
                            bind:value={controller.creditLimit}
                            class="h-11 pl-9 rounded-xl font-bold text-blue-700"
                            placeholder="0"
                        />
                    </div>
                </div>
            </div>
        </div>

        <DialogFooter class="px-8 pb-8 pt-0 bg-background">
            <Button
                variant="ghost"
                class="h-11 px-6 rounded-xl"
                onclick={() => (controller.openDialog = false)}>Batal</Button
            >
            <Button
                class="h-11 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20"
                onclick={() => controller.handleSave()}
                disabled={controller.isSubmitting}
            >
                {#if controller.isSubmitting}
                    <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                {:else}
                    {controller.editingId
                        ? "Simpan Perubahan"
                        : "Simpan Pelanggan"}
                {/if}
            </Button>
        </DialogFooter>
    </DialogContent>
</Dialog>
