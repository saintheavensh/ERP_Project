import type { Context } from 'hono';
import { and, eq } from 'drizzle-orm';
import { db } from '../db/connection';
import { idempotencyKeys } from '../db/schema';

export interface IdempotencyRef {
  key: string;
  endpoint: string;
}

export interface StoredIdempotentResponse {
  status: number;
  body: unknown;
}

/**
 * Header set on every replayed response so `middleware/audit.ts` can tell a
 * genuine mutation apart from an echo of one that already happened — without
 * this, a replayed "consume" or "checkout" would double-log in the audit
 * trail even though nothing was mutated the second time.
 */
export const IDEMPOTENT_REPLAY_HEADER = 'X-Idempotent-Replay';

/** Returns the stored response, marked so the audit middleware skips it. */
export function replayIdempotentResponse(c: Context, replay: StoredIdempotentResponse) {
  c.header(IDEMPOTENT_REPLAY_HEADER, 'true');
  return c.json(replay.body as any, replay.status as any);
}

/**
 * Cheap pre-check, outside any transaction — skips re-running the business
 * logic entirely on an exact repeat. Scoped by endpoint too: the same key
 * reused against a different route is a client bug, not a legitimate replay.
 */
export async function findIdempotentResponse(
  tenantId: string,
  endpoint: string,
  key: string | undefined
): Promise<StoredIdempotentResponse | null> {
  if (!key) return null;
  const [existing] = await db
    .select({ responseStatus: idempotencyKeys.responseStatus, responseBody: idempotencyKeys.responseBody })
    .from(idempotencyKeys)
    .where(and(
      eq(idempotencyKeys.tenantId, tenantId),
      eq(idempotencyKeys.key, key),
      eq(idempotencyKeys.endpoint, endpoint)
    ));
  return existing ? { status: existing.responseStatus, body: existing.responseBody } : null;
}

/**
 * Record the response as the LAST write inside the caller's own business
 * transaction. If that transaction later fails and rolls back for any
 * reason, this insert rolls back with it — a failed request never burns its
 * key, and the caller's retry (same key) can still succeed. A no-op when no
 * key was supplied (idempotency is opt-in from the client).
 */
export async function recordIdempotentResponse(
  tx: { insert: typeof db.insert },
  tenantId: string,
  idempotency: IdempotencyRef | undefined,
  status: number,
  body: unknown
): Promise<void> {
  if (!idempotency) return;
  await tx.insert(idempotencyKeys).values({
    tenantId,
    key: idempotency.key,
    endpoint: idempotency.endpoint,
    responseStatus: status,
    responseBody: body as any,
  });
}

/**
 * True when `err` is the unique-constraint violation on (tenant_id, key) —
 * the signature of two concurrent requests racing on the same idempotency
 * key. Whichever transaction loses this race gets its business writes rolled
 * back automatically (the throw aborts the whole `db.transaction()` callback)
 * and should replay the winner's now-committed response instead of erroring.
 *
 * Drizzle (via the `postgres` driver used here) wraps the raw driver error in
 * a `DrizzleQueryError`, with the actual Postgres fields one level down on
 * `.cause` — and `postgres`'s own field names (`table_name`/`constraint_name`)
 * differ from `pg`'s (`table`/`constraint`). Checked defensively across both
 * shapes and one level of `.cause` so this doesn't silently stop matching if
 * either driver detail changes.
 */
export function isIdempotencyKeyConflict(err: unknown): boolean {
  for (const candidate of [err, (err as { cause?: unknown } | null)?.cause]) {
    if (!candidate || typeof candidate !== 'object') continue;
    const e = candidate as { code?: string; table?: string; table_name?: string; constraint?: string; constraint_name?: string };
    if (e.code !== '23505') continue;
    const table = e.table ?? e.table_name;
    const constraint = e.constraint ?? e.constraint_name;
    if (table === 'idempotency_keys' || (typeof constraint === 'string' && constraint.includes('idempotency'))) {
      return true;
    }
  }
  return false;
}
