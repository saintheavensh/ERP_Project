import { describe, it, expect } from 'vitest';
import { isIdempotencyKeyConflict } from '../idempotency';

describe('idempotency: isIdempotencyKeyConflict', () => {
  it('recognizes a unique-violation on the idempotency_keys table', () => {
    expect(isIdempotencyKeyConflict({ code: '23505', table: 'idempotency_keys' })).toBe(true);
  });

  it('recognizes a unique-violation identified only by constraint name', () => {
    expect(isIdempotencyKeyConflict({ code: '23505', constraint: 'idempotency_keys_tenant_id_key_pk' })).toBe(true);
  });

  it('does not match a unique-violation on an unrelated table', () => {
    expect(isIdempotencyKeyConflict({ code: '23505', table: 'pos_invoices' })).toBe(false);
  });

  it('does not match a non-unique-violation error', () => {
    expect(isIdempotencyKeyConflict({ code: '23503', table: 'idempotency_keys' })).toBe(false);
  });

  it('does not match non-error values', () => {
    expect(isIdempotencyKeyConflict(null)).toBe(false);
    expect(isIdempotencyKeyConflict(undefined)).toBe(false);
    expect(isIdempotencyKeyConflict(new Error('boom'))).toBe(false);
  });

  // Drizzle (via the `postgres` driver) wraps the raw driver error as
  // DrizzleQueryError with the real Postgres error one level down on `.cause`,
  // and `postgres`'s field names (table_name/constraint_name) differ from
  // `pg`'s (table/constraint) — this is the actual live shape hit in manual
  // concurrent-checkout testing, not a hypothetical.
  it('recognizes the wrapped DrizzleQueryError shape from the `postgres` driver', () => {
    const wrapped = {
      message: 'Failed query: insert into "idempotency_keys" ...',
      cause: {
        code: '23505',
        table_name: 'idempotency_keys',
        constraint_name: 'idempotency_keys_tenant_id_key_pk',
      },
    };
    expect(isIdempotencyKeyConflict(wrapped)).toBe(true);
  });

  it('does not match a wrapped unique-violation on an unrelated table', () => {
    const wrapped = { cause: { code: '23505', table_name: 'pos_invoices' } };
    expect(isIdempotencyKeyConflict(wrapped)).toBe(false);
  });
});
