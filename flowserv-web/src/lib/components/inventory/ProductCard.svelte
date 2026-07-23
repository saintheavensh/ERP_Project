<script lang="ts">
  let { item, priceLabel, stockBadge } = $props<{
    item: any;
    priceLabel: string;
    stockBadge: { label: string; tone: 'ok' | 'low' | 'out' };
  }>();

  const TONE_CLASSES: Record<string, string> = {
    ok: 'bg-green-50 text-green-700 border-green-100',
    low: 'bg-amber-50 text-amber-700 border-amber-100',
    out: 'bg-red-50 text-red-700 border-red-100',
  };
</script>

<a
  href="/inventory/{item.id}"
  class="block bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md hover:border-slate-300 transition-all"
>
  <div class="flex items-start justify-between gap-2 mb-2">
    <h3 class="font-semibold text-slate-900 leading-snug line-clamp-2">{item.name}</h3>
  </div>
  <p class="text-xs text-slate-400 mb-3">SKU: {item.sku}</p>

  <div class="flex items-center justify-between gap-2">
    <span class="font-bold text-slate-900">{priceLabel}</span>
    <span class="text-[11px] font-medium px-2 py-1 rounded border {TONE_CLASSES[stockBadge.tone]}">
      {stockBadge.label}
    </span>
  </div>
</a>
