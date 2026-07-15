<script lang="ts">
    import { Badge } from "$lib/shared/components/ui/badge";
    import { Button } from "$lib/shared/components/ui/button";

    interface Service {
        id: number;
        customer: { name: string; phone: string };
        device: { model: string; brand: string };
        status: string;
        estimatedCompletionDate: string;
    }

    let {
        services,
        title,
        emptyMessage = "No services found",
    } = $props<{
        services: Service[];
        title?: string;
        emptyMessage?: string;
    }>();

    function getStatusColor(status: string) {
        switch (status) {
            case "masuk":
                return "default"; // dark usually
            case "dikerjakan":
                return "secondary"; // blue-ish often
            case "menunggu_sparepart":
                return "destructive"; // orange/red
            case "selesai":
                return "green"; // custom class needed usually, or 'outline'
            default:
                return "outline";
        }
    }

    function formatDate(dateStr: string) {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
        });
    }
</script>

<div class="space-y-4">
    {#each services as service}
        <div
            class="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
        >
            <div class="space-y-1 min-w-0">
                <div class="flex items-center gap-2">
                    <span class="font-medium truncate"
                        >{service.customer?.name}</span
                    >
                    <Badge variant="outline" class="text-xs font-normal">
                        {service.device?.brand}
                        {service.device?.model}
                    </Badge>
                </div>
                <div
                    class="text-sm text-muted-foreground flex items-center gap-2"
                >
                    <span
                        >Est: {formatDate(
                            service.estimatedCompletionDate,
                        )}</span
                    >
                    <Badge
                        variant="secondary"
                        class="text-[10px] h-5 px-1.5 capitalize"
                    >
                        {service.status.replace("_", " ")}
                    </Badge>
                </div>
            </div>
            <Button variant="ghost" size="sm" href={`/service/${service.id}`}>
                View
            </Button>
        </div>
    {/each}
    {#if services.length === 0}
        <div class="text-center text-muted-foreground py-8">
            {emptyMessage}
        </div>
    {/if}
</div>
