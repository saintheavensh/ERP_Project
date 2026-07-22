import { describe, it, expect } from 'vitest';
import { formatInvoiceNumber } from '../invoice-number';

// H17 — the numbering format is shared by POS checkout and the service-invoice-from-ticket
// path. This pins the format so the extraction (allocateInvoiceNumber) can't silently drift.
describe('formatInvoiceNumber', () => {
  it('zero-pads the counter to 4 digits', () => {
    expect(formatInvoiceNumber('20260722', 1)).toBe('INV-20260722-0001');
    expect(formatInvoiceNumber('20260722', 42)).toBe('INV-20260722-0042');
  });

  it('does not truncate a counter beyond 4 digits', () => {
    expect(formatInvoiceNumber('20260722', 12345)).toBe('INV-20260722-12345');
  });
});
