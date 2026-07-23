import { describe, it, expect } from 'vitest';
import { buildLikePattern, MIN_QUERY_LENGTH } from '../service';

describe('buildLikePattern', () => {
  it('wraps a valid query in ILIKE wildcards', () => {
    expect(buildLikePattern('nokia')).toBe('%nokia%');
  });

  it('trims surrounding whitespace before wrapping', () => {
    expect(buildLikePattern('  nokia  ')).toBe('%nokia%');
  });

  it(`returns null for a query shorter than MIN_QUERY_LENGTH (${MIN_QUERY_LENGTH})`, () => {
    expect(buildLikePattern('a')).toBeNull();
    expect(buildLikePattern('')).toBeNull();
    expect(buildLikePattern('   ')).toBeNull();
  });

  it('accepts a query exactly at MIN_QUERY_LENGTH', () => {
    expect(buildLikePattern('ab')).toBe('%ab%');
  });
});
