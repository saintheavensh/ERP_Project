<script lang="ts">
    import { Button } from "$lib/shared/components/ui/button";
    import * as Popover from "$lib/shared/components/ui/popover";
    import { cn } from "$lib/shared/lib/utils";
    import {
        Calendar as CalendarIcon,
        ChevronLeft,
        ChevronRight,
        Check,
    } from "lucide-svelte";
    import { onMount } from "svelte";

    let { value = $bindable(new Date().toISOString()), showTime = true } =
        $props<{
            value: string;
            showTime?: boolean;
        }>();

    let date = $state(value ? new Date(value) : new Date());
    let isOpen = $state(false);

    // Calendar View State
    // Default to current date initially to avoid dependency warning
    let viewDate = $state(new Date());

    // Sync viewDate with selected date when popover opens
    $effect(() => {
        if (isOpen) {
            viewDate = new Date(date);
        }
    });

    // Time Generation (15 min intervals)
    const times = $derived.by(() => {
        const arr = [];
        for (let i = 0; i < 24; i++) {
            for (let j = 0; j < 60; j += 15) {
                const hour = i.toString().padStart(2, "0");
                const minute = j.toString().padStart(2, "0");
                arr.push(`${hour}:${minute}`);
            }
        }
        return arr;
    });

    // Calendar Logic
    const months = [
        "Januari",
        "Februari",
        "Maret",
        "April",
        "Mei",
        "Juni",
        "Juli",
        "Agustus",
        "September",
        "Oktober",
        "November",
        "Desember",
    ];

    let currentMonthName = $derived(months[viewDate.getMonth()]);
    let currentYear = $derived(viewDate.getFullYear());

    let calendarDays = $derived.by(() => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const days = [];
        const startPadding = firstDay.getDay(); // 0 = Sunday

        // Padding
        for (let i = 0; i < startPadding; i++) {
            days.push(null);
        }

        // Days
        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push(new Date(year, month, i));
        }

        return days;
    });

    function selectDate(d: Date) {
        // Keep valid time from current selections
        const newDate = new Date(d);
        newDate.setHours(date.getHours());
        newDate.setMinutes(date.getMinutes());
        date = newDate;
        updateValue();
        if (!showTime) {
            isOpen = false;
        }
    }

    function selectTime(timeStr: string) {
        const [h, m] = timeStr.split(":").map(Number);
        const newDate = new Date(date);
        newDate.setHours(h);
        newDate.setMinutes(m);
        date = newDate;
        updateValue();
    }

    function updateValue() {
        // Format to local ISO string (YYYY-MM-DDTHH:mm)
        // Manual formatting to avoid UTC conversion issues
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        if (showTime) {
            const hours = String(date.getHours()).padStart(2, "0");
            const minutes = String(date.getMinutes()).padStart(2, "0");
            value = `${year}-${month}-${day}T${hours}:${minutes}`;
        } else {
            value = `${year}-${month}-${day}`;
        }
    }

    function prevMonth() {
        viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
    }

    function nextMonth() {
        viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
    }

    function isSameDay(d1: Date, d2: Date) {
        return (
            d1.getDate() === d2.getDate() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getFullYear() === d2.getFullYear()
        );
    }

    let formattedDisplay = $derived(
        date.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: showTime ? "2-digit" : undefined,
            minute: showTime ? "2-digit" : undefined,
        }),
    );

    let currentTimeString = $derived(
        `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`,
    );
</script>

<Popover.Root bind:open={isOpen}>
    <Popover.Trigger
        class={cn(
            "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            !value && "text-muted-foreground",
        )}
    >
        {formattedDisplay}
        <CalendarIcon class="ml-2 h-4 w-4 opacity-50" />
    </Popover.Trigger>
    <Popover.Content class="w-auto p-0" align="start">
        <div class="flex" class:h-[300px]={showTime}>
            <!-- Calendar Section -->
            <div class="p-4 border-r w-[280px]">
                <div class="flex items-center justify-between mb-4">
                    <div class="text-sm font-medium">
                        {currentMonthName}
                        {currentYear}
                    </div>
                    <div class="flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="icon"
                            class="h-7 w-7"
                            onclick={prevMonth}
                        >
                            <ChevronLeft class="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            class="h-7 w-7"
                            onclick={nextMonth}
                        >
                            <ChevronRight class="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div
                    class="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-2"
                >
                    <div>Su</div>
                    <div>Mo</div>
                    <div>Tu</div>
                    <div>We</div>
                    <div>Th</div>
                    <div>Fr</div>
                    <div>Sa</div>
                </div>

                <div class="grid grid-cols-7 gap-1">
                    {#each calendarDays as d}
                        {#if d}
                            <button
                                class={cn(
                                    "h-8 w-8 rounded-md text-sm p-0 font-normal focus:outline-none",
                                    isSameDay(d, date)
                                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                        : "hover:bg-accent hover:text-accent-foreground",
                                    isSameDay(d, new Date()) &&
                                        !isSameDay(d, date) &&
                                        "bg-accent/50 text-accent-foreground",
                                )}
                                onclick={() => selectDate(d)}
                            >
                                {d.getDate()}
                            </button>
                        {:else}
                            <div class="h-8 w-8"></div>
                        {/if}
                    {/each}
                </div>
            </div>

            <!-- Time Section -->
            {#if showTime}
                <div class="flex flex-col w-[120px]">
                    <div
                        class="p-3 border-b text-sm font-medium text-center bg-muted/20"
                    >
                        Jam
                    </div>
                    <div
                        class="overflow-y-auto flex-1 p-2 space-y-1 scrollbar-hide"
                    >
                        {#each times as t}
                            <button
                                class={cn(
                                    "w-full text-left px-3 py-1.5 text-sm rounded-sm flex items-center justify-between",
                                    currentTimeString === t
                                        ? "bg-primary/10 text-primary font-medium"
                                        : "hover:bg-accent text-muted-foreground",
                                )}
                                onclick={() => selectTime(t)}
                            >
                                {t}
                                {#if currentTimeString === t}
                                    <Check class="h-3 w-3" />
                                {/if}
                            </button>
                        {/each}
                    </div>
                </div>
            {/if}
        </div>
    </Popover.Content>
</Popover.Root>
