<script lang="ts">
	import { fade, scale } from 'svelte/transition';

	interface Props {
		open: boolean;
		title?: string;
		onClose: () => void;
		children?: import('svelte').Snippet;
		footer?: import('svelte').Snippet;
	}

	let { open, title, onClose, children, footer }: Props = $props();

	const handleBackdropClick = (e: MouseEvent) => {
		if (e.target === e.currentTarget) onClose();
	};

	// Prevent scrolling when modal is open
	$effect(() => {
		if (open) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = '';
		}
	});
</script>

{#if open}
	<!-- Backdrop -->
	<div 
		class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
		onclick={handleBackdropClick}
		onkeydown={(e) => e.key === 'Escape' && onClose()}
		role="presentation"
		transition:fade={{ duration: 200 }}
	>
		<!-- Modal Content -->
		<div 
			class="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col"
			transition:scale={{ duration: 250, start: 0.95 }}
		>
			<!-- Header -->
			<div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
				<h3 class="text-lg font-bold text-slate-800">{title || 'Konfirmasi'}</h3>
				<button 
					onclick={onClose}
					class="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-400"
				>
					✕
				</button>
			</div>

			<!-- Body -->
			<div class="px-6 py-6 text-slate-600 leading-relaxed overflow-y-auto max-h-[70vh]">
				{@render children?.()}
			</div>

			<!-- Footer -->
			{#if footer}
				<div class="px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex justify-end gap-3">
					{@render footer()}
				</div>
			{/if}
		</div>
	</div>
{/if}
