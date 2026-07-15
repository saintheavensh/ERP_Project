<script lang="ts">
    import { Button } from "$lib/shared/components/ui/button";
    import {
        Card,
        CardContent,
        CardDescription,
        CardFooter,
        CardHeader,
        CardTitle,
    } from "$lib/shared/components/ui/card";
    import { Input } from "$lib/shared/components/ui/input";
    import { Label } from "$lib/shared/components/ui/label";
    import { toast } from "$lib/shared/components/ui/sonner";
    import {
        Package,
        Lock,
        User,
        ArrowRight,
        ShieldCheck,
    } from "lucide-svelte";
    import { fade, fly } from "svelte/transition";

    import { api } from "$lib/shared/lib/api-client";

    let username = $state("");
    let password = $state("");
    let isLoading = $state(false);

    async function handleLogin() {
        if (!username || !password) {
            toast.error("Validasi Gagal", {
                description: "Username dan Password harus diisi",
            });
            return;
        }

        isLoading = true;
        try {
            const res = await api("/auth/login", {
                method: "POST",
                data: { username, password },
            });

            const user = res.data.data?.user || res.data.user;

            if (!user) {
                throw new Error("Invalid response format from server");
            }

            const { authStore } = await import("$lib/shared/lib/auth-store.svelte");
            authStore.setUserInfo(user);

            toast.success("Login Berhasil", {
                description: `Selamat datang, ${user.name}`,
            });

            window.location.href = authStore.getRedirectPath();
        } catch (err: any) {
            const msg =
                err.response?.data?.message ||
                "Login gagal. Cek username/password.";
            toast.error("Gagal Masuk", { description: msg });
        } finally {
            isLoading = false;
        }
    }
</script>

<div
    class="relative min-h-screen w-full flex items-center justify-center p-4 bg-slate-950 overflow-hidden"
>
    <!-- Ambient Background Glows -->
    <div
        class="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full"
    ></div>
    <div
        class="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full"
    ></div>
    <div
        class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.05)_0%,transparent_70%)]"
    ></div>

    <div class="z-10 w-full max-w-md space-y-8" in:fade={{ duration: 800 }}>
        <!-- Logo & Header -->
        <div
            class="flex flex-col items-center justify-center space-y-4 text-center"
        >
            <div
                class="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-2xl shadow-blue-500/20"
                in:fly={{ y: -20, duration: 800, delay: 200 }}
            >
                <Package class="h-10 w-10" />
            </div>
            <div
                class="space-y-2"
                in:fly={{ y: 20, duration: 800, delay: 400 }}
            >
                <h1 class="text-4xl font-white tracking-tighter text-white">
                    Console Access
                </h1>
                <p class="text-slate-400 font-medium">
                    Securely sign in to your operations dashboard
                </p>
            </div>
        </div>

        <!-- Login Card Container with transition -->
        <div in:fly={{ y: 30, duration: 800, delay: 600 }}>
            <Card
                class="bg-slate-900/40 backdrop-blur-2xl border-white/10 shadow-2xl overflow-hidden rounded-[2rem]"
            >
                <CardHeader class="pb-2">
                    <CardTitle
                        class="text-xl font-bold flex items-center gap-2"
                    >
                        <ShieldCheck class="h-5 w-5 text-blue-400" /> Authorized
                        Entry
                    </CardTitle>
                    <CardDescription class="text-slate-500"
                        >Enter your credentials to continue</CardDescription
                    >
                </CardHeader>
                <CardContent class="space-y-6 pt-4">
                    <div class="space-y-3">
                        <Label
                            for="username"
                            class="text-slate-300 font-semibold ml-1"
                            >Username</Label
                        >
                        <div class="relative group">
                            <User
                                class="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-blue-500 transition-colors"
                            />
                            <Input
                                id="username"
                                placeholder="admin"
                                class="h-14 pl-12 bg-black/40 border-white/5 rounded-xl text-lg text-white placeholder:text-slate-700 focus:ring-2 focus:ring-blue-500/50 transition-all"
                                bind:value={username}
                            />
                        </div>
                    </div>
                    <div class="space-y-3">
                        <div class="flex items-center justify-between ml-1">
                            <Label
                                for="password"
                                class="text-slate-300 font-semibold"
                                >Password</Label
                            >
                            <button
                                type="button"
                                class="text-xs font-bold text-blue-500 hover:text-blue-400 transition-colors bg-transparent border-none p-0 cursor-pointer"
                                >Recovery Key?</button
                            >
                        </div>
                        <div class="relative group">
                            <Lock
                                class="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-blue-500 transition-colors"
                            />
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                class="h-14 pl-12 bg-black/40 border-white/5 rounded-xl text-lg text-white placeholder:text-slate-700 focus:ring-2 focus:ring-blue-500/50 transition-all font-mono"
                                bind:value={password}
                                onkeydown={(e) =>
                                    e.key === "Enter" && handleLogin()}
                            />
                        </div>
                    </div>
                </CardContent>
                <CardFooter class="pt-2 pb-8 flex flex-col gap-4">
                    <Button
                        class="group w-full h-16 rounded-xl bg-blue-600 hover:bg-blue-500 text-lg font-bold shadow-xl shadow-blue-600/20 active:scale-[0.98] transition-all"
                        onclick={handleLogin}
                        disabled={isLoading}
                    >
                        {#if isLoading}
                            <div
                                class="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white mr-2"
                            ></div>
                            Authenticating...
                        {:else}
                            Open Console <ArrowRight
                                class="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform"
                            />
                        {/if}
                    </Button>
                    <div
                        class="flex items-center gap-2 text-[10px] text-slate-600 font-black uppercase tracking-[0.2em] justify-center mt-2"
                    >
                        <div class="h-[1px] w-8 bg-slate-800"></div>
                        Secured by Enterprise Shield
                        <div class="h-[1px] w-8 bg-slate-800"></div>
                    </div>
                </CardFooter>
            </Card>
        </div>

        <!-- Dynamic Branding -->
        <div class="text-center" in:fade={{ delay: 1000 }}>
            <p
                class="text-[10px] text-slate-700 font-bold uppercase tracking-[0.3em]"
            >
                &copy; 2026 Inventory Architecture • v2.4.0
            </p>
        </div>
    </div>
</div>

<style>
    /* Custom input override for better dark mode aesthetics */
    :global(input:focus) {
        background-color: rgba(0, 0, 0, 0.6) !important;
    }
</style>
