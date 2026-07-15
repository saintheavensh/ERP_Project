<script lang="ts">
    import { Card, CardContent } from "$lib/shared/components/ui/card";

    interface StatCard {
        label: string;
        value: string | number;
        subtext: string;
        icon: any; // Component type
        color: string;
    }

    let { stats } = $props<{ stats: StatCard[] }>();
</script>

<div class="w-full overflow-x-auto pb-4">
    <div class="flex gap-4 min-w-max">
        {#each stats as stat}
            <Card class={`min-w-[240px] border-l-4 ${stat.color} shadow-sm`}>
                <CardContent class="p-6">
                    <div class="flex items-center justify-between">
                        <span class="text-sm font-medium text-muted-foreground"
                            >{stat.label}</span
                        >
                        <stat.icon
                            class={`h-4 w-4 ${stat.color.replace("border-l", "text")}`}
                        />
                    </div>
                    <div class="mt-2 text-2xl font-bold">
                        {stat.value}
                    </div>
                    <p class="text-xs text-muted-foreground mt-1">
                        {stat.subtext}
                    </p>
                </CardContent>
            </Card>
        {/each}
    </div>
</div>
