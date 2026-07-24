<script lang="ts">
  // 6B.2 — WYSIWYG per the spec: this renders the exact ThermalBlock[] the
  // backend produced (modules/printer/render.ts, 6A.2) verbatim, at the
  // printer's real character width. No layout decision is made here — every
  // block's `value` (for 'row'/'total') is already column-aligned server-side.

  interface ThermalBlock {
    type: 'text' | 'line' | 'row' | 'total' | 'cut';
    value?: string;
    align?: 'left' | 'center' | 'right';
    bold?: boolean;
  }

  let { blocks, paperSize }: { blocks: ThermalBlock[]; paperSize: '58mm' | '80mm' } = $props();

  const CHAR_WIDTH: Record<'58mm' | '80mm', number> = { '58mm': 32, '80mm': 48 };
  let width = $derived(CHAR_WIDTH[paperSize]);
</script>

<div
  class="bg-white border border-slate-300 shadow-inner mx-auto font-mono text-xs leading-relaxed whitespace-pre"
  style="width: {width}ch; padding: 12px;"
  data-testid="thermal-preview"
  data-paper-size={paperSize}
>
  {#each blocks as block, i (i)}
    {#if block.type === 'line'}
      <div>{'-'.repeat(width)}</div>
    {:else if block.type === 'cut'}
      <div class="text-slate-400">{'- '.repeat(Math.floor(width / 2))}</div>
    {:else if block.type === 'text'}
      <div
        class:text-center={block.align === 'center'}
        class:text-right={block.align === 'right'}
        class:font-bold={block.bold}
      >{block.value}</div>
    {:else if block.type === 'row'}
      <div>{block.value}</div>
    {:else if block.type === 'total'}
      <div class="font-bold">{block.value}</div>
    {/if}
  {/each}
</div>
