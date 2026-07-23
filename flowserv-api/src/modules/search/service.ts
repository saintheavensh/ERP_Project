import { db } from '../../db/connection';
import { customers, customerAssets, serviceTickets, inventoryItems, suppliers } from '../../db/schema';
import { and, eq, or, ilike, desc } from 'drizzle-orm';
import type { SearchResultItem, SearchResultType } from './types';

// A query shorter than this matches too much of the table to be useful
// (e.g. "a" against every customer name) and is expensive to ILIKE-scan.
export const MIN_QUERY_LENGTH = 2;

// Results per type, so one huge match (e.g. every ticket for a common
// customer name) can't crowd out the other three types in the dropdown.
export const RESULTS_PER_TYPE = 5;

/**
 * Pure — no database. `%q%` for ILIKE, trimmed. Returns null when the query
 * is too short to search (caller should return an empty result set, not
 * run four table scans for a single keystroke).
 */
export function buildLikePattern(rawQuery: string): string | null {
  const trimmed = rawQuery.trim();
  if (trimmed.length < MIN_QUERY_LENGTH) return null;
  return `%${trimmed}%`;
}

export async function searchAll(tenantId: string, rawQuery: string): Promise<SearchResultItem[]> {
  const pattern = buildLikePattern(rawQuery);
  if (!pattern) return [];

  const [customerRows, ticketRows, inventoryRows, supplierRows] = await Promise.all([
    db
      .select({ id: customers.id, name: customers.name, phone: customers.phone })
      .from(customers)
      .where(and(eq(customers.tenantId, tenantId), or(ilike(customers.name, pattern), ilike(customers.phone, pattern))))
      .orderBy(desc(customers.createdAt))
      .limit(RESULTS_PER_TYPE),

    db
      .select({
        id: serviceTickets.id,
        status: serviceTickets.status,
        customerName: customers.name,
        assetBrand: customerAssets.brand,
        assetModel: customerAssets.model,
      })
      .from(serviceTickets)
      .innerJoin(customers, eq(serviceTickets.customerId, customers.id))
      .innerJoin(customerAssets, eq(serviceTickets.customerAssetId, customerAssets.id))
      .where(
        and(
          eq(serviceTickets.tenantId, tenantId),
          or(
            ilike(customers.name, pattern),
            ilike(customers.phone, pattern),
            ilike(customerAssets.brand, pattern),
            ilike(customerAssets.model, pattern),
            ilike(customerAssets.serialNumber, pattern)
          )
        )
      )
      .orderBy(desc(serviceTickets.createdAt))
      .limit(RESULTS_PER_TYPE),

    db
      .select({ id: inventoryItems.id, name: inventoryItems.name, sku: inventoryItems.sku })
      .from(inventoryItems)
      .where(
        and(
          eq(inventoryItems.tenantId, tenantId),
          or(ilike(inventoryItems.name, pattern), ilike(inventoryItems.sku, pattern), ilike(inventoryItems.universalCode, pattern))
        )
      )
      .orderBy(desc(inventoryItems.createdAt))
      .limit(RESULTS_PER_TYPE),

    db
      .select({ id: suppliers.id, name: suppliers.name, contactInfo: suppliers.contactInfo })
      .from(suppliers)
      .where(and(eq(suppliers.tenantId, tenantId), or(ilike(suppliers.name, pattern), ilike(suppliers.contactInfo, pattern))))
      .limit(RESULTS_PER_TYPE),
  ]);

  const results: SearchResultItem[] = [
    ...customerRows.map((r) => toResult('customer', r.id, r.name, r.phone, `/customers/${r.id}`)),
    ...ticketRows.map((r) =>
      toResult(
        'ticket',
        r.id,
        `${r.customerName} — ${r.assetBrand ?? ''} ${r.assetModel ?? ''}`.trim(),
        r.status,
        `/tickets/${r.id}`
      )
    ),
    ...inventoryRows.map((r) => toResult('inventory', r.id, r.name, r.sku, `/inventory/${r.id}`)),
    ...supplierRows.map((r) => toResult('supplier', r.id, r.name, r.contactInfo, `/inventory/suppliers/${r.id}`)),
  ];

  return results;
}

function toResult(
  type: SearchResultType,
  id: string,
  title: string,
  subtitle: string | null,
  href: string
): SearchResultItem {
  return { type, id, title, subtitle: subtitle || null, href };
}
