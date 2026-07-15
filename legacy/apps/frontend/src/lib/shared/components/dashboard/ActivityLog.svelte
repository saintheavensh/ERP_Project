<script lang="ts">
    import {
        Avatar,
        AvatarFallback,
        AvatarImage,
    } from "$lib/shared/components/ui/avatar";

    interface Activity {
        id: number;
        user: string;
        action: string;
        description: string;
        time: string;
        entityType: string;
    }

    let { activities } = $props<{ activities: Activity[] }>();

    function formatTime(dateStr: string) {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();

        const minutes = Math.floor(diff / 60000);
        if (minutes < 60) return `${minutes}m ago`;

        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;

        return date.toLocaleDateString();
    }

    function getInitials(name: string) {
        return name ? name.substring(0, 2).toUpperCase() : "??";
    }
    function formatDescription(desc: string) {
        try {
            // Check if looks like JSON
            if (desc.trim().startsWith("{") || desc.trim().startsWith("[")) {
                const parsed = JSON.parse(desc);
                // Humanize common patterns
                if (
                    parsed.monthlyTotal !== undefined &&
                    parsed.dailyTarget !== undefined
                ) {
                    return `Updated targets: Monthly ${parsed.monthlyTotal}, Daily ${parsed.dailyTarget}`;
                }
                const keys = Object.keys(parsed).join(", ");
                return `Updated: ${keys}`;
            }
            return desc;
        } catch (e) {
            return desc;
        }
    }
</script>

<div class="space-y-4 max-h-[350px] overflow-y-auto pr-2">
    {#each activities as activity}
        <div
            class="flex items-start gap-4 p-2 border-b last:border-0 hover:bg-muted/50 rounded-lg transition-colors"
        >
            <Avatar class="h-9 w-9">
                <AvatarFallback>{getInitials(activity.user)}</AvatarFallback>
            </Avatar>
            <div class="space-y-1">
                <p class="text-sm font-medium leading-none">
                    <span class="font-semibold">{activity.user}</span>
                    <span class="text-muted-foreground font-normal"
                        >{activity.action}</span
                    >
                </p>
                <p class="text-sm text-muted-foreground line-clamp-2">
                    {formatDescription(activity.description)}
                </p>
                <p class="text-xs text-muted-foreground/70">
                    {formatTime(activity.time)}
                </p>
            </div>
        </div>
    {/each}
    {#if activities.length === 0}
        <div class="text-center text-muted-foreground py-8">
            No recent activity
        </div>
    {/if}
</div>
