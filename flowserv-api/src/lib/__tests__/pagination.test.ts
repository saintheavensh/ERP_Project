import { describe, it, expect } from 'vitest';
import { PgDialect } from 'drizzle-orm/pg-core';
import { serviceTickets } from '../../db/schema';
import { encodeCursor, decodeCursor, parseLimit, buildPage, cursorCondition, orderByCursor, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../pagination';

describe('pagination: encodeCursor / decodeCursor', () => {
  it('round-trips a payload', () => {
    const payload = { createdAt: '2026-07-21T10:00:00.000Z', id: 'abc-123' };
    expect(decodeCursor(encodeCursor(payload))).toEqual(payload);
  });

  it('returns null for garbage input instead of throwing', () => {
    expect(decodeCursor('not-base64-json')).toBeNull();
    expect(decodeCursor(Buffer.from('{"foo":1}').toString('base64'))).toBeNull();
    expect(decodeCursor(Buffer.from(JSON.stringify({ createdAt: 'not-a-date', id: 'x' })).toString('base64'))).toBeNull();
  });
});

describe('pagination: parseLimit', () => {
  it('falls back to the default for missing/invalid input', () => {
    expect(parseLimit(undefined)).toBe(DEFAULT_PAGE_SIZE);
    expect(parseLimit('not-a-number')).toBe(DEFAULT_PAGE_SIZE);
    expect(parseLimit('0')).toBe(DEFAULT_PAGE_SIZE);
    expect(parseLimit('-5')).toBe(DEFAULT_PAGE_SIZE);
  });

  it('caps at MAX_PAGE_SIZE', () => {
    expect(parseLimit('99999')).toBe(MAX_PAGE_SIZE);
  });

  it('accepts a valid explicit limit', () => {
    expect(parseLimit('10')).toBe(10);
  });
});

describe('pagination: buildPage', () => {
  const row = (createdAt: string, id: string) => ({ createdAt, id });

  it('reports hasMore=false and no cursor when everything fits on one page', () => {
    const rows = [row('2026-07-21T10:00:02Z', 'c'), row('2026-07-21T10:00:01Z', 'b'), row('2026-07-21T10:00:00Z', 'a')];
    const result = buildPage(rows, 10);
    expect(result.page).toHaveLength(3);
    expect(result.hasMore).toBe(false);
    expect(result.nextCursor).toBeUndefined();
  });

  it('trims to `limit` and derives the cursor from the last row on the page, not the fetched extra row', () => {
    // Simulates fetching limit+1=3 rows for a limit of 2.
    const rows = [row('2026-07-21T10:00:02Z', 'c'), row('2026-07-21T10:00:01Z', 'b'), row('2026-07-21T10:00:00Z', 'a')];
    const result = buildPage(rows, 2);
    expect(result.page).toHaveLength(2);
    expect(result.hasMore).toBe(true);
    expect(result.nextCursor).toBe(encodeCursor({ createdAt: new Date('2026-07-21T10:00:01Z').toISOString(), id: 'b' }));
  });

  it('pages through 150 synthetic rows with no duplicates and no gaps', () => {
    // 150 rows, all distinct timestamps, newest first — the "walk every page" simulation.
    const all = Array.from({ length: 150 }, (_, i) =>
      row(new Date(2026, 6, 21, 0, 0, 150 - i).toISOString(), `id-${String(150 - i).padStart(3, '0')}`)
    );
    const pageSize = 20;
    const seen: string[] = [];
    let offset = 0;
    while (offset < all.length) {
      const window = all.slice(offset, offset + pageSize + 1); // simulate the "fetch limit+1" DB call
      const { page, hasMore } = buildPage(window, pageSize);
      seen.push(...page.map((r) => r.id));
      offset += page.length;
      if (!hasMore) break;
    }
    expect(seen).toHaveLength(150);
    expect(new Set(seen).size).toBe(150); // no duplicates
    expect(seen).toEqual(all.map((r) => r.id)); // no gaps, correct order
  });

  it('two rows sharing a createdAt still produce a strict, gap-free order via the id tiebreak', () => {
    const tied = '2026-07-21T10:00:00.000Z';
    const rows = [
      row(tied, 'id-c'),
      row(tied, 'id-b'),
      row(tied, 'id-a'),
      row('2026-07-21T09:59:59.000Z', 'id-z'),
    ];
    // Page size 2: page 1 = [id-c, id-b], cursor should point at id-b (last row on the page).
    const page1 = buildPage(rows.slice(0, 3), 2);
    expect(page1.page.map((r) => r.id)).toEqual(['id-c', 'id-b']);
    expect(page1.hasMore).toBe(true);
    expect(page1.nextCursor).toBe(encodeCursor({ createdAt: tied, id: 'id-b' }));
  });
});

// Regression guard for a real bug found in live testing: `timestamptz` has
// microsecond precision, but the cursor (built from a JS Date) can only carry
// milliseconds. A seed script's single `now()` call gives two rows the exact
// same microsecond-precision createdAt — without truncating consistently on
// both sides, cursorCondition's `eq` branch silently failed to match and the
// second row vanished from every page. No live DB needed: PgDialect renders
// the SQL text the same way a real query would, without connecting to one.
describe('pagination: cursor truncates to millisecond precision consistently', () => {
  const dialect = new PgDialect();

  it('orderByCursor truncates createdAt to milliseconds', () => {
    const [createdAtOrder] = orderByCursor(serviceTickets.createdAt, serviceTickets.id);
    const { sql } = dialect.sqlToQuery(createdAtOrder);
    expect(sql).toContain("date_trunc('milliseconds'");
  });

  it('cursorCondition truncates createdAt to milliseconds on both branches', () => {
    const condition = cursorCondition(serviceTickets.createdAt, serviceTickets.id, {
      createdAt: '2026-07-21T10:00:00.000Z',
      id: 'abc-123',
    });
    const { sql } = dialect.sqlToQuery(condition);
    // Both the `<` branch and the `=` branch must truncate — a fix that only
    // truncates one would still drift.
    expect(sql.match(/date_trunc\('milliseconds'/g)?.length).toBe(2);
  });
});
