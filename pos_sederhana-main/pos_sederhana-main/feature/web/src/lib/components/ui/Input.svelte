<script lang="ts">
	let {
		label,
		id,
		type = 'text',
		value = $bindable(),
		placeholder = '',
		required = false,
		class: className = '',
		...rest
	}: {
		label: string;
		id: string;
		type?: 'text' | 'number' | 'password';
		value: string | number | undefined;
		placeholder?: string;
		required?: boolean;
		class?: string;
		[key: string]: any;
	} = $props();
</script>

<div class="flex flex-col gap-1.5 w-full">
	<label for={id} class="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</label>
	<input
		{id}
		{type}
		bind:value
		{placeholder}
		{required}
		class="input-field shadow-inner {className}"
		autocomplete="off"
		{...rest}
	/>
</div>
