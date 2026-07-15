<script lang="ts">
	import type { HTMLTableAttributes } from "svelte/elements";
	import type { WithElementRef } from "bits-ui";
	import { cn } from "$lib/shared/lib/utils";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLTableAttributes> = $props();
</script>

<div
	class="relative w-full overflow-auto"
	tabindex="0"
	role="region"
	aria-label="Scrollable Data Table"
>
	<table
		bind:this={ref}
		class={cn("w-full caption-bottom text-sm", className)}
		{...restProps}
	>
		{@render children?.()}
	</table>
</div>
