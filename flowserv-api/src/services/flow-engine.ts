import { db } from '../db/connection';
import { flowTransitions, flowNodes, rolePermissions } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { emitEvent, AppEvent } from './event-bus';

export class FlowEngine {
  
  /**
   * Validates if a transition is allowed for a given ticket and user role.
   */
  static async validateTransition(
    currentNodeId: string, 
    targetNodeId: string, 
    roleId: string
  ): Promise<{ valid: boolean; reason?: string }> {
    
    // 1. Check if the transition exists in the flow template rules
    const transitions = await db
      .select()
      .from(flowTransitions)
      .where(and(
        eq(flowTransitions.fromNodeId, currentNodeId),
        eq(flowTransitions.toNodeId, targetNodeId)
      ));
      
    if (transitions.length === 0) {
      return { valid: false, reason: 'Invalid transition rule in Flow Template.' };
    }

    // 2. Check if user has permission to enter the target node
    const targetNodes = await db
      .select()
      .from(flowNodes)
      .where(eq(flowNodes.id, targetNodeId));
      
    const targetNode = targetNodes[0];
    if (!targetNode) {
      return { valid: false, reason: 'Target node not found.' };
    }

    // If target node requires a specific permission, check if user's role has it
    if (targetNode.requiredPermissionId) {
      if (roleId === 'no-role') {
         return { valid: false, reason: 'Unauthorized. Role lacks required permission.' };
      }

      // Check role permissions table
      const permissions = await db
        .select()
        .from(rolePermissions)
        .where(and(
          eq(rolePermissions.roleId, roleId),
          eq(rolePermissions.permissionId, targetNode.requiredPermissionId)
        ));
        
      if (permissions.length === 0) {
        // Special case: Super Admin might have hardcoded bypass, but for pure RBAC we rely on DB.
        // Let's assume the DB seeded permissions correctly. 
        // If not, we return false.
        // For development/MVP let's just bypass if it's the super admin role.
        // In a real app we'd fetch the role name and check if it's 'Super Admin'
        return { valid: false, reason: 'Unauthorized. Role lacks required permission.' };
      }
    }

    return { valid: true };
  }

  /**
   * Executes a transition. In Phase 3, this will write to ServiceTicket table and StageHistory.
   */
  static async executeTransition(
    ticketId: string,
    currentNodeId: string, 
    targetNodeId: string, 
    roleId: string,
    userId: string
  ) {
    const check = await this.validateTransition(currentNodeId, targetNodeId, roleId);
    if (!check.valid) {
      throw new Error(check.reason);
    }

    // Phase 3: DB transaction to update ticket stage & insert history
    
    // Emit event for other modules
    emitEvent(AppEvent.TICKET_STAGE_CHANGED, {
      ticketId,
      fromNodeId: currentNodeId,
      toNodeId: targetNodeId,
      userId,
      timestamp: new Date().toISOString()
    });
    
    return true;
  }
}
