import type { Context, MiddlewareHandler } from 'hono';
import { getConnInfo } from '@hono/node-server/conninfo';
import { db } from '../db/connection';
import { auditLogs } from '../db/schema';
import { getAuthContext } from './auth';
import { IDEMPOTENT_REPLAY_HEADER } from '../lib/idempotency';

export interface AuditOptions {
  /** "<entity>.<verb>", e.g. "ticket.transition" — matches the vocabulary already in the schema comments. */
  action: string;
  /** "service_ticket", "inventory_item", etc. */
  entityType: string;
  /** Hono param name holding the entity id, e.g. 'id'. Omit for a create route where the id only exists in the response. */
  entityIdParam?: string;
  /**
   * Explicit allowlist of request-body fields to record. Never log a body
   * wholesale — auth routes carry passwords, and even on business routes an
   * allowlist keeps `changes` meaningful instead of a full-object dump.
   */
  bodyFields?: string[];
  /** Explicit allowlist of response-body fields to record (e.g. a server-generated id or computed total). */
  responseFields?: string[];
}

/**
 * Runs AFTER the handler and records ONLY on success — a mutation that threw
 * or returned an error status never reaches the insert below, so the log
 * can't claim something happened that actually rolled back.
 */
export const auditMiddleware = (opts: AuditOptions): MiddlewareHandler => async (c, next) => {
  await next();

  if (!c.res || c.res.status >= 400) return;

  // H13 — a replayed idempotent response isn't a new mutation; logging it
  // would make the audit trail claim the action happened twice.
  if (c.res.headers.get(IDEMPOTENT_REPLAY_HEADER) === 'true') return;

  const { tenantId, userId } = getAuthContext(c);

  let entityId: string | null = opts.entityIdParam ? c.req.param(opts.entityIdParam) ?? null : null;
  let changes: Record<string, unknown> | undefined;

  if (opts.bodyFields && opts.bodyFields.length > 0) {
    try {
      const body = c.req.valid('json' as never) as Record<string, unknown> | undefined;
      if (body) {
        changes = {};
        for (const field of opts.bodyFields) {
          if (field in body) changes[field] = body[field];
        }
      }
    } catch {
      // Route has no validated JSON body (e.g. a DELETE with no payload) — nothing to record.
    }
  }

  if (!entityId || (opts.responseFields && opts.responseFields.length > 0)) {
    try {
      const json = (await c.res.clone().json()) as { data?: Record<string, unknown> | null };
      const responseData = json?.data;
      if (responseData && typeof responseData === 'object') {
        if (!entityId && 'id' in responseData && typeof (responseData as any).id === 'string') {
          entityId = (responseData as any).id;
        }
        if (opts.responseFields) {
          changes = changes ?? {};
          for (const field of opts.responseFields) {
            if (field in responseData) changes[field] = (responseData as any)[field];
          }
        }
      }
    } catch {
      // Not a JSON body (shouldn't happen given the standard envelope) — skip.
    }
  }

  try {
    const connInfo = getConnInfoSafely(c);
    await db.insert(auditLogs).values({
      tenantId,
      actorId: userId,
      action: opts.action,
      entityType: opts.entityType,
      entityId,
      changes: changes && Object.keys(changes).length > 0 ? changes : null,
      ipAddress: c.req.header('x-forwarded-for') ?? connInfo ?? null,
    });
  } catch (err) {
    // Audit logging must never break a response that already succeeded.
    console.error('Failed to write audit log:', err);
  }
};

function getConnInfoSafely(c: Context): string | null {
  try {
    return getConnInfo(c).remote.address ?? null;
  } catch {
    return null;
  }
}
