<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		children,
		title,
		icon = '',
		class: className = ''
	}: {
		children: Snippet;
		title?: string;
		icon?: string;
		class?: string;
	} = $props();
</script>

<div class="glass-card p-4 md:p-6 {className}">
	{#if title}
		<h2 class="text-xs font-bold text-primary-500 tracking-widest uppercase mb-4 flex items-center gap-2">
			{#if icon}<span>{icon}</span>{/if}
			{title}
		</h2>
	{/if}
	{@render children()}
</div>
