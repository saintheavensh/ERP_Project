<script lang="ts">
    import { Button } from "$lib/shared/components/ui/button";
    import { Badge } from "$lib/shared/components/ui/badge";
    import { Separator } from "$lib/shared/components/ui/separator";
    import {
        Select,
        SelectContent,
        SelectItem,
        SelectTrigger,
    } from "$lib/shared/components/ui/select";
    import {
        ChevronLeft,
        ChevronRight,
        Calendar as CalendarIcon,
        List,
        Filter,
        GripVertical,
        Search,
        Clock,
        AlertCircle,
        CheckCircle2,
        User,
    } from "lucide-svelte";
    import { Input } from "$lib/shared/components/ui/input";
    import {
        createQuery,
        createMutation,
        useQueryClient,
    } from "@tanstack/svelte-query";
    import { ServiceService } from "$lib/features/services/services/service.service";
    import { toast } from "svelte-sonner";
    import { cn } from "$lib/shared/lib/utils";

    // Types
    interface CalendarService {
        id: number;
        no: string;
        customer: { name: string; phone: string };
        device: { brand: string; model: string };
        status: string;
        technicianId: string | null;
        technicianName?: string;
        estimatedCompletionDate: string | null;
        dateIn: string;
    }

    // State
    let viewMode = $state<"week" | "month">("week");
    let currentDate = $state(new Date());
    let selectedTechnician = $state<string>("all");
    let selectedStatus = $state<string>("all");
    let backlogSearch = $state("");
    let draggedService = $state<CalendarService | null>(null);

    const queryClient = useQueryClient();

    // User Role
    let userRole = $state<string>("admin");
    let userId = $state<string>("");

    $effect(() => {
        if (typeof window !== "undefined") {
            const user = JSON.parse(localStorage.getItem("user") || "{}");
            userRole = user.role || "admin";
            userId = user.id || "";
        }
    });

    // Fetch services
    const servicesQuery = createQuery(() => ({
        queryKey: ["services", "calendar"],
        queryFn: () => ServiceService.getAll(),
    }));

    // Reschedule mutation
    const rescheduleMutation = createMutation(() => ({
        mutationFn: async ({ id, date }: { id: number; date: Date }) => {
            return await ServiceService.update(id, {
                estimatedCompletionDate: date.toISOString(),
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["services"] });
            toast.success("Jadwal service diperbarui");
        },
        onError: () => {
            toast.error("Gagal memperbarui jadwal");
        },
    }));

    // Filter Logic
    let filteredServices = $derived(() => {
        let services = (servicesQuery.data ||
            []) as unknown as CalendarService[];

        if (userRole === "teknisi" && userId) {
            services = services.filter((s) => s.technicianId === userId);
        }

        if (selectedTechnician !== "all") {
            services = services.filter(
                (s) => s.technicianId === selectedTechnician,
            );
        }

        if (selectedStatus !== "all") {
            services = services.filter((s) => s.status === selectedStatus);
        } else {
            services = services.filter(
                (s) =>
                    ![
                        "selesai",
                        "diambil",
                        "batal",
                        "antrian",
                        "konfirmasi",
                    ].includes(s.status),
            );
        }
        return services;
    });

    let scheduledServices = $derived(
        filteredServices().filter((s) => s.estimatedCompletionDate),
    );

    let backlogServices = $derived(
        filteredServices()
            .filter((s) => !s.estimatedCompletionDate)
            .filter(
                (s) =>
                    backlogSearch === "" ||
                    s.customer.name
                        .toLowerCase()
                        .includes(backlogSearch.toLowerCase()) ||
                    s.device.model
                        .toLowerCase()
                        .includes(backlogSearch.toLowerCase()) ||
                    s.no.toLowerCase().includes(backlogSearch.toLowerCase()),
            ),
    );

    let technicians = $derived(() => {
        const services = (servicesQuery.data ||
            []) as unknown as CalendarService[];
        const techMap = new Map<string, string>();
        services.forEach((s) => {
            if (s.technicianId && s.technicianName) {
                techMap.set(s.technicianId, s.technicianName);
            }
        });
        return Array.from(techMap.entries()).map(([id, name]) => ({
            id,
            name,
        }));
    });

    // Calendar Calculations
    function getWeekDays(date: Date): Date[] {
        const start = new Date(date);
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Monday
        start.setDate(diff);
        const days: Date[] = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            days.push(d);
        }
        return days;
    }

    function getMonthDays(date: Date): Date[] {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const days: Date[] = [];

        const startDay = firstDay.getDay() || 7;
        for (let i = startDay - 1; i > 0; i--) {
            const d = new Date(firstDay);
            d.setDate(d.getDate() - i);
            days.push(d);
        }
        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push(new Date(year, month, i));
        }
        const remaining = 42 - days.length;
        for (let i = 1; i <= remaining; i++) {
            const d = new Date(lastDay);
            d.setDate(d.getDate() + i);
            days.push(d);
        }
        return days;
    }

    let calendarDays = $derived(
        viewMode === "week"
            ? getWeekDays(currentDate)
            : getMonthDays(currentDate),
    );

    function getServicesForDate(date: Date): CalendarService[] {
        return scheduledServices.filter((s) => {
            if (!s.estimatedCompletionDate) return false;
            const sDate = new Date(s.estimatedCompletionDate);
            return sDate.toDateString() === date.toDateString();
        });
    }

    function formatMonth(date: Date): string {
        return date.toLocaleDateString("id-ID", {
            month: "long",
            year: "numeric",
        });
    }

    function isToday(date: Date): boolean {
        return date.toDateString() === new Date().toDateString();
    }

    function isPastDate(date: Date): boolean {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);
        return checkDate < today;
    }

    function isCurrentMonth(date: Date): boolean {
        return date.getMonth() === currentDate.getMonth();
    }

    function navigate(direction: number) {
        const newDate = new Date(currentDate);
        if (viewMode === "week") {
            newDate.setDate(newDate.getDate() + direction * 7);
        } else {
            newDate.setMonth(newDate.getMonth() + direction);
        }
        currentDate = newDate;
    }

    // Drag & Drop
    function handleDragStart(e: DragEvent, service: CalendarService) {
        draggedService = service;
        if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", String(service.id));
            // Create a custom drag ghost if needed, or rely on browser default
        }
    }

    function handleDragEnd() {
        draggedService = null;
    }

    function handleDragOver(e: DragEvent) {
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
    }

    function handleDrop(e: DragEvent, date: Date) {
        e.preventDefault();
        if (draggedService) {
            if (isPastDate(date)) {
                toast.error("Tidak dapat menjadwalkan ke tanggal lampau");
                draggedService = null;
                return;
            }
            if (!draggedService.technicianId && userRole !== "teknisi") {
                // For admins, maybe assign self or warn? Let's just warn.
                // Actually, if dragged, it means we are scheduling.
                // Allow scheduling without tech? The original code blocked it.
                // Let's block it for consistency.
                if (!draggedService.technicianId) {
                    toast.error("Tugaskan teknisi terlebih dahulu!");
                    draggedService = null;
                    return;
                }
            }

            rescheduleMutation.mutate({ id: draggedService.id, date });
            draggedService = null;
        }
    }

    // UI Helpers
    function getStatusColor(status: string): string {
        const colors: Record<string, string> = {
            antrian: "bg-slate-100 text-slate-600 border-slate-200",
            dicek: "bg-blue-50 text-blue-600 border-blue-200",
            konfirmasi: "bg-amber-50 text-amber-600 border-amber-200",
            dikerjakan: "bg-violet-50 text-violet-600 border-violet-200",
            selesai: "bg-green-50 text-green-600 border-green-200",
            diambil: "bg-emerald-50 text-emerald-600 border-emerald-200",
            batal: "bg-red-50 text-red-600 border-red-200",
        };
        return colors[status] || "bg-slate-50 text-slate-600 border-slate-200";
    }

    function getStatusLabel(status: string) {
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
</script>

<div class="h-full flex flex-col gap-6 animate-in fade-in duration-500">
    <!-- Header -->
    <div
        class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md p-4 rounded-3xl border border-white/20 shadow-sm"
    >
        <div class="flex items-center gap-4">
            <div
                class="p-3 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl text-white shadow-lg shadow-indigo-500/20"
            >
                <CalendarIcon class="h-6 w-6" />
            </div>
            <div>
                <h1
                    class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400"
                >
                    Agenda Service
                </h1>
                <p class="text-xs text-muted-foreground font-medium">
                    Jadwal pengerjaan & teknisi
                </p>
            </div>
        </div>

        <div class="flex items-center gap-3">
            <div
                class="flex items-center bg-white/50 dark:bg-slate-800/50 rounded-xl p-1 shadow-sm border border-white/20"
            >
                <Button
                    variant="ghost"
                    size="icon"
                    class="h-8 w-8 hover:bg-white dark:hover:bg-slate-700 rounded-lg"
                    onclick={() => navigate(-1)}
                >
                    <ChevronLeft class="h-4 w-4" />
                </Button>
                <span class="px-4 text-sm font-bold min-w-[140px] text-center"
                    >{formatMonth(currentDate)}</span
                >
                <Button
                    variant="ghost"
                    size="icon"
                    class="h-8 w-8 hover:bg-white dark:hover:bg-slate-700 rounded-lg"
                    onclick={() => navigate(1)}
                >
                    <ChevronRight class="h-4 w-4" />
                </Button>
            </div>

            <div class="h-8 w-px bg-border/50"></div>

            <div
                class="flex items-center p-1 bg-white/50 dark:bg-slate-800/50 rounded-xl border border-white/20"
            >
                <button
                    class={cn(
                        "px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                        viewMode === "week"
                            ? "bg-white dark:bg-slate-700 shadow-sm text-indigo-600"
                            : "text-muted-foreground hover:bg-white/50",
                    )}
                    onclick={() => (viewMode = "week")}
                >
                    Minggu
                </button>
                <button
                    class={cn(
                        "px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                        viewMode === "month"
                            ? "bg-white dark:bg-slate-700 shadow-sm text-indigo-600"
                            : "text-muted-foreground hover:bg-white/50",
                    )}
                    onclick={() => (viewMode = "month")}
                >
                    Bulan
                </button>
            </div>

            <Button
                variant="outline"
                size="sm"
                class="hidden md:flex bg-white/50"
                onclick={() => (currentDate = new Date())}
            >
                Hari Ini
            </Button>
        </div>
    </div>

    <div
        class="flex flex-col lg:flex-row gap-6 h-[calc(100vh-220px)] overflow-hidden"
    >
        <!-- Backlog Sidebar -->
        <div
            class="w-full lg:w-80 flex flex-col gap-4 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-white/20 rounded-3xl p-4 shadow-sm shrink-0 h-full"
        >
            <div
                class="flex items-center justify-between pb-2 border-b border-white/10"
            >
                <div class="flex items-center gap-2">
                    <Clock class="h-4 w-4 text-indigo-500" />
                    <h3 class="font-bold text-sm text-foreground">
                        Pending Schedule
                    </h3>
                </div>
                <Badge variant="secondary" class="bg-white/50"
                    >{backlogServices.length}</Badge
                >
            </div>

            <!-- Filters -->
            <div class="space-y-3">
                <div class="relative group">
                    <Search
                        class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-indigo-500 transition-colors"
                    />
                    <Input
                        placeholder="Cari ticket..."
                        bind:value={backlogSearch}
                        class="pl-9 h-9 bg-white/50 border-white/20 focus:bg-white transition-all rounded-xl"
                    />
                </div>
                {#if userRole === "admin"}
                    <Select type="single" bind:value={selectedTechnician}>
                        <SelectTrigger
                            class="h-9 bg-white/50 border-white/20 rounded-xl text-xs"
                        >
                            <span class="truncate"
                                >{selectedTechnician === "all"
                                    ? "Semua Teknisi"
                                    : technicians().find(
                                          (t) => t.id === selectedTechnician,
                                      )?.name}</span
                            >
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Teknisi</SelectItem>
                            {#each technicians() as tech}
                                <SelectItem value={tech.id}
                                    >{tech.name}</SelectItem
                                >
                            {/each}
                        </SelectContent>
                    </Select>
                {/if}
            </div>

            <div class="flex-1 overflow-y-auto pr-1 space-y-2.5">
                {#each backlogServices as service}
                    <div
                        role="button"
                        tabindex="0"
                        draggable="true"
                        ondragstart={(e) => handleDragStart(e, service)}
                        ondragend={handleDragEnd}
                        class={cn(
                            "group relative p-3 rounded-2xl border bg-white/60 dark:bg-slate-800/60 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing",
                            !service.technicianId
                                ? "border-dashed border-amber-300/50 bg-amber-50/30"
                                : "border-white/40 hover:border-indigo-300/50",
                        )}
                    >
                        <div class="flex items-start gap-3">
                            <div
                                class="mt-1 cursor-grab active:cursor-grabbing text-muted-foreground/50 group-hover:text-indigo-400"
                            >
                                <GripVertical class="h-4 w-4" />
                            </div>
                            <div class="flex-1 min-w-0 space-y-1">
                                <div class="flex justify-between items-start">
                                    <span
                                        class="text-xs font-bold text-foreground"
                                        >{service.no}</span
                                    >
                                    <Badge
                                        variant="outline"
                                        class={cn(
                                            "text-[10px] px-1.5 py-0 h-auto border",
                                            getStatusColor(service.status),
                                        )}
                                    >
                                        {getStatusLabel(service.status)}
                                    </Badge>
                                </div>
                                <p class="text-sm font-medium truncate">
                                    {service.device.model}
                                </p>
                                <div
                                    class="flex items-center gap-1.5 text-xs text-muted-foreground"
                                >
                                    <User class="h-3 w-3" />
                                    <span class="truncate"
                                        >{service.customer.name}</span
                                    >
                                </div>

                                {#if !service.technicianId}
                                    <div
                                        class="mt-2 flex items-center gap-1.5 text-[10px] text-amber-600 bg-amber-100/50 px-2 py-1 rounded-lg w-fit"
                                    >
                                        <AlertCircle class="h-3 w-3" />
                                        <span>Belum ada teknisi</span>
                                    </div>
                                {:else}
                                    <div
                                        class="mt-2 flex items-center gap-1.5 text-[10px] text-indigo-600 bg-indigo-50/50 px-2 py-1 rounded-lg w-fit"
                                    >
                                        <div
                                            class="w-3 h-3 rounded-full bg-indigo-200 flex items-center justify-center text-[8px] font-bold"
                                        >
                                            {service.technicianName?.charAt(0)}
                                        </div>
                                        <span>{service.technicianName}</span>
                                    </div>
                                {/if}
                            </div>
                        </div>
                    </div>
                {/each}
                {#if backlogServices.length === 0}
                    <div
                        class="flex flex-col items-center justify-center h-32 text-muted-foreground text-xs text-center p-4 border-2 border-dashed border-white/20 rounded-2xl"
                    >
                        <CheckCircle2 class="h-8 w-8 mb-2 opacity-50" />
                        <p>Semua service sudah dijadwalkan</p>
                    </div>
                {/if}
            </div>
        </div>

        <!-- Main Calendar -->
        <div
            class="flex-1 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-white/20 rounded-3xl shadow-sm flex flex-col overflow-hidden h-full"
        >
            <div
                class={cn(
                    "grid border-b border-white/10 bg-white/20 font-bold text-xs text-muted-foreground",
                    viewMode === "week" ? "grid-cols-7" : "grid-cols-7",
                )}
            >
                {#each ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"] as day}
                    <div class="py-3 text-center uppercase tracking-wider">
                        {day}
                    </div>
                {/each}
            </div>

            <div
                class={cn(
                    "flex-1 grid overflow-y-auto",
                    viewMode === "week"
                        ? "grid-cols-7"
                        : "grid-cols-7 grid-rows-6",
                )}
            >
                {#each calendarDays as day}
                    {@const isTod = isToday(day)}
                    {@const isPast = isPastDate(day)}
                    <div
                        role="gridcell"
                        tabindex="0"
                        ondragover={!isPast ? handleDragOver : undefined}
                        ondrop={!isPast ? (e) => handleDrop(e, day) : undefined}
                        class={cn(
                            "min-h-[120px] p-2 border-b border-r border-white/10 transition-all relative group/cell",
                            !isCurrentMonth(day) &&
                                viewMode === "month" &&
                                "bg-slate-50/30 dark:bg-slate-900/30 text-muted-foreground",
                            isPast && "bg-slate-100/30 dark:bg-black/20",
                            isTod && "bg-indigo-50/20",
                            draggedService &&
                                !isPast &&
                                "hover:bg-indigo-50/40 hover:shadow-inner",
                        )}
                    >
                        <!-- Date Number -->
                        <div class="flex justify-between items-start mb-2">
                            <div
                                class={cn(
                                    "flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold transition-colors",
                                    isTod
                                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30"
                                        : "text-foreground/70",
                                    !isCurrentMonth(day) && "opacity-50",
                                )}
                            >
                                {day.getDate()}
                            </div>
                        </div>

                        <!-- Drop Zone Indicator -->
                        {#if draggedService && !isPast}
                            <div
                                class="absolute inset-0 bg-indigo-500/5 border-2 border-indigo-500/20 rounded-xl m-1 opacity-0 group-hover/cell:opacity-100 pointer-events-none flex items-center justify-center"
                            >
                                <span
                                    class="text-xs font-bold text-indigo-600 bg-white/80 px-2 py-1 rounded-full shadow-sm"
                                    >Pindah ke sini</span
                                >
                            </div>
                        {/if}

                        <!-- Events Stack -->
                        <div class="space-y-1.5 relative z-10">
                            {#each getServicesForDate(day) as service}
                                <a
                                    href={`/service/${service.id}`}
                                    draggable="true"
                                    ondragstart={(e) =>
                                        handleDragStart(e, service)}
                                    ondragend={handleDragEnd}
                                    class={cn(
                                        "block text-[10px] p-1.5 rounded-lg border shadow-sm transition-all hover:scale-105 active:scale-95 cursor-grab active:cursor-grabbing group/event",
                                        getStatusColor(service.status),
                                        "bg-opacity-90 backdrop-blur-sm",
                                    )}
                                >
                                    <div
                                        class="font-bold truncate group-hover/event:underline decoration-current underline-offset-2"
                                    >
                                        {service.no}
                                    </div>
                                    <div
                                        class="truncate opacity-80 font-medium"
                                    >
                                        {service.device.model}
                                    </div>
                                </a>
                            {/each}
                        </div>
                    </div>
                {/each}
            </div>
        </div>
    </div>
</div>

<style>
    /* Custom Scrollbar for nice feel */
    ::-webkit-scrollbar {
        width: 6px;
        height: 6px;
    }
    ::-webkit-scrollbar-track {
        background: transparent;
    }
    ::-webkit-scrollbar-thumb {
        background: rgba(156, 163, 175, 0.3);
        border-radius: 10px;
    }
    ::-webkit-scrollbar-thumb:hover {
        background: rgba(156, 163, 175, 0.5);
    }
</style>
