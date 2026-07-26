import { describe, it, expect } from 'vitest';
import { evaluateTempoEligibility } from '../tempo';

describe('evaluateTempoEligibility', () => {
  it('allows any non-tempo method regardless of the customer flag', () => {
    for (const paymentMethod of ['cash', 'transfer', 'qris', 'ewallet', 'split']) {
      expect(evaluateTempoEligibility({ paymentMethod, customerAllowTempo: false }).allowed).toBe(true);
      expect(evaluateTempoEligibility({ paymentMethod, customerAllowTempo: null }).allowed).toBe(true);
    }
  });

  it('allows tempo when the customer is explicitly permitted', () => {
    const r = evaluateTempoEligibility({ paymentMethod: 'tempo', customerAllowTempo: true });
    expect(r.allowed).toBe(true);
    expect(r.code).toBeUndefined();
  });

  it('blocks tempo with TEMPO_NOT_ALLOWED when the customer is not permitted', () => {
    const r = evaluateTempoEligibility({ paymentMethod: 'tempo', customerAllowTempo: false });
    expect(r.allowed).toBe(false);
    expect(r.code).toBe('TEMPO_NOT_ALLOWED');
    expect(r.message).toBeTruthy();
  });

  it('treats null/undefined allowTempo as not permitted (fail closed)', () => {
    expect(evaluateTempoEligibility({ paymentMethod: 'tempo', customerAllowTempo: null }).allowed).toBe(false);
    expect(evaluateTempoEligibility({ paymentMethod: 'tempo', customerAllowTempo: undefined }).allowed).toBe(false);
  });
});
