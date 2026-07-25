<script lang="ts">
  import { parsePattern, dotsToValue } from '$lib/utils/pattern';

  let { value = '', readonly = false, onchange }:
    { value?: string; readonly?: boolean; onchange?: (v: string) => void } = $props();

  const dots = $derived(parsePattern(value) ?? []);

  const STEP = 60;
  const PAD = 30;
  const coord = (i: number) => ({
    x: ((i - 1) % 3) * STEP + PAD,
    y: Math.floor((i - 1) / 3) * STEP + PAD,
  });

  function tap(i: number) {
    if (readonly) return;
    if (dots.includes(i)) return; // titik yang sudah dipakai tak bisa diulang
    onchange?.(dotsToValue([...dots, i]));
  }
  function clear() { onchange?.(''); }
</script>

<div class="inline-block" data-testid="pattern-pad">
  <svg viewBox="0 0 180 180" class="w-40 h-40 select-none" role="group" aria-label="Pola kunci">
    {#if dots.length > 1}
      <polyline
        points={dots.map((i) => { const c = coord(i); return `${c.x},${c.y}`; }).join(' ')}
        fill="none" stroke="#2563eb" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
    {/if}
    {#each [1, 2, 3, 4, 5, 6, 7, 8, 9] as i}
      {@const c = coord(i)}
      {@const order = dots.indexOf(i)}
      <circle
        cx={c.x} cy={c.y} r="16"
        fill={order >= 0 ? '#2563eb' : '#ffffff'}
        stroke={order >= 0 ? '#2563eb' : '#cbd5e1'} stroke-width="2"
        class={readonly ? '' : 'cursor-pointer'}
        role={readonly ? undefined : 'button'}
        aria-label={readonly ? undefined : `Titik ${i}`}
        onclick={() => tap(i)} />
      {#if order >= 0}
        <text x={c.x} y={c.y} text-anchor="middle" dominant-baseline="central"
          fill="#ffffff" font-size="12" font-weight="bold" class="pointer-events-none">{order + 1}</text>
      {/if}
    {/each}
  </svg>
  {#if !readonly}
    <div class="mt-1 flex items-center gap-3">
      <button type="button" onclick={clear} class="text-xs text-slate-500 hover:text-slate-700 underline">Hapus</button>
      <span class="text-xs text-slate-500">{dots.length ? `Urutan: ${dots.join('-')}` : 'Ketuk titik berurutan'}</span>
    </div>
  {/if}
</div>
