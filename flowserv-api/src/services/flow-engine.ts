import { db } from '../db/connection';
import { flowTransitions, flowNodes, flowTemplates, rolePermissions, serviceTickets, ticketStageHistory } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { emitEvent, AppEvent } from './event-bus';

/**
 * All the facts the decision needs, already fetched.
 * Keeping this separate from the DB lets us test every rule with no database.
 */
export type TransitionFacts = {
  transitionExists: boolean;
  ticketFlowTemplateId: string;
  targetNode: {
    id: string;
    flowTemplateId: string;
    requiredPermissionId: string | null;
  } | null;
  rolePermissionIds: string[];
};

export type TransitionResult =
  | { valid: true }
  | { valid: false; code: TransitionErrorCode; reason: string };

export type TransitionErrorCode =
  | 'NODE_NOT_FOUND'
  | 'NODE_WRONG_TEMPLATE'
  | 'TRANSITION_NOT_ALLOWED'
  | 'PERMISSION_DENIED';

/**
 * Pure decision — no database, no HTTP. This is the piece we test.
 */
export function evaluateTransition(facts: TransitionFacts): TransitionResult {
  if (!facts.targetNode) {
    return {
      valid: false,
      code: 'NODE_NOT_FOUND',
      reason: 'Target node not found.',
    };
  }

  // A ticket may only move between nodes of its OWN flow template.
  // Without this check any node UUID in the database is reachable,
  // including another tenant's.
  if (facts.targetNode.flowTemplateId !== facts.ticketFlowTemplateId) {
    return {
      valid: false,
      code: 'NODE_WRONG_TEMPLATE',
      reason: 'Target node belongs to a different flow template.',
    };
  }

  if (!facts.transitionExists) {
    return {
      valid: false,
      code: 'TRANSITION_NOT_ALLOWED',
      reason: 'This transition is not allowed by the flow template.',
    };
  }

  if (facts.targetNode.requiredPermissionId) {
    if (!facts.rolePermissionIds.includes(facts.targetNode.requiredPermissionId)) {
      return {
        valid: false,
        code: 'PERMISSION_DENIED',
        reason: 'Your role lacks the permission required for this stage.',
      };
    }
  }

  return { valid: true };
}

export class FlowEngine {

  /**
   * Validates if a transition is allowed for a given ticket and user role.
   * Fetches the facts (tenant-scoped) and delegates the decision to evaluateTransition.
   */
  static async validateTransition(
    tenantId: string,
    ticketFlowTemplateId: string,
    currentNodeId: string,
    targetNodeId: string,
    roleId: string
  ): Promise<TransitionResult> {

    // 1. Does this transition rule exist? Scoped to this tenant via the target
    // node's flow template, so a rule belonging to another tenant can't match.
    const transitionRows = await db
      .select({ id: flowTransitions.id })
      .from(flowTransitions)
      .innerJoin(flowNodes, eq(flowTransitions.toNodeId, flowNodes.id))
      .innerJoin(flowTemplates, eq(flowNodes.flowTemplateId, flowTemplates.id))
      .where(and(
        eq(flowTransitions.fromNodeId, currentNodeId),
        eq(flowTransitions.toNodeId, targetNodeId),
        eq(flowTemplates.tenantId, tenantId)
      ));

    // 2. Fetch the target node, scoped to this tenant. A node belonging to
    // another tenant simply won't be found here.
    const targetNodeRows = await db
      .select({
        id: flowNodes.id,
        flowTemplateId: flowNodes.flowTemplateId,
        requiredPermissionId: flowNodes.requiredPermissionId,
      })
      .from(flowNodes)
      .innerJoin(flowTemplates, eq(flowNodes.flowTemplateId, flowTemplates.id))
      .where(and(
        eq(flowNodes.id, targetNodeId),
        eq(flowTemplates.tenantId, tenantId)
      ));

    // 3. The role's granted permission ids. 'no-role' is not a UUID (it's the
    // JWT fallback for a user with no role assignment), so querying it would
    // throw a Postgres type error — skip the query and treat it as no grants.
    const grantedPermissions = roleId === 'no-role'
      ? []
      : await db
          .select({ permissionId: rolePermissions.permissionId })
          .from(rolePermissions)
          .where(eq(rolePermissions.roleId, roleId));

    return evaluateTransition({
      transitionExists: transitionRows.length > 0,
      ticketFlowTemplateId,
      targetNode: targetNodeRows[0] ?? null,
      rolePermissionIds: grantedPermissions.map(p => p.permissionId),
    });
  }

  /**
   * Validates, then executes, a transition: updates the ticket's current node,
   * records the stage history entry, and emits TICKET_STAGE_CHANGED — all inside
   * one transaction. Returns the same TransitionResult shape as validateTransition
   * so the route can map { code } to the right HTTP status without a try/catch
   * for the validation failure case.
   */
  static async executeTransition(
    tenantId: string,
    ticketFlowTemplateId: string,
    ticketId: string,
    currentNodeId: string,
    targetNodeId: string,
    roleId: string,
    userId: string,
    notes?: string | null
  ): Promise<TransitionResult> {
    const result = await this.validateTransition(
      tenantId, ticketFlowTemplateId, currentNodeId, targetNodeId, roleId
    );
    if (!result.valid) {
      return result;
    }

    await db.transaction(async (tx) => {
      await tx.update(serviceTickets)
        .set({ currentNodeId: targetNodeId })
        .where(eq(serviceTickets.id, ticketId));

      await tx.insert(ticketStageHistory).values({
        ticketId,
        nodeId: targetNodeId,
        actorId: userId,
        notes: notes || null,
      });
    });

    // Emit event for other modules (e.g. Phase 4.5 ledger posting)
    emitEvent(AppEvent.TICKET_STAGE_CHANGED, {
      ticketId,
      fromNodeId: currentNodeId,
      toNodeId: targetNodeId,
      userId,
      timestamp: new Date().toISOString()
    });

    return { valid: true };
  }
}
