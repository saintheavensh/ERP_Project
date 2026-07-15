<script lang="ts">
    import { Button } from "$lib/shared/components/ui/button";
    import { Input } from "$lib/shared/components/ui/input";
    import { Label } from "$lib/shared/components/ui/label";
    import { Textarea } from "$lib/shared/components/ui/textarea";
    import { toast } from "svelte-sonner";

    let {
        onSubmit,
        onClose,
    }: {
        onSubmit: (data: {
            toolName: string;
            justification?: string;
        }) => Promise<void>;
        onClose: () => void;
    } = $props();

    let submitting = $state(false);
    let toolName = $state("");
    let justification = $state("");

    async function handleSubmit(e: Event) {
        e.preventDefault();

        if (!toolName) return toast.error("Tool name is required");

        submitting = true;
        try {
            await onSubmit({ toolName, justification });
            // Let parent component handle close on success
        } finally {
            submitting = false;
        }
    }
</script>

<form onsubmit={handleSubmit} class="space-y-6">
    <div class="space-y-4">
        <div class="space-y-2">
            <Label for="toolName">What tool do you need? *</Label>
            <Input
                id="toolName"
                bind:value={toolName}
                placeholder="e.g. Obeng Y (Tri-point) Y0.6"
                required
            />
            <p class="text-xs text-slate-500">
                Provide the specific brand or name of the tool you are
                requesting.
            </p>
        </div>

        <div class="space-y-2">
            <Label for="justification">Reason / Problem</Label>
            <Textarea
                id="justification"
                bind:value={justification}
                placeholder="Why do you need this tool? (e.g. Current one is broken, need it for new repairs, etc.)"
                rows={3}
            />
        </div>
    </div>

    <div
        class="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800"
    >
        <Button
            type="button"
            variant="outline"
            onclick={onClose}
            disabled={submitting}
        >
            Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Request Tool"}
        </Button>
    </div>
</form>
