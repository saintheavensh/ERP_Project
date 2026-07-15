<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		children,
		variant = 'primary',
		class: className = '',
		...rest
	}: {
		children: Snippet;
		variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
		class?: string;
		[key: string]: any;
	} = $props();

	let baseClass = 'font-bold py-3 px-6 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2';
	let variants = {
		primary: 'bg-primary-600 text-white hover:bg-primary-500 shadow-primary-500/30',
		secondary: 'bg-emerald-500 text-white hover:bg-emerald-400 shadow-emerald-500/30',
		danger: 'bg-rose-100 text-rose-600 hover:bg-rose-200 shadow-rose-200/50',
		ghost: 'bg-transparent text-slate-500 shadow-none hover:bg-slate-100'
	};
</script>

<button class="{baseClass} {variants[variant]} {className}" {...rest}>
	{@render children()}
</button>
