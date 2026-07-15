<script lang="ts">
    import * as Dialog from "$lib/shared/components/ui/dialog";
    import { Button } from "$lib/shared/components/ui/button";
    import { Input } from "$lib/shared/components/ui/input";
    import { Label } from "$lib/shared/components/ui/label";
    import { Textarea } from "$lib/shared/components/ui/textarea";
    import { Switch } from "$lib/shared/components/ui/switch";
    import { Badge } from "$lib/shared/components/ui/badge";
    import { ServiceService } from "../../services/service.service";
    import { toast } from "svelte-sonner";
    import { ChevronDown, ChevronUp, AlertTriangle } from "lucide-svelte";
    import { slide } from "svelte/transition";

    let { open = $bindable(false), onSuccess } = $props();

    // Basic Fields
    let name = $state("");
    let phone = $state("");
    let brand = $state("");
    let model = $state("");
    let complaint = $state("");

    // Advanced Fields
    let condition = $state("");
    let completeness = $state("");
    let pin = $state("");

    // Flags
    let showDetails = $state(false);
    let isWait = $state(false); // Priority
    let loading = $state(false);

    // Computed Warnings
    let missingContact = $derived(!phone);

    async function handleSubmit() {
        if (!name || !brand || !model || !complaint) {
            toast.error("Please fill in Name, Device, and Issue.");
            return;
        }

        loading = true;
        try {
            await ServiceService.create({
                type: "regular",
                customer: {
                    name,
                    phone: phone || "",
                },
                unit: {
                    brand,
                    model,
                    status: "Received",
                    condition: condition ? [condition] : [],
                    completeness: completeness ? [completeness] : [],
                    pin: pin,
                },
                complaint,
                status: "antrian",
                priority: isWait ? "wait" : "standard",
            } as any);

            toast.success(
                isWait ? "Priority Ticket Created!" : "Service Ticket Created",
            );

            // Success & Reset
            open = false;
            resetForm();

            if (onSuccess) onSuccess();
        } catch (e: any) {
            console.error(e);
            toast.error(
                e.response?.data?.error || "Failed to create service ticket",
            );
        } finally {
            loading = false;
        }
    }

    function resetForm() {
        name = "";
        phone = "";
        brand = "";
        model = "";
        complaint = "";
        condition = "";
        completeness = "";
        pin = "";
        showDetails = false;
        isWait = false;
    }
</script>

<Dialog.Root bind:open>
    <Dialog.Content class="sm:max-w-[550px]">
        <Dialog.Header>
            <Dialog.Title class="flex items-center gap-2">
                <span>Service Intake</span>
                {#if isWait}
                    <Badge variant="destructive" class="ml-2"
                        >PRIORITY / DITUNGGU</Badge
                    >
                {/if}
            </Dialog.Title>
            <Dialog.Description>
                Quick entry for new service tickets. Expand for more details.
            </Dialog.Description>
        </Dialog.Header>

        <div class="grid gap-4 py-4">
            <!-- Customer Section -->
            <div class="space-y-3">
                <h4
                    class="text-sm font-medium text-muted-foreground border-b pb-1"
                >
                    Customer Info
                </h4>
                <div class="grid grid-cols-4 items-center gap-4">
                    <Label for="name" class="text-right"
                        >Name <span class="text-red-500">*</span></Label
                    >
                    <Input
                        id="name"
                        bind:value={name}
                        class="col-span-3"
                        placeholder="Customer Name"
                    />
                </div>
                <div class="grid grid-cols-4 items-center gap-4">
                    <Label for="phone" class="text-right">Phone</Label>
                    <div class="col-span-3 relative">
                        <Input
                            id="phone"
                            bind:value={phone}
                            placeholder="WhatsApp / Contact"
                            class={missingContact
                                ? "border-orange-300 pr-8"
                                : ""}
                        />
                        {#if missingContact}
                            <div
                                class="absolute right-3 top-2.5 text-orange-500"
                                title="Contact info missing"
                            >
                                <AlertTriangle class="h-4 w-4" />
                            </div>
                        {/if}
                    </div>
                </div>
            </div>

            <!-- Device Section -->
            <div class="space-y-3">
                <h4
                    class="text-sm font-medium text-muted-foreground border-b pb-1 flex justify-between"
                >
                    Device Info
                    <div class="flex items-center space-x-2">
                        <Label for="priority-mode" class="text-xs font-normal"
                            >Ditunggu?</Label
                        >
                        <Switch id="priority-mode" bind:checked={isWait} />
                    </div>
                </h4>
                <div class="grid grid-cols-4 items-center gap-4">
                    <Label for="brand" class="text-right"
                        >Device <span class="text-red-500">*</span></Label
                    >
                    <div class="col-span-3 grid grid-cols-2 gap-2">
                        <Input
                            id="brand"
                            bind:value={brand}
                            placeholder="Brand (e.g. Samsung)"
                        />
                        <Input
                            id="model"
                            bind:value={model}
                            placeholder="Model (e.g. A52)"
                        />
                    </div>
                </div>

                <div class="grid grid-cols-4 items-center gap-4">
                    <Label for="complaint" class="text-right"
                        >Issue <span class="text-red-500">*</span></Label
                    >
                    <Textarea
                        id="complaint"
                        bind:value={complaint}
                        class="col-span-3"
                        placeholder="Describe the problem..."
                        rows={2}
                    />
                </div>
            </div>

            <!-- Expandable Details -->
            <div>
                <Button
                    variant="ghost"
                    size="sm"
                    class="w-full flex justify-between text-muted-foreground"
                    onclick={() => (showDetails = !showDetails)}
                >
                    <span
                        >{showDetails
                            ? "Hide Details"
                            : "Add Physical Details & PIN"}</span
                    >
                    {#if showDetails}
                        <ChevronUp class="h-4 w-4" />
                    {:else}
                        <ChevronDown class="h-4 w-4" />
                    {/if}
                </Button>

                {#if showDetails}
                    <div
                        class="pt-3 space-y-3 bg-muted/30 p-3 rounded-md mt-1"
                        transition:slide
                    >
                        <div class="grid grid-cols-4 items-center gap-4">
                            <Label for="pin" class="text-right text-xs"
                                >PIN/Pattern</Label
                            >
                            <Input
                                id="pin"
                                bind:value={pin}
                                class="col-span-3 h-8 text-sm"
                                placeholder="Screen Lock Code"
                            />
                        </div>
                        <div class="grid grid-cols-4 items-center gap-4">
                            <Label for="condition" class="text-right text-xs"
                                >Condition</Label
                            >
                            <Input
                                id="condition"
                                bind:value={condition}
                                class="col-span-3 h-8 text-sm"
                                placeholder="Scratches, Cracks, etc."
                            />
                        </div>
                        <div class="grid grid-cols-4 items-center gap-4">
                            <Label for="completeness" class="text-right text-xs"
                                >Equipment</Label
                            >
                            <Input
                                id="completeness"
                                bind:value={completeness}
                                class="col-span-3 h-8 text-sm"
                                placeholder="Unit only, Charger, Box..."
                            />
                        </div>
                    </div>
                {/if}
            </div>
        </div>

        <Dialog.Footer>
            <Button variant="outline" onclick={() => (open = false)}
                >Cancel</Button
            >
            <Button
                onclick={handleSubmit}
                disabled={loading}
                class={isWait ? "bg-red-600 hover:bg-red-700" : ""}
            >
                {loading ? "Creating..." : "Create Ticket"}
            </Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>
