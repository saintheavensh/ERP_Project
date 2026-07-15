<script lang="ts">
    import { Input } from "$lib/shared/components/ui/input";
    import { Search, ScanBarcode } from "lucide-svelte";

    let {
        value = $bindable(""),
        placeholder = "Search products...",
        onSearch,
    }: {
        value?: string;
        placeholder?: string;
        onSearch?: (val: string) => void;
    } = $props();

    let timeout: any;

    function handleInput(e: Event) {
        const val = (e.target as HTMLInputElement).value;
        value = val;

        clearTimeout(timeout);
        timeout = setTimeout(() => {
            onSearch?.(val);
        }, 300);
    }
</script>

<div class="relative w-full">
    <Search
        class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
    />
    <Input
        type="text"
        {placeholder}
        class="pl-10 pr-10"
        {value}
        oninput={handleInput}
    />
    <button
        class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        title="Scan Barcode"
    >
        <ScanBarcode class="h-5 w-5" />
    </button>
</div>
