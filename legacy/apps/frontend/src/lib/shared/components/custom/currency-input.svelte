<script lang="ts">
    /**
     * CurrencyInput - Number input with thousand separators and no arrows
     * Displays formatted value (e.g., "1.234.567") but binds to raw number
     */

    interface Props {
        value: number;
        placeholder?: string;
        class?: string;
        disabled?: boolean;
        min?: number;
        max?: number;
    }

    let {
        value = $bindable(0),
        placeholder = "0",
        class: className = "",
        disabled = false,
        min,
        max,
    }: Props = $props();

    // Format number with thousand separators (Indonesian format: 1.234.567)
    function formatNumber(num: number): string {
        if (isNaN(num) || num === 0) return "";
        return num.toLocaleString("id-ID");
    }

    // Parse formatted string back to number
    function parseNumber(str: string): number {
        if (!str) return 0;
        // Remove all dots (thousand separators) and parse
        const cleaned = str.replace(/\./g, "");
        const parsed = parseInt(cleaned, 10);
        return isNaN(parsed) ? 0 : parsed;
    }

    // Display value (formatted string)
    let displayValue = $state(formatNumber(value));

    // Update display when value changes externally
    $effect(() => {
        displayValue = formatNumber(value);
    });

    function handleInput(e: Event) {
        const input = e.target as HTMLInputElement;
        const cursorPosition = input.selectionStart || 0;
        const oldLength = input.value.length;

        // Only allow digits
        const digitsOnly = input.value.replace(/\D/g, "");
        let newValue = parseInt(digitsOnly, 10) || 0;

        // Apply min/max constraints
        if (min !== undefined && newValue < min) newValue = min;
        if (max !== undefined && newValue > max) newValue = max;

        // Update the bound value
        value = newValue;

        // Update display with formatting
        displayValue = formatNumber(newValue);

        // Adjust cursor position after formatting
        const newLength = displayValue.length;
        const diff = newLength - oldLength;

        requestAnimationFrame(() => {
            const newPos = Math.max(0, cursorPosition + diff);
            input.setSelectionRange(newPos, newPos);
        });
    }

    function handleFocus(e: Event) {
        const input = e.target as HTMLInputElement;
        // Select all on focus for easy replacement
        setTimeout(() => input.select(), 0);
    }

    function handleBlur() {
        // Ensure display is formatted on blur
        displayValue = formatNumber(value);
    }
</script>

<input
    type="text"
    inputmode="numeric"
    {disabled}
    {placeholder}
    value={displayValue}
    oninput={handleInput}
    onfocus={handleFocus}
    onblur={handleBlur}
    class="currency-input flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 {className}"
/>

<style>
    /* Hide number input arrows/spinners - kept for browser compatibility */
    .currency-input::-webkit-outer-spin-button,
    .currency-input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }
</style>
