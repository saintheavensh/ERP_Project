import { and, desc, eq, lt, or, sql, type SQL } from 'drizzle-orm';
import type { PgColumn } from 'drizzle-orm/pg-core';

// H13 — cursor-based list pagination (coding-guidelines.md §3.5). Cursor is
// always (createdAt, id), never createdAt alone: two rows sharing a
// timestamp would otherwise be skipped or repeated across pages depending
// on which side of the page boundary they land on.
export interface CursorPayload {
  createdAt: string; // ISO 8601
  id: string;
}

export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 200;

export function encodeCursor(payload: CursorPayload): string {
  return Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64');
}

/** Returns null on any malformed input — callers should treat that as "ignore the cursor", not throw. */
export function decodeCursor(cursor: string): CursorPayload | null {
  try {
    const parsed = JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'));
    if (
      parsed &&
      typeof parsed === 'object' &&
      typeof parsed.createdAt === 'string' &&
      typeof parsed.id === 'string' &&
      !Number.isNaN(Date.parse(parsed.createdAt))
    ) {
      return { createdAt: parsed.createdAt, id: parsed.id };
    }
    return null;
  } catch {
    return null;
  }
}

/** `?limit=` query param → a bounded page size. Never trusts the client past MAX_PAGE_SIZE. */
export function parseLimit(raw: string | undefined, fallback = DEFAULT_PAGE_SIZE): number {
  const n = raw ? parseInt(raw, 10) : NaN;
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(n, MAX_PAGE_SIZE);
}

/**
 * `timestamptz` in Postgres carries microsecond precision; the cursor (built
 * from a JS `Date`, via `toISOString()`) can only carry milliseconds. Without
 * truncating, two rows minted in the same INSERT (identical down to the
 * microsecond — which is exactly what a seed script's single `now()` call
 * produces) compare as *not equal* against a millisecond-precision cursor
 * value, so `cursorCondition`'s `eq` branch silently fails and the row is
 * skipped — a real gap, not a hypothetical one. Truncating consistently here
 * AND in `orderByCursor` keeps the fetch order and the cursor comparison
 * defined over the exact same values.
 */
function truncatedToMillis(col: PgColumn): SQL {
  return sql`date_trunc('milliseconds', ${col})`;
}

/** `.orderBy(...)` fragments matching what `cursorCondition` compares against. */
export function orderByCursor(createdAtCol: PgColumn, idCol: PgColumn): SQL[] {
  return [desc(truncatedToMillis(createdAtCol)), desc(idCol)];
}

/**
 * WHERE fragment for "strictly after this cursor" under a
 * (createdAt DESC, id DESC) sort. The id tiebreak doesn't need to mean
 * anything domain-wise — it only needs to match the ORDER BY direction used
 * alongside it, giving every row a strict total order so paging never skips
 * or repeats a row that shares a timestamp with its neighbor.
 */
export function cursorCondition(createdAtCol: PgColumn, idCol: PgColumn, cursor: CursorPayload): SQL {
  // Interpolated as an ISO string, not a raw JS Date: a bare Date inside a
  // sql`` template (comparing against a non-column expression, so Drizzle
  // has no column type to serialize it through) gets stringified via
  // Date.toString() by the driver — "Wed Jul 22 2026 04:06:42 GMT+0700
  // (Western Indonesia Time)" — which Postgres then rejects outright:
  // `time zone "gmt+0700" not recognized`. ISO 8601 is unambiguous.
  const cursorIso = new Date(cursor.createdAt).toISOString();
  const truncated = truncatedToMillis(createdAtCol);
  return or(
    sql`${truncated} < ${cursorIso}`,
    and(sql`${truncated} = ${cursorIso}`, lt(idCol, cursor.id))
  ) as SQL;
}

/**
 * Callers fetch `limit + 1` rows (ordered by createdAt DESC, id DESC) and
 * hand them here. Pure — no DB — so the "150 tickets, no dupes, no gaps"
 * and "two rows sharing a createdAt" scenarios can be tested without a
 * database.
 */
export function buildPage<T extends { createdAt: Date | string; id: string }>(
  rows: T[],
  limit: number
): { page: T[]; hasMore: boolean; nextCursor: string | undefined } {
  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const last = page[page.length - 1];
  const nextCursor = hasMore && last
    ? encodeCursor({ createdAt: new Date(last.createdAt).toISOString(), id: last.id })
    : undefined;
  return { page, hasMore, nextCursor };
}
