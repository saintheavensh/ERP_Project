<script lang="ts">
    import { browser } from "$app/environment";
    import {
        Search,
        ShieldCheck,
        Smartphone,
        Package,
        ChevronDown,
    } from "lucide-svelte";
    import { Button } from "$lib/shared/components/ui/button";
    import { authStore } from "$lib/shared/lib/auth-store.svelte";
    import { fade, slide } from "svelte/transition";

    import { goto } from "$app/navigation";
    import { LogOut } from "lucide-svelte";
    let activeTab = $state("track");

    $effect(() => {
        if (browser && authStore.isAuthenticated && !authStore.loading) {
            goto(authStore.getRedirectPath());
        }
    });

    async function handleLogout() {
        await authStore.logout();
    }
</script>

<div class="parallax-container scroll-smooth">
    <!-- Hero Section -->
    <section
        class="relative h-screen flex flex-col items-center justify-center overflow-hidden bg-slate-950"
    >
        <div class="absolute inset-0 z-0">
            <div
                class="absolute inset-0 bg-gradient-to-b from-blue-600/20 via-transparent to-slate-950"
            ></div>
            <div class="stars-container opacity-30"></div>
        </div>

        {#if authStore.isAuthenticated}
            <div
                class="absolute top-8 right-8 z-50 animate-in fade-in slide-in-from-top-4 duration-1000"
            >
                <Button
                    variant="ghost"
                    class="group h-12 px-6 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl hover:bg-red-500/10 hover:border-red-500/20 text-slate-400 hover:text-red-400 font-bold transition-all duration-300"
                    onclick={handleLogout}
                >
                    <LogOut
                        class="mr-2 h-4 w-4 group-hover:scale-110 transition-transform"
                    />
                    SIGN OUT
                </Button>
            </div>
        {/if}

        <div class="z-10 text-center px-4 max-w-4xl mx-auto space-y-6">
            <div
                class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-4"
                transition:fade
            >
                <div
                    class="h-2 w-2 rounded-full bg-blue-500 animate-pulse"
                ></div>
                Next Generation ERP
            </div>
            <h1
                class="text-5xl md:text-8xl font-black text-white tracking-tighter drop-shadow-2xl"
            >
                Service <span
                    class="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500"
                    >Experience</span
                >
            </h1>
            <p
                class="text-xl text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed"
            >
                Seamlessly track your device repairs and protect your
                investments. Premium tools for the modern enterprise.
            </p>

            <div class="flex flex-col sm:flex-row gap-5 justify-center pt-10">
                <Button
                    size="xl"
                    href="#interactive"
                    class="group relative h-16 px-10 rounded-full bg-blue-600 hover:bg-blue-500 text-lg font-bold shadow-[0_0_30px_rgba(37,99,235,0.3)] transition-all duration-300"
                    onclick={() => (activeTab = "track")}
                >
                    <Search
                        class="mr-3 h-6 w-6 group-hover:scale-110 transition-transform"
                    /> Track Ticket
                </Button>
                <Button
                    size="xl"
                    variant="outline"
                    href="#interactive"
                    class="group relative h-16 px-10 rounded-full border-white/20 bg-white/5 backdrop-blur-xl hover:bg-white/10 hover:border-white/40 text-lg font-bold text-white transition-all duration-300"
                    onclick={() => (activeTab = "warranty")}
                >
                    <ShieldCheck
                        class="mr-3 h-6 w-6 group-hover:scale-110 transition-transform text-blue-400"
                    /> Check Warranty
                </Button>
            </div>
        </div>

        <div
            class="absolute bottom-10 animate-bounce cursor-pointer opacity-50 hover:opacity-100 transition-opacity"
        >
            <ChevronDown class="text-slate-500 h-8 w-8" />
        </div>
    </section>

    <!-- Interactive Track/Warranty Section -->
    <section
        id="interactive"
        class="py-32 bg-slate-950 relative overflow-hidden"
    >
        <div
            class="absolute -top-24 -left-24 w-96 h-96 bg-blue-600/10 blur-[120px] rounded-full"
        ></div>
        <div
            class="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-600/10 blur-[120px] rounded-full"
        ></div>

        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div class="flex flex-col items-center text-center space-y-16">
                <!-- Tab Switcher -->
                <div
                    class="inline-flex p-1.5 bg-slate-900/80 backdrop-blur-md border border-white/5 rounded-2xl shadow-2xl"
                >
                    <button
                        class="px-10 py-4 rounded-xl text-sm font-black tracking-widest transition-all duration-300 {activeTab ===
                        'track'
                            ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20'
                            : 'text-slate-500 hover:text-white'}"
                        onclick={() => (activeTab = "track")}
                    >
                        TRACK STATUS
                    </button>
                    <button
                        class="px-10 py-4 rounded-xl text-sm font-black tracking-widest transition-all duration-300 {activeTab ===
                        'warranty'
                            ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20'
                            : 'text-slate-500 hover:text-white'}"
                        onclick={() => (activeTab = "warranty")}
                    >
                        CHECK WARRANTY
                    </button>
                </div>

                <div
                    class="w-full max-w-3xl bg-gradient-to-br from-slate-900/50 to-slate-950/50 backdrop-blur-3xl border border-white/10 p-10 md:p-16 rounded-[3rem] shadow-2xl shadow-black relative group"
                >
                    {#if activeTab === "track"}
                        <div in:fade={{ duration: 400 }} class="space-y-8">
                            <div class="space-y-3">
                                <h3
                                    class="text-4xl font-black text-white tracking-tight"
                                >
                                    Rapid Track
                                </h3>
                                <p class="text-slate-400 text-lg">
                                    Enter your service ticket ID to see live
                                    progress.
                                </p>
                            </div>
                            <div class="relative max-w-xl mx-auto">
                                <input
                                    type="text"
                                    placeholder="TKT-2024-XXXX"
                                    class="w-full h-20 bg-black/40 border border-white/10 rounded-2xl px-8 text-2xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-mono placeholder:text-slate-700"
                                />
                                <Button
                                    class="absolute right-3 top-3 h-14 px-10 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-lg shadow-lg"
                                >
                                    TRACK
                                </Button>
                            </div>
                            <p
                                class="text-xs text-slate-500 pt-4 uppercase tracking-[0.2em]"
                            >
                                Lost your ticket? Contact support for
                                assistance.
                            </p>
                        </div>
                    {:else}
                        <div in:fade={{ duration: 400 }} class="space-y-8">
                            <div class="space-y-3">
                                <h3
                                    class="text-4xl font-black text-white tracking-tight"
                                >
                                    Security Check
                                </h3>
                                <p class="text-slate-400 text-lg">
                                    Verify the authenticity and protection
                                    status of your device.
                                </p>
                            </div>
                            <div class="relative max-w-xl mx-auto">
                                <input
                                    type="text"
                                    placeholder="Serial Number / IMEI"
                                    class="w-full h-20 bg-black/40 border border-white/10 rounded-2xl px-8 text-2xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-mono placeholder:text-slate-700"
                                />
                                <Button
                                    class="absolute right-3 top-3 h-14 px-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-lg shadow-lg"
                                >
                                    VERIFY
                                </Button>
                            </div>
                            <p
                                class="text-xs text-slate-500 pt-4 uppercase tracking-[0.2em]"
                            >
                                Works with all official registered devices.
                            </p>
                        </div>
                    {/if}
                </div>
            </div>
        </div>
    </section>

    <!-- Features Section -->
    <section class="py-24 bg-slate-900">
        <div class="max-w-7xl mx-auto px-4 text-center space-y-16">
            <div class="space-y-4">
                <h2 class="text-4xl font-bold text-white">
                    Why Choose Our Platform
                </h2>
                <p class="text-slate-400 max-w-2xl mx-auto text-lg">
                    Powerful tools built for efficiency and trust.
                </p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div
                    class="p-8 rounded-3xl bg-slate-950/50 border border-white/5 hover:border-blue-500/30 transition-all space-y-4 group"
                >
                    <div
                        class="h-14 w-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 transition-transform"
                    >
                        <Smartphone class="h-7 w-7" />
                    </div>
                    <h3 class="text-xl font-bold text-white">Device History</h3>
                    <p class="text-slate-500">
                        Complete service history linked to your device
                        IMEI/Serial.
                    </p>
                </div>

                <div
                    class="p-8 rounded-3xl bg-slate-950/50 border border-white/5 hover:border-indigo-500/30 transition-all space-y-4 group"
                >
                    <div
                        class="h-14 w-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition-transform"
                    >
                        <ShieldCheck class="h-7 w-7" />
                    </div>
                    <h3 class="text-xl font-bold text-white">Warranty Check</h3>
                    <p class="text-slate-500">
                        Instantly verify your warranty status and expiration
                        dates.
                    </p>
                </div>

                <div
                    class="p-8 rounded-3xl bg-slate-950/50 border border-white/5 hover:border-purple-500/30 transition-all space-y-4 group"
                >
                    <div
                        class="h-14 w-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform"
                    >
                        <Package class="h-7 w-7" />
                    </div>
                    <h3 class="text-xl font-bold text-white">
                        Stock Availability
                    </h3>
                    <p class="text-slate-500">
                        Check if parts are in stock for your specific device
                        model.
                    </p>
                </div>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="py-12 bg-black border-t border-white/5">
        <div
            class="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8"
        >
            <div class="flex items-center gap-3">
                <div
                    class="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold"
                >
                    I
                </div>
                <span class="font-bold text-xl text-white">Inventory App</span>
            </div>

            <div class="text-slate-500 text-sm">
                &copy; 2026 Inventory App. All rights reserved.
            </div>

            <div class="flex gap-6 text-sm font-medium text-slate-400">
                <a href="#track" class="hover:text-white transition-colors"
                    >Tracking</a
                >
                <a href="#warranty" class="hover:text-white transition-colors"
                    >Warranty</a
                >
            </div>
        </div>
    </footer>
</div>

<style>
    :global(html) {
        scroll-behavior: smooth;
    }

    .parallax-container {
        height: 100vh;
        overflow-y: auto;
        overflow-x: hidden;
        perspective: 10px;
    }

    section {
        position: relative;
        transform-style: preserve-3d;
        z-index: -1;
    }

    .stars-container {
        position: absolute;
        width: 100%;
        height: 100%;
        background-image: radial-gradient(
                2px 2px at 20px 30px,
                #eee,
                rgba(0, 0, 0, 0)
            ),
            radial-gradient(2px 2px at 40px 70px, #fff, rgba(0, 0, 0, 0)),
            radial-gradient(2px 2px at 50px 160px, #ddd, rgba(0, 0, 0, 0)),
            radial-gradient(2px 2px at 90px 40px, #fff, rgba(0, 0, 0, 0)),
            radial-gradient(2px 2px at 130px 80px, #fff, rgba(0, 0, 0, 0)),
            radial-gradient(2px 2px at 160px 120px, #ddd, rgba(0, 0, 0, 0));
        background-repeat: repeat;
        background-size: 200px 200px;
    }
</style>
