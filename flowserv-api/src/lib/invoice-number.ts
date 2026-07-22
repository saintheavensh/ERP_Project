import { sql } from 'drizzle-orm';

/**
 * Allocates the next `INV-YYYYMMDD-NNNN` number for a tenant, per day, inside the
 * caller's transaction. The INSERT ... ON CONFLICT DO UPDATE ... RETURNING is atomic,
 * so two concurrent callers can never receive the same number without extra locking
 * (proven under concurrency in H5). Extracted in H17 so POS checkout and the new
 * service-invoice-from-ticket path share exactly one numbering implementation rather
 * than two copies that drift (the WAC-duplication trap the codebase already hit in 3.5B.4).
 *
 * `tx` is a Drizzle transaction handle; typed loosely to match the other service-layer
 * helpers (modules/inventory/service.ts, modules/tickets/service.ts) that receive `tx`.
 */
export async function allocateInvoiceNumber(tx: any, tenantId: string): Promise<string> {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rows = (await tx.execute(sql`
    INSERT INTO invoice_sequences (tenant_id, date_key, last_number)
    VALUES (${tenantId}, ${dateStr}, 1)
    ON CONFLICT (tenant_id, date_key)
    DO UPDATE SET last_number = invoice_sequences.last_number + 1
    RETURNING last_number
  `)) as Array<{ last_number: number }>;
  return formatInvoiceNumber(dateStr, rows[0].last_number);
}

/** Pure — formats the components of an invoice number. Split out so the format is unit-testable. */
export function formatInvoiceNumber(dateKey: string, lastNumber: number): string {
  return `INV-${dateKey}-${String(lastNumber).padStart(4, '0')}`;
}
