<script>
    import {
        Card,
        CardHeader,
        CardTitle,
        CardDescription,
        CardContent,
    } from "$lib/shared/components/ui/card";
    import { FileText, TrendingUp, Scale, ArrowRight } from "lucide-svelte";
    import { Button } from "$lib/shared/components/ui/button";
</script>

<div class="space-y-6 animate-in fade-in duration-500 pb-10">
    <div>
        <h1 class="text-2xl font-bold text-slate-900">Laporan Keuangan</h1>
        <p class="text-slate-500">
            Pusat data dan analisis kesehatan bisnis Anda.
        </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- 1. General Ledger -->
        <Card class="hover:shadow-lg transition-shadow cursor-pointer group">
            <CardHeader>
                <div
                    class="p-3 bg-blue-50 w-fit rounded-xl mb-4 group-hover:scale-110 transition-transform"
                >
                    <FileText class="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>Buku Besar (General Ledger)</CardTitle>
                <CardDescription>
                    Lihat detail mutasi setiap akun secara lengkap. Cocok untuk
                    audit transaksi.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button
                    variant="outline"
                    class="w-full gap-2"
                    href="/accounting/reports/gl"
                >
                    Buka Laporan
                    <ArrowRight class="h-4 w-4" />
                </Button>
            </CardContent>
        </Card>

        <!-- 2. Profit & Loss -->
        <Card class="hover:shadow-lg transition-shadow cursor-pointer group">
            <CardHeader>
                <div
                    class="p-3 bg-green-50 w-fit rounded-xl mb-4 group-hover:scale-110 transition-transform"
                >
                    <TrendingUp class="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>Laba Rugi (Profit & Loss)</CardTitle>
                <CardDescription>
                    Analisa pendapatan vs beban untuk mengetahui keuntungan
                    bersih periode ini.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button
                    variant="outline"
                    class="w-full gap-2 hover:bg-green-50 hover:text-green-700 hover:border-green-200"
                    href="/accounting/reports/profit-loss"
                >
                    Buka Laporan
                    <ArrowRight class="h-4 w-4" />
                </Button>
            </CardContent>
        </Card>

        <!-- 3. Balance Sheet -->
        <Card class="hover:shadow-lg transition-shadow cursor-pointer group">
            <CardHeader>
                <div
                    class="p-3 bg-purple-50 w-fit rounded-xl mb-4 group-hover:scale-110 transition-transform"
                >
                    <Scale class="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>Neraca (Balance Sheet)</CardTitle>
                <CardDescription>
                    Posisi kekayaan perusahaan (Aset, Kewajiban, Modal) per hari
                    ini.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button
                    variant="outline"
                    class="w-full gap-2 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200"
                    href="/accounting/reports/balance-sheet"
                >
                    Buka Laporan
                    <ArrowRight class="h-4 w-4" />
                </Button>
            </CardContent>
        </Card>
    </div>
</div>
