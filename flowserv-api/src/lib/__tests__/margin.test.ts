import { describe, it, expect } from 'vitest';
import {
  resolveMarginConfig,
  recommendedPrice,
  grossMarginPct,
  markupPct,
  meetsTarget,
  validateTargetMargin,
  DEFAULT_MARGIN_STRATEGY,
  DEFAULT_TARGET_MARGIN,
} from '../margin';

describe('resolveMarginConfig', () => {
  it('falls back to system defaults when nothing is set', () => {
    expect(resolveMarginConfig(null, null)).toEqual({
      strategy: DEFAULT_MARGIN_STRATEGY,
      targetMargin: DEFAULT_TARGET_MARGIN,
    });
  });

  it('uses the category config when the item has none', () => {
    const cfg = resolveMarginConfig(
      { marginStrategy: null, targetMargin: null },
      { marginStrategy: 'gross_margin', targetMargin: '40.00' }
    );
    expect(cfg).toEqual({ strategy: 'gross_margin', targetMargin: 40 });
  });

  it('lets the item override the category', () => {
    const cfg = resolveMarginConfig(
      { marginStrategy: 'markup', targetMargin: '50' },
      { marginStrategy: 'gross_margin', targetMargin: '40' }
    );
    expect(cfg).toEqual({ strategy: 'markup', targetMargin: 50 });
  });

  it('falls back per-field independently (strategy from item, percent from category)', () => {
    const cfg = resolveMarginConfig(
      { marginStrategy: 'gross_margin', targetMargin: null },
      { marginStrategy: 'markup', targetMargin: '25' }
    );
    expect(cfg).toEqual({ strategy: 'gross_margin', targetMargin: 25 });
  });

  it('treats an empty-string percent as unset', () => {
    const cfg = resolveMarginConfig({ targetMargin: '' }, null);
    expect(cfg.targetMargin).toBe(DEFAULT_TARGET_MARGIN);
  });
});

describe('recommendedPrice', () => {
  it('markup: price = cost × (1 + m/100)', () => {
    expect(recommendedPrice(100, { strategy: 'markup', targetMargin: 30 })).toBe(130);
  });

  it('gross_margin: price = cost ÷ (1 − m/100)', () => {
    expect(recommendedPrice(100, { strategy: 'gross_margin', targetMargin: 30 })).toBe(142.86);
  });

  it('markup and gross_margin diverge for the same percent', () => {
    const markup = recommendedPrice(200000, { strategy: 'markup', targetMargin: 25 });
    const gross = recommendedPrice(200000, { strategy: 'gross_margin', targetMargin: 25 });
    expect(markup).toBe(250000);
    expect(gross).toBeCloseTo(266666.67, 2);
    expect(gross).toBeGreaterThan(markup);
  });

  it('a 0% target returns the cost unchanged under both strategies', () => {
    expect(recommendedPrice(500, { strategy: 'markup', targetMargin: 0 })).toBe(500);
    expect(recommendedPrice(500, { strategy: 'gross_margin', targetMargin: 0 })).toBe(500);
  });

  it('throws on a gross_margin target of 100 (division by zero)', () => {
    expect(() => recommendedPrice(100, { strategy: 'gross_margin', targetMargin: 100 })).toThrow();
  });

  it('throws on a negative cost', () => {
    expect(() => recommendedPrice(-1, { strategy: 'markup', targetMargin: 30 })).toThrow();
  });
});

describe('grossMarginPct / markupPct', () => {
  it('gross margin of price 130 over cost 100 is ~23.08%', () => {
    expect(grossMarginPct(130, 100)).toBeCloseTo(23.0769, 3);
  });

  it('markup of price 130 over cost 100 is exactly 30%', () => {
    expect(markupPct(130, 100)).toBeCloseTo(30, 6);
  });

  it('recommendedPrice(gross_margin) round-trips back to the target gross margin', () => {
    const price = recommendedPrice(100, { strategy: 'gross_margin', targetMargin: 40 });
    expect(grossMarginPct(price, 100)).toBeCloseTo(40, 1);
  });

  it('guards divide-by-zero: 0 when price/cost is 0', () => {
    expect(grossMarginPct(0, 100)).toBe(0);
    expect(markupPct(130, 0)).toBe(0);
  });
});

describe('meetsTarget', () => {
  it('markup: 130 meets a 30% markup target on cost 100', () => {
    expect(meetsTarget(130, 100, { strategy: 'markup', targetMargin: 30 })).toBe(true);
  });

  it('markup: 125 fails a 30% markup target', () => {
    expect(meetsTarget(125, 100, { strategy: 'markup', targetMargin: 30 })).toBe(false);
  });

  it('tolerance lets a small shortfall pass', () => {
    expect(meetsTarget(129, 100, { strategy: 'markup', targetMargin: 30 }, 1.5)).toBe(true);
  });

  it('gross_margin: the recommended price meets its own target', () => {
    const price = recommendedPrice(100, { strategy: 'gross_margin', targetMargin: 35 });
    expect(meetsTarget(price, 100, { strategy: 'gross_margin', targetMargin: 35 }, 0.01)).toBe(true);
  });
});

describe('validateTargetMargin', () => {
  it('accepts a normal markup percent', () => {
    expect(validateTargetMargin('markup', 30)).toBeNull();
  });

  it('accepts a high markup (200%)', () => {
    expect(validateTargetMargin('markup', 200)).toBeNull();
  });

  it('rejects a gross_margin percent of 100 or more', () => {
    expect(validateTargetMargin('gross_margin', 100)).not.toBeNull();
    expect(validateTargetMargin('gross_margin', 150)).not.toBeNull();
  });

  it('accepts a gross_margin percent below 100', () => {
    expect(validateTargetMargin('gross_margin', 99.99)).toBeNull();
  });

  it('rejects a negative percent', () => {
    expect(validateTargetMargin('markup', -5)).not.toBeNull();
  });

  it('rejects an absurdly high markup', () => {
    expect(validateTargetMargin('markup', 5000)).not.toBeNull();
  });
});
