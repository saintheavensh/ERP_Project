<script lang="ts">
  // P3 — first page needing several identical tiles side by side; no shared
  // stat-card component existed anywhere before this. Styled to match the
  // Kanban board's card language (bg-white rounded-xl border shadow-sm).
  let {
    title,
    value,
    subtitle = '',
    tone = 'default',
    href = '',
  }: {
    title: string;
    value: string;
    subtitle?: string;
    tone?: 'default' | 'warning' | 'danger' | 'success';
    href?: string;
  } = $props();

  const toneClasses: Record<string, string> = {
    default: 'text-slate-900',
    warning: 'text-amber-600',
    danger: 'text-red-600',
    success: 'text-green-600',
  };
</script>

{#snippet content()}
  <div class="text-sm font-medium text-slate-500">{title}</div>
  <div class="text-2xl font-bold mt-1 {toneClasses[tone]}">{value}</div>
  {#if subtitle}
    <div class="text-xs text-slate-400 mt-1">{subtitle}</div>
  {/if}
{/snippet}

{#if href}
  <a
    {href}
    class="block bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:shadow-md hover:border-blue-300 transition-all"
  >
    {@render content()}
  </a>
{:else}
  <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
    {@render content()}
  </div>
{/if}
