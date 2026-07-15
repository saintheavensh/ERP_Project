<script lang="ts">
    import { Button } from "$lib/shared/components/ui/button";
    import {
        Dialog,
        DialogContent,
        DialogDescription,
        DialogFooter,
        DialogHeader,
        DialogTitle,
    } from "$lib/shared/components/ui/dialog";
    import {
        Select,
        SelectContent,
        SelectItem,
        SelectTrigger,
    } from "$lib/shared/components/ui/select";
    import { Label } from "$lib/shared/components/ui/label";
    import { toast } from "svelte-sonner";

    interface Props {
        open?: boolean;
        serviceId?: number | null;
        serviceNo?: string;
        currentTechnician?: string | null;
        onConfirm: (newItem: any) => void;
    }

    let {
        open = $bindable(false),
        serviceId = null,
        serviceNo = "",
        currentTechnician = null,
        onConfirm,
    }: Props = $props();

    let selectedTechnician = $state("");

    $effect(() => {
        if (open && currentTechnician) {
            selectedTechnician = currentTechnician;
        } else if (open && !currentTechnician) {
            selectedTechnician = "";
        }
    });

    function handleSave() {
        if (!selectedTechnician) {
            toast.error("Pilih teknisi terlebih dahulu.");
            return;
        }

        // Simulate API update
        setTimeout(() => {
            onConfirm({
                id: serviceId,
                technician: selectedTechnician,
            });
            open = false;
            toast.success(
                `Teknisi berhasil diubah menjadi ${selectedTechnician}`,
            );
        }, 500);
    }
</script>

<Dialog bind:open>
    <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
            <DialogTitle>Ganti Teknisi</DialogTitle>
            <DialogDescription>
                Assign ulang teknisi untuk Service Order <strong
                    >{serviceNo}</strong
                >.
            </DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 py-4">
            <div class="space-y-2">
                <Label>Teknisi Penanggung Jawab</Label>
                <Select type="single" bind:value={selectedTechnician}>
                    <SelectTrigger>
                        {selectedTechnician || "Pilih Teknisi"}
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Agus">Agus</SelectItem>
                        <SelectItem value="Rudi">Rudi</SelectItem>
                        <SelectItem value="Budi">Budi</SelectItem>
                        <SelectItem value="Siti">Siti</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
        <DialogFooter>
            <Button variant="outline" onclick={() => (open = false)}
                >Batal</Button
            >
            <Button onclick={handleSave}>Simpan Perubahan</Button>
        </DialogFooter>
    </DialogContent>
</Dialog>
