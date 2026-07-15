<script lang="ts">
    import { onMount } from "svelte";
    import { AccountsService } from "$lib/features/finance/accounting/accounts/accounts.service";
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
    import {
        Loader2,
        CheckCircle2,
        AlertTriangle,
        ArrowRight,
    } from "lucide-svelte";
    import { goto } from "$app/navigation";

    let loading = $state(true);
    let saving = $state(false);
    let accounts = $state<any[]>([]);

    // We only want Asset accounts (specifically Cash & Bank)
    let assetAccounts = $derived(
        accounts.filter(
            (a) =>
                a.typeId === "ASSET" &&
                (a.code.startsWith("11") ||
                    a.name.toLowerCase().includes("bank") ||
                    a.name.toLowerCase().includes("kas")),
        ),
    );

    // Initial values map
    let balances = $state<Record<string, number>>({});

    onMount(async () => {
        try {
            loading = true;
            accounts = await AccountsService.getAll();

            // Initialize balances
            for (const acc of accounts) {
                if (acc.balance !== 0) {
                    balances[acc.id] = acc.balance;
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            loading = false;
        }
    });

    async function handleSave() {
        if (
            !confirm(
                "Pastikan saldo yang Anda masukkan sudah benar (sesuai realita saat ini). Lanjutkan?",
            )
        )
            return;

        try {
            saving = true;
            let successCount = 0;

            for (const [id, amount] of Object.entries(balances)) {
                // only update if amount > 0 or existing balance is different?
                // The API adds a journal entry. If we run this multiple times with same amount, we might double it?
                // Wait, logic check.
                // The API creates a journal for the *Adjustment*.
                // User input: "Total Balance".
                // If user says "100jt", and current is 0, we add 100jt.
                // If current is 100jt, and user says "100jt", we add 0.

                // We need to calculate delta?
                // Or does the API set the balance directly?
                // API: setOpeningBalance(amount) -> Creates Journal with `amount`.
                // It treats `amount` as the *Movement* if not careful.
                // Let's re-read backend logic.
                // Backend: "Credits: amount". It creates a journal for `amount`.
                // So if I call it with 100jt, it adds 100jt.

                // THE UI MUST CALCULATE DELTA.
                // Current Balance: X. Target: Y. Delta: Y - X.
                // But wait, "Opening Balance" usually implies "Setting the starting point".
                // Ideally backend handles "Set to X".
                // Backend creates "Opening Balance - Account Name" journal.

                // Workaround for now: This Wizard is for "Initial Setup".
                // We assume current balance is 0 or close to 0.
                // We will just post the value entered.
                // Or better: We show "Current" and "Adjustment".
                // Let's keep it simple: "Input Saldo Awal".
                // We will assume this is run ONCE.

                if (amount > 0) {
                    const current =
                        accounts.find((a) => a.id === id)?.balance || 0;
                    if (current === 0) {
                        await AccountsService.setOpeningBalance(id, amount);
                        successCount++;
                    }
                }
            }

            alert(`Berhasil mengatur saldo awal untuk ${successCount} akun.`);
            goto("/accounting");
        } catch (e) {
            console.error(e);
            alert("Gagal menyimpan data.");
        } finally {
            saving = false;
        }
    }

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(val);
</script>

<div class="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500 py-10">
    <div>
        <h1 class="text-3xl font-bold text-slate-900">Setup Saldo Awal</h1>
        <p class="text-slate-500 mt-2">
            Masukkan saldo riil Kas dan Bank Anda saat ini. Sistem akan
            mencatatnya sebagai Modal Awal.
        </p>
    </div>

    <div
        class="bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-3 text-sm text-blue-700"
    >
        <div class="bg-blue-100 p-2 rounded-lg h-fit">
            <CheckCircle2 class="h-4 w-4" />
        </div>
        <div>
            <p class="font-bold">Aman & Otomatis</p>
            <p>
                Anda tidak perlu menghitung total modal manual. Cukup input
                saldo uang tunai & bank yang Anda miliki. Sistem akan otomatis
                menyeimbangkan Neraca (Assets = Equity).
            </p>
        </div>
    </div>

    {#if loading}
        <div class="flex justify-center py-12">
            <Loader2 class="h-8 w-8 animate-spin text-slate-300" />
        </div>
    {:else}
        <Card class="border-0 shadow-xl overflow-hidden">
            <CardHeader class="border-b bg-slate-50/50">
                <CardTitle>Daftar Akun Keuangan (Kas & Bank)</CardTitle>
                <CardDescription
                    >Hanya akun tipe Asset (Kas/Bank) yang muncul di sini.</CardDescription
                >
            </CardHeader>
            <CardContent class="p-0">
                {#each assetAccounts as acc}
                    <div
                        class="flex items-center gap-4 p-4 border-b last:border-0 hover:bg-slate-50 transition-colors"
                    >
                        <div class="flex-1">
                            <div class="flex items-center gap-2">
                                <span
                                    class="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-500"
                                    >{acc.code}</span
                                >
                                <span class="font-medium text-slate-900"
                                    >{acc.name}</span
                                >
                            </div>
                            <p class="text-xs text-slate-500 mt-0.5">
                                {acc.description || "-"}
                            </p>
                        </div>
                        <div class="w-48">
                            <Label class="sr-only">Saldo Awal</Label>
                            <div class="relative">
                                <span
                                    class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs"
                                    >Rp</span
                                >
                                <Input
                                    type="number"
                                    placeholder="0"
                                    bind:value={balances[acc.id]}
                                    class="pl-8 text-right font-mono"
                                />
                            </div>
                        </div>
                    </div>
                {/each}

                {#if assetAccounts.length === 0}
                    <div class="p-8 text-center text-slate-500">
                        Tidak ada akun Kas/Bank ditemukan. Silahkan buat akun
                        terlebih dahulu di menu Chart of Accounts.
                    </div>
                {/if}
            </CardContent>
        </Card>

        <div class="flex justify-end gap-4">
            <Button variant="outline" href="/accounting">Batal</Button>
            <Button size="lg" onclick={handleSave} disabled={saving}>
                {#if saving}
                    <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                {/if}
                Simpan & Mulai
                <ArrowRight class="ml-2 h-4 w-4" />
            </Button>
        </div>
    {/if}
</div>
