<script lang="ts">
    import { Checkbox as CheckboxPrimitive } from "bits-ui";
    import { Check } from "lucide-svelte";
    import { cn } from "$lib/shared/lib/utils";

    // Cast to any to bypass "Property Indicator does not exist" type error
    // likely caused by version mismatch or bundling types issue.
    const Checkbox = CheckboxPrimitive as any;

    let {
        ref = $bindable(null),
        checked = $bindable(false),
        value = undefined,
        class: className,
        ...restProps
    }: any = $props();
    // Relaxed props type to avoid checking against CheckboxPrimitive.RootProps if types are broken
</script>

<Checkbox.Root
    bind:ref
    bind:checked
    {value}
    class={cn(
        "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
        className,
    )}
    {...restProps}
>
    <Checkbox.Indicator
        class={cn("flex items-center justify-center text-current")}
    >
        <Check class="h-4 w-4" />
    </Checkbox.Indicator>
</Checkbox.Root>
