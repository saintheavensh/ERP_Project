import { describe, it, expect } from 'vitest';
import { roundMoney, toMoneyString } from '../money';

describe('roundMoney', () => {
  it('rounds to 2 decimal places', () => {
    expect(roundMoney(1666666.666666)).toBe(1666666.67);
  });

  it('leaves an already-2dp value unchanged', () => {
    expect(roundMoney(150.5)).toBe(150.5);
  });

  it('rounds .005 up (half-away-from-zero at the cent boundary)', () => {
    expect(roundMoney(10.005)).toBe(10.01);
  });

  it('handles whole numbers', () => {
    expect(roundMoney(500)).toBe(500);
  });
});

describe('toMoneyString', () => {
  it('formats to a fixed 2-decimal string', () => {
    expect(toMoneyString(1666666.666666)).toBe('1666666.67');
  });

  it('pads whole numbers with .00', () => {
    expect(toMoneyString(500)).toBe('500.00');
  });

  it('pads a single decimal place with a trailing zero', () => {
    expect(toMoneyString(99.9)).toBe('99.90');
  });
});
