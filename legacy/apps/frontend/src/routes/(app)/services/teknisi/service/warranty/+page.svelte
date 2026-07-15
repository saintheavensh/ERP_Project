<script lang="ts">
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
        CardDescription,
    } from "$lib/shared/components/ui/card";
    import { Button } from "$lib/shared/components/ui/button";
    import { Input } from "$lib/shared/components/ui/input";
    import { Label } from "$lib/shared/components/ui/label";
    import { Separator } from "$lib/shared/components/ui/separator";
    import * as Textarea from "$lib/shared/components/ui/textarea";
    import {
        ArrowLeft,
        Shield,
        Search,
        Upload,
        CheckCircle,
        AlertCircle,
        User,
        Smartphone,
        Calendar,
    } from "lucide-svelte";
    import { toast } from "svelte-sonner";
    import { ServiceService } from "$lib/features/services/services/service.service";

    let searchQuery = $state("");
    let searching = $state(false);
    let searchError = $state("");
    let selectedService = $state<any>(null);

    let description = $state("");
    let evidenceFiles = $state<FileList | null>(null);
    let submitting = $state(false);

    async function handleSearch() {
        if (!searchQuery.trim()) return;

        searching = true;
        searchError = "";
        selectedService = null;

        try {
            const services = await ServiceService.getAll({
                search: searchQuery.trim(),
                status: "diambil",
            });

            if (services.length === 0) {
                searchError =
                    "Tidak ditemukan layanan selesai dengan nomor tersebut.";
            } else {
                selectedService = services[0];
            }
        } catch (e: any) {
            searchError =
                e?.response?.data?.message ??
                "Gagal mencari data service. Coba lagi.";
        } finally {
            searching = false;
        }
    }

    async function handleSubmit() {
        if (!selectedService || !description.trim()) return;

        submitting = true;
        try {
            // Placeholder — backend warranty claim endpoint not yet available
            toast.info(
                "Klaim garansi disimpan. Fitur pengiriman ke server sedang dikembangkan.",
            );

            // Reset form
            description = "";
            evidenceFiles = null;
            selectedService = null;
            searchQuery = "";
        } catch (e: any) {
            toast.error(e?.message ?? "Gagal mengirim klaim garansi.");
        } finally {
            submitting = false;
        }
    }

    function formatDate(dateStr: string): string {
        return new Date(dateStr).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    }
</script>

<div class="space-y-6">
    <div class="flex items-center gap-4">
        <Button variant="ghost" href="/services/teknisi/service">
            <ArrowLeft class="h-4 w-4 mr-2" />
            Kembali
        </Button>
        <div>
            <h3 class="text-2xl font-bold tracking-tight">🛡️ Klaim Garansi</h3>
            <p class="text-sm text-muted-foreground">
                Ajukan klaim garansi untuk service sebelumnya
            </p>
        </div>
    </div>
    <Separator />

    <!-- Search Section -->
    <Card class="border-0 shadow-lg">
        <CardHeader>
            <CardTitle class="flex items-center gap-2 text-base">
                <Search class="h-5 w-5" />
                Cari Service Selesai
            </CardTitle>
            <CardDescription>
                Masukkan nomor service atau nama customer untuk mencari.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <form
                onsubmit={(e) => {
                    e.preventDefault();
                    handleSearch();
                }}
                class="flex gap-3"
            >
                <Input
                    placeholder="Nomor service atau nama customer..."
                    bind:value={searchQuery}
                    disabled={searching}
                    class="flex-1"
                />
                <Button
                    type="submit"
                    disabled={searching || !searchQuery.trim()}
                >
                    <Search class="h-4 w-4 mr-2" />
                    {searching ? "Mencari..." : "Cari"}
                </Button>
            </form>

            {#if searchError}
                <div
                    class="flex items-center gap-2 mt-4 p-3 rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 text-sm"
                >
                    <AlertCircle class="h-4 w-4 shrink-0" />
                    {searchError}
                </div>
            {/if}
        </CardContent>
    </Card>

    <!-- Service Details -->
    {#if selectedService}
        <Card class="border-0 shadow-lg border-l-4 border-l-green-500">
            <CardHeader>
                <CardTitle class="flex items-center gap-2 text-base">
                    <CheckCircle class="h-5 w-5 text-green-500" />
                    Detail Service Ditemukan
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div class="flex items-center gap-3">
                        <div
                            class="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/50"
                        >
                            <Shield class="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                            <p class="text-xs text-muted-foreground">
                                No. Service
                            </p>
                            <p class="font-semibold">
                                {selectedService.serviceNumber ??
                                    selectedService.id}
                            </p>
                        </div>
                    </div>
                    <div class="flex items-center gap-3">
                        <div
                            class="rounded-lg bg-purple-100 p-2 dark:bg-purple-900/50"
                        >
                            <User class="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                            <p class="text-xs text-muted-foreground">
                                Customer
                            </p>
                            <p class="font-semibold">
                                {selectedService.customer?.name ?? "-"}
                            </p>
                        </div>
                    </div>
                    <div class="flex items-center gap-3">
                        <div
                            class="rounded-lg bg-orange-100 p-2 dark:bg-orange-900/50"
                        >
                            <Smartphone class="h-4 w-4 text-orange-600" />
                        </div>
                        <div>
                            <p class="text-xs text-muted-foreground">
                                Perangkat
                            </p>
                            <p class="font-semibold">
                                {selectedService.device?.brand ?? ""}
                                {selectedService.device?.model ?? "-"}
                            </p>
                        </div>
                    </div>
                    <div class="flex items-center gap-3">
                        <div
                            class="rounded-lg bg-green-100 p-2 dark:bg-green-900/50"
                        >
                            <Calendar class="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                            <p class="text-xs text-muted-foreground">
                                Tanggal Selesai
                            </p>
                            <p class="font-semibold">
                                {selectedService.updatedAt
                                    ? formatDate(selectedService.updatedAt)
                                    : "-"}
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>

        <!-- Claim Form -->
        <Card class="border-0 shadow-lg">
            <CardHeader>
                <CardTitle class="flex items-center gap-2 text-base">
                    <Shield class="h-5 w-5" />
                    Form Klaim Garansi
                </CardTitle>
                <CardDescription>
                    Jelaskan masalah yang terjadi dan lampirkan bukti foto jika
                    ada.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form
                    onsubmit={(e) => {
                        e.preventDefault();
                        handleSubmit();
                    }}
                    class="space-y-5"
                >
                    <div class="space-y-2">
                        <Label for="claim-description">Deskripsi Masalah</Label>
                        <Textarea.Textarea
                            id="claim-description"
                            bind:value={description}
                            placeholder="Jelaskan masalah yang terjadi setelah service..."
                            rows={4}
                            required
                        />
                    </div>

                    <div class="space-y-2">
                        <Label for="claim-evidence">Bukti Foto (Opsional)</Label
                        >
                        <Input
                            id="claim-evidence"
                            type="file"
                            accept="image/*"
                            multiple
                            onchange={(e: Event) => {
                                const target = e.target as HTMLInputElement;
                                evidenceFiles = target.files;
                            }}
                        />
                        <p class="text-xs text-muted-foreground">
                            Upload foto kerusakan (maksimal 5 file, format
                            JPG/PNG)
                        </p>
                    </div>

                    <div class="flex justify-end gap-3 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onclick={() => {
                                selectedService = null;
                                description = "";
                                evidenceFiles = null;
                            }}
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            disabled={submitting || !description.trim()}
                        >
                            <Upload class="h-4 w-4 mr-2" />
                            {submitting ? "Mengirim..." : "Kirim Klaim"}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    {/if}
</div>
