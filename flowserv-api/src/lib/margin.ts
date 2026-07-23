// Dynamic margin pricing (Phase 4C). A tenant can configure a pricing strategy
// per category or per item. Two strategies exist:
//
//   - 'markup'        price = cost × (1 + m/100)   → profit measured against COST
//   - 'gross_margin'  price = cost ÷ (1 − m/100)   → profit measured against PRICE
//
// The difference matters: at cost 100 with m=30, markup gives 130 while
// gross_margin gives ~142.86. Gross margin is bounded (m must be < 100, or the
// divisor hits zero/negative); markup is not.
//
// Effective config is resolved item-override → category → system default, which
// mirrors the fallback the frontend simulator already used
// (`item.targetMargin || category.targetMargin || 30`).
import { roundMoney } from './money';

export type MarginStrategy = 'markup' | 'gross_margin';

export const MARGIN_STRATEGIES: readonly MarginStrategy[] = ['markup', 'gross_margin'] as const;
export const DEFAULT_MARGIN_STRATEGY: MarginStrategy = 'markup';
export const DEFAULT_TARGET_MARGIN = 30; // percent
/** Upper bound for a markup percent — 1000% (11×) is already implausibly high. */
export const MAX_TARGET_MARGIN = 1000;

export interface MarginConfig {
  strategy: MarginStrategy;
  targetMargin: number; // percent
}

/** The shape of a category or item row as far as margin config is concerned. */
export interface MarginSource {
  marginStrategy?: string | null;
  targetMargin?: string | number | null;
}

/**
 * Resolve the effective margin config: item override → category → system default.
 * Each field falls back independently, so an item can override the strategy while
 * inheriting the category's target percent (or vice versa).
 */
export function resolveMarginConfig(item?: MarginSource | null, category?: MarginSource | null): MarginConfig {
  const strategy =
    normalizeStrategy(item?.marginStrategy) ??
    normalizeStrategy(category?.marginStrategy) ??
    DEFAULT_MARGIN_STRATEGY;
  const targetMargin =
    toNumber(item?.targetMargin) ??
    toNumber(category?.targetMargin) ??
    DEFAULT_TARGET_MARGIN;
  return { strategy, targetMargin };
}

/** Recommended selling price for a unit cost under a margin config. */
export function recommendedPrice(cost: number, config: MarginConfig): number {
  if (cost < 0) throw new Error('cost must be >= 0');
  if (config.strategy === 'gross_margin') {
    if (config.targetMargin >= 100) throw new Error('gross_margin target must be < 100');
    return roundMoney(cost / (1 - config.targetMargin / 100));
  }
  return roundMoney(cost * (1 + config.targetMargin / 100));
}

/** Actual gross-margin % of a price vs cost: (price − cost)/price × 100. 0 when price ≤ 0. */
export function grossMarginPct(price: number, cost: number): number {
  if (price <= 0) return 0;
  return ((price - cost) / price) * 100;
}

/** Actual markup % of a price vs cost: (price − cost)/cost × 100. 0 when cost ≤ 0. */
export function markupPct(price: number, cost: number): number {
  if (cost <= 0) return 0;
  return ((price - cost) / cost) * 100;
}

/**
 * Does `price` meet the config's target, measured in the config's own strategy?
 * `tolerancePct` allows a small shortfall (e.g. 1 → accept 29% against a 30% target).
 * This is the check Phase 4C.2 will enforce on price writes; 4C.1 only stores config.
 */
export function meetsTarget(price: number, cost: number, config: MarginConfig, tolerancePct = 0): boolean {
  const actual = config.strategy === 'gross_margin' ? grossMarginPct(price, cost) : markupPct(price, cost);
  return actual >= config.targetMargin - tolerancePct;
}

/** Validate a target-margin percent for a strategy. Returns an error message, or null when valid. */
export function validateTargetMargin(strategy: MarginStrategy, targetMargin: number): string | null {
  if (!Number.isFinite(targetMargin)) return 'targetMargin must be a number';
  if (targetMargin < 0) return 'targetMargin must be >= 0';
  if (targetMargin > MAX_TARGET_MARGIN) return `targetMargin must be <= ${MAX_TARGET_MARGIN}`;
  if (strategy === 'gross_margin' && targetMargin >= 100) return 'gross_margin targetMargin must be < 100';
  return null;
}

function normalizeStrategy(v: unknown): MarginStrategy | null {
  return v === 'markup' || v === 'gross_margin' ? v : null;
}

function toNumber(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
}
