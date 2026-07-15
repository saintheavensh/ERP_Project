<script lang="ts">
    import { Button } from "$lib/shared/components/ui/button";
    import { Input } from "$lib/shared/components/ui/input";
    import { Label } from "$lib/shared/components/ui/label";
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
        CardDescription,
        CardFooter,
    } from "$lib/shared/components/ui/card";
    import { Badge } from "$lib/shared/components/ui/badge";
    import { Textarea } from "$lib/shared/components/ui/textarea";
    import {
        Search,
        AlertTriangle,
        CheckCircle,
        Calendar,
        Smartphone,
        User,
    } from "lucide-svelte";
    import { toast } from "svelte-sonner";

    let searchQuery = $state("");
    let searchResult = $state<any>(null);
    let isSearching = $state(false);
    let claimDescription = $state("");

    // Mock Database of Finished Services
    const mockServices = [
        {
            id: 101,
            no: "SRV-2026-001",
            date: "2026-01-01", // Finished date
            customer: "Budi Santoso",
            phone: "0812-3456-7890",
            brand: "iPhone 15 Pro",
            imei: "354217123456789",
            warrantyDuration: 7, // days
            status: "selesai",
            totalCost: 1500000,
            technician: "Agus",
        },
        {
            id: 102,
            no: "SRV-2026-002",
            date: "2025-12-25",
            customer: "Siti Aminah",
            phone: "0821-9876-0000",
            brand: "Samsung S24 Ultra",
            imei: "359876543210123",
            warrantyDuration: 30, // days
            status: "selesai",
            totalCost: 500000,
            technician: "Rudi",
        },
        {
            id: 103,
            no: "SRV-OLD-001",
            date: "2025-11-20",
            customer: "Grace Period Test",
            phone: "0899-1111-2222",
            brand: "Oppo Reno",
            imei: "123456789012345",
            warrantyDuration: 30, // days
            status: "selesai", // Expired ~20 Dec. Current Jan 5. Gap ~15 days.
            totalCost: 750000,
            technician: "Budi",
        },
    ];

    function handleSearch() {
        if (!searchQuery) return;
        isSearching = true;

        // Simulate API call
        setTimeout(() => {
            const found = mockServices.find(
                (s) =>
                    s.no.toLowerCase() === searchQuery.toLowerCase() ||
                    s.imei === searchQuery ||
                    s.phone === searchQuery,
            );

            searchResult = found || null;
            isSearching = false;

            if (!found) {
                toast.error("Data service tidak ditemukan atau belum selesai.");
            }
        }, 800);
    }

    function checkWarrantyStatus(dateStr: string, duration: number) {
        const finishDate = new Date(dateStr);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - finishDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const isExpired = diffDays > duration;
        const remainingDays = duration - diffDays;

        // Grace Period: Max 30 days after expiration
        const GRACE_PERIOD = 30;
        const daysPastExpiration = diffDays - duration;
        const isGracePeriod = isExpired && daysPastExpiration <= GRACE_PERIOD;

        return {
            isExpired,
            isGracePeriod,
            diffDays,
            remainingDays,
            daysPastExpiration,
        };
    }

    let showGraceConfirmation = $state(false);

    function handleGraceClaimClick() {
        showGraceConfirmation = true;
    }

    function confirmGraceClaim() {
        showGraceConfirmation = false;
        // Proceed to show form or submit directly?
        // User asked: "bila admin klik klaim garansi muncul warning setuju atau tidak"
        // If agreed, we allow editing the claim description.
        // So let's enable a "forceClaim" mode.
        isForceClaimEnabled = true;
    }

    let isForceClaimEnabled = $state(false);

    // Reset force claim on new search
    $effect(() => {
        if (searchResult) {
            isForceClaimEnabled = false;
            showGraceConfirmation = false;
        }
    });

    function handleSubmitClaim() {
        if (!claimDescription) {
            toast.error("Mohon isi keterangan keluhan garansi.");
            return;
        }

        const originalTech = searchResult.technician;
        const statusType = isForceClaimEnabled
            ? "Claim (Grace Period)"
            : "Claim";

        // Simulate submission
        toast.success(
            `Klaim garansi untuk nota ${searchResult.no} berhasil dibuat!`,
            {
                description: `Tiket baru "${statusType}" dibuat & otomatis di-assign ke teknisi: ${originalTech}. Status: Menunggu.`,
            },
        );

        // Reset
        searchQuery = "";
        searchResult = null;
        claimDescription = "";
        isForceClaimEnabled = false;
    }
</script>

<div class="max-w-2xl mx-auto space-y-6">
    <!-- Search Card (Same as before) -->
    <Card>
        <CardHeader>
            <CardTitle>Cari Data Service</CardTitle>
            <CardDescription
                >Masukkan Nomor Nota, IMEI, atau No. HP untuk mengecek garansi.</CardDescription
            >
        </CardHeader>
        <CardContent>
            <div class="flex gap-4">
                <div class="relative flex-1">
                    <Search
                        class="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground"
                    />
                    <Input
                        placeholder="Contoh: SRV-2026-001 atau IMEI"
                        class="pl-9"
                        bind:value={searchQuery}
                        onkeydown={(e) => e.key === "Enter" && handleSearch()}
                    />
                </div>
                <Button onclick={handleSearch} disabled={isSearching}>
                    {isSearching ? "Mencari..." : "Cek Garansi"}
                </Button>
            </div>
        </CardContent>
    </Card>

    {#if searchResult}
        {@const warranty = checkWarrantyStatus(
            searchResult.date,
            searchResult.warrantyDuration,
        )}

        <div class="grid gap-6 animate-in fade-in slide-in-from-bottom-4">
            <!-- Service Details Card -->
            <Card
                class="border-l-4 {warranty.isExpired
                    ? warranty.isGracePeriod
                        ? 'border-l-yellow-500'
                        : 'border-l-red-500'
                    : 'border-l-green-500'}"
            >
                <CardHeader>
                    <div class="flex justify-between items-start">
                        <div>
                            <CardTitle class="text-lg flex items-center gap-2">
                                {searchResult.brand}
                                <Badge variant="outline"
                                    >{searchResult.status.toUpperCase()}</Badge
                                >
                            </CardTitle>
                            <CardDescription
                                >No. Nota: {searchResult.no}</CardDescription
                            >
                        </div>
                        <div class="text-right">
                            {#if warranty.isExpired}
                                {#if warranty.isGracePeriod}
                                    <Badge
                                        variant="secondary"
                                        class="bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                                        >GRACE PERIOD</Badge
                                    >
                                {:else}
                                    <Badge
                                        variant="destructive"
                                        class="text-sm px-3 py-1"
                                        >GARANSI EXPIRED</Badge
                                    >
                                {/if}
                            {:else}
                                <Badge
                                    variant="default"
                                    class="bg-green-600 hover:bg-green-700 text-sm px-3 py-1"
                                    >GARANSI AKTIF</Badge
                                >
                            {/if}
                        </div>
                    </div>
                </CardHeader>
                <CardContent class="grid md:grid-cols-2 gap-4 text-sm">
                    <div class="space-y-3">
                        <div class="flex items-center gap-2">
                            <User class="h-4 w-4 text-muted-foreground" />
                            <span class="font-medium"
                                >{searchResult.customer}</span
                            >
                        </div>
                        <div class="flex items-center gap-2">
                            <Smartphone class="h-4 w-4 text-muted-foreground" />
                            <span
                                >{searchResult.phone} / {searchResult.imei}</span
                            >
                        </div>
                    </div>
                    <div class="space-y-3">
                        <div class="flex items-center gap-2">
                            <Calendar class="h-4 w-4 text-muted-foreground" />
                            <span
                                >Tanggal Selesai: <strong
                                    >{searchResult.date}</strong
                                ></span
                            >
                        </div>
                        <div class="flex items-center gap-2">
                            <CheckCircle
                                class="h-4 w-4 text-muted-foreground"
                            />
                            <span
                                >Masa Garansi: <strong
                                    >{searchResult.warrantyDuration} Hari</strong
                                ></span
                            >
                        </div>
                        <div class="p-2 bg-muted rounded text-xs">
                            {#if warranty.isExpired}
                                <span
                                    class="{warranty.isGracePeriod
                                        ? 'text-yellow-700'
                                        : 'text-red-600'} font-medium"
                                    >Lewat {warranty.daysPastExpiration} hari dari
                                    masa garansi.</span
                                >
                            {:else}
                                <span class="text-green-600 font-medium"
                                    >Sisa waktu garansi: {warranty.remainingDays}
                                    hari lagi.</span
                                >
                            {/if}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <!-- Claim Form Logic -->
            {#if !warranty.isExpired || isForceClaimEnabled}
                <Card
                    class={isForceClaimEnabled
                        ? "border-yellow-500 border-2"
                        : ""}
                >
                    <CardHeader>
                        <CardTitle
                            >Formulir Klaim {isForceClaimEnabled
                                ? "(Kebijakan Toko)"
                                : ""}</CardTitle
                        >
                        <CardDescription
                            >Isi detail keluhan untuk diproses ulang.</CardDescription
                        >
                    </CardHeader>
                    <CardContent class="space-y-4">
                        <div class="space-y-2">
                            <Label>Keluhan / Kerusakan Kembali</Label>
                            <Textarea
                                placeholder="Jelaskan kendala yang dialami customer..."
                                rows={4}
                                bind:value={claimDescription}
                            />
                        </div>

                        {#if isForceClaimEnabled}
                            <div
                                class="bg-yellow-50 p-3 rounded-md border border-yellow-200 flex gap-2 text-sm text-yellow-800"
                            >
                                <AlertTriangle class="h-5 w-5 shrink-0" />
                                <p>
                                    <strong>PERHATIAN:</strong> Klaim ini diproses
                                    diluar masa garansi resmi berdasarkan kebijakan
                                    toko.
                                </p>
                            </div>
                        {:else}
                            <div
                                class="bg-blue-50 p-3 rounded-md border border-blue-200 flex gap-2 text-sm text-blue-800"
                            >
                                <AlertTriangle class="h-5 w-5 shrink-0" />
                                <p>
                                    Pastikan segel garansi masih utuh dan bukan
                                    human error.
                                </p>
                            </div>
                        {/if}
                    </CardContent>
                    <CardFooter>
                        <Button class="w-full" onclick={handleSubmitClaim}
                            >Proses Klaim Garansi</Button
                        >
                    </CardFooter>
                </Card>
            {:else if warranty.isGracePeriod && !isForceClaimEnabled}
                <!-- Grace Period Warning / Offer -->
                <Card class="border-yellow-400 bg-yellow-50/50">
                    <CardHeader>
                        <CardTitle
                            class="text-yellow-800 flex items-center gap-2"
                        >
                            <AlertTriangle class="h-5 w-5" />
                            Garansi Habis (Masa Tenggang)
                        </CardTitle>
                        <CardDescription class="text-yellow-700">
                            Unit ini telah melewati masa garansi, namun masih
                            dalam periode kebijakan toko (Maks 1 Bulan).
                            <br />Anda dapat mengajukan klaim khusus dengan
                            persetujuan Admin.
                        </CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button
                            variant="outline"
                            class="w-full border-yellow-600 text-yellow-800 hover:bg-yellow-100"
                            onclick={handleGraceClaimClick}
                        >
                            Ajukan Klaim Kebijakan Toko
                        </Button>
                    </CardFooter>
                </Card>
            {:else}
                <!-- Hard Expired -->
                <div
                    class="p-4 rounded-lg border bg-muted text-center space-y-2"
                >
                    <AlertTriangle
                        class="h-8 w-8 mx-auto text-muted-foreground"
                    />
                    <h4 class="font-medium">Garansi Tidak Tersedia</h4>
                    <p class="text-sm text-muted-foreground">
                        Masa garansi telah habis lebih dari 1 bulan. Tidak ada
                        kebijakan toleransi tersedia.<br />
                        Silakan buat Service Order baru.
                    </p>
                </div>
            {/if}
        </div>
    {/if}

    <!-- Confirmation Dialog for Grace Period -->
    {#if showGraceConfirmation}
        <div
            class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        >
            <Card
                class="w-full max-w-md shadow-lg animate-in fade-in zoom-in-95"
            >
                <CardHeader>
                    <CardTitle class="text-red-600 flex items-center gap-2">
                        <AlertTriangle class="h-5 w-5" />
                        Konfirmasi Klaim Diluar Garansi
                    </CardTitle>
                    <CardDescription>
                        Anda akan memproses klaim untuk unit yang sudah <strong
                            >EXPIRED</strong
                        >. Tindakan ini memerlukan persetujuan kebijakan toko.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p class="text-sm font-medium">
                        Apakah Anda setuju untuk melanjutkan klaim ini?
                    </p>
                </CardContent>
                <CardFooter class="flex justify-end gap-2">
                    <Button
                        variant="outline"
                        onclick={() => (showGraceConfirmation = false)}
                        >Tidak, Batalkan</Button
                    >
                    <Button variant="destructive" onclick={confirmGraceClaim}
                        >Ya, Saya Setuju</Button
                    >
                </CardFooter>
            </Card>
        </div>
    {/if}
</div>
