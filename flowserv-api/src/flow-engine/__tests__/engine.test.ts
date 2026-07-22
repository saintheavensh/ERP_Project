import { describe, it, expect } from 'vitest';
import { evaluateTransition } from '../engine';
import type { TransitionFacts } from '../types';

const TEMPLATE_A = 'template-a';
const TEMPLATE_B = 'template-b';
const PERMISSION_APPROVE = 'permission-approve-quote';

function baseFacts(overrides: Partial<TransitionFacts> = {}): TransitionFacts {
  return {
    transitionExists: true,
    ticketFlowTemplateId: TEMPLATE_A,
    targetNode: {
      id: 'node-target',
      flowTemplateId: TEMPLATE_A,
      requiredPermissionId: null,
    },
    rolePermissionIds: [],
    ...overrides,
  };
}

describe('evaluateTransition', () => {
  it('allows a valid transition to a node that requires no permission', () => {
    // Arrange
    const facts = baseFacts();
    // Act
    const result = evaluateTransition(facts);
    // Assert
    expect(result).toEqual({ valid: true });
  });

  it('allows a valid transition when the role has the required permission', () => {
    // Arrange
    const facts = baseFacts({
      targetNode: {
        id: 'node-target',
        flowTemplateId: TEMPLATE_A,
        requiredPermissionId: PERMISSION_APPROVE,
      },
      rolePermissionIds: [PERMISSION_APPROVE],
    });
    // Act
    const result = evaluateTransition(facts);
    // Assert
    expect(result).toEqual({ valid: true });
  });

  it('rejects with PERMISSION_DENIED when the role lacks the required permission', () => {
    // Arrange
    const facts = baseFacts({
      targetNode: {
        id: 'node-target',
        flowTemplateId: TEMPLATE_A,
        requiredPermissionId: PERMISSION_APPROVE,
      },
      rolePermissionIds: [], // role has no permissions at all
    });
    // Act
    const result = evaluateTransition(facts);
    // Assert
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe('PERMISSION_DENIED');
    }
  });

  it('rejects with TRANSITION_NOT_ALLOWED when the flow template has no such rule', () => {
    // Arrange
    const facts = baseFacts({ transitionExists: false });
    // Act
    const result = evaluateTransition(facts);
    // Assert
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe('TRANSITION_NOT_ALLOWED');
    }
  });

  it('rejects with NODE_NOT_FOUND when the target node does not exist', () => {
    // Arrange
    const facts = baseFacts({ targetNode: null });
    // Act
    const result = evaluateTransition(facts);
    // Assert
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe('NODE_NOT_FOUND');
    }
  });

  it('rejects with NODE_WRONG_TEMPLATE when the target node belongs to a different flow template', () => {
    // Arrange — this is the cross-tenant / cross-template guard (RECOVERY-PLAN BUG-02)
    const facts = baseFacts({
      ticketFlowTemplateId: TEMPLATE_A,
      targetNode: {
        id: 'node-target',
        flowTemplateId: TEMPLATE_B,
        requiredPermissionId: null,
      },
    });
    // Act
    const result = evaluateTransition(facts);
    // Assert
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe('NODE_WRONG_TEMPLATE');
    }
  });

  it('checks NODE_WRONG_TEMPLATE before TRANSITION_NOT_ALLOWED', () => {
    // Arrange — a node from the wrong template also won't have a matching
    // transition row; the wrong-template reason should surface, not a generic one
    const facts = baseFacts({
      transitionExists: false,
      ticketFlowTemplateId: TEMPLATE_A,
      targetNode: {
        id: 'node-target',
        flowTemplateId: TEMPLATE_B,
        requiredPermissionId: null,
      },
    });
    // Act
    const result = evaluateTransition(facts);
    // Assert
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe('NODE_WRONG_TEMPLATE');
    }
  });
});

/**
 * These model the exact shape seeded by db/seed-flows.ts ("Standard Repair"),
 * so a change to the seed data or the decision logic that breaks the real
 * flow shows up here, not just in the abstract cases above.
 *
 *   Intake -> Diagnosis -> Waiting Approval -> Repair -> Completion
 *                       \_______________________/
 *                    (Diagnosis and Waiting Approval both skip to Repair;
 *                     Waiting Approval can also skip straight to Completion)
 */
describe('evaluateTransition — seeded "Standard Repair" shape', () => {
  const STANDARD_REPAIR = 'standard-repair-template';
  const OTHER_TEMPLATE = 'some-other-tenant-template';

  const nodes = {
    intake: { id: 'node-intake', flowTemplateId: STANDARD_REPAIR, requiredPermissionId: null },
    diagnosis: { id: 'node-diagnosis', flowTemplateId: STANDARD_REPAIR, requiredPermissionId: null },
    waitingApproval: { id: 'node-waiting-approval', flowTemplateId: STANDARD_REPAIR, requiredPermissionId: null },
    repair: { id: 'node-repair', flowTemplateId: STANDARD_REPAIR, requiredPermissionId: null },
    completion: { id: 'node-completion', flowTemplateId: STANDARD_REPAIR, requiredPermissionId: null },
  };

  const seededTransitions: [keyof typeof nodes, keyof typeof nodes][] = [
    ['intake', 'diagnosis'],
    ['diagnosis', 'waitingApproval'],
    ['diagnosis', 'repair'],
    ['waitingApproval', 'repair'],
    ['waitingApproval', 'completion'],
    ['repair', 'completion'],
  ];

  function transitionExists(from: keyof typeof nodes, to: keyof typeof nodes): boolean {
    return seededTransitions.some(([f, t]) => f === from && t === to);
  }

  it('allows Intake -> Diagnosis, the normal first move', () => {
    // Act
    const result = evaluateTransition({
      transitionExists: transitionExists('intake', 'diagnosis'),
      ticketFlowTemplateId: STANDARD_REPAIR,
      targetNode: nodes.diagnosis,
      rolePermissionIds: [],
    });
    // Assert
    expect(result).toEqual({ valid: true });
  });

  it('rejects Intake -> Completion — skipping the entire repair process', () => {
    // Arrange — this is the exact case BUG-01 let through: with the bug, this
    // request returned 200 and the ticket jumped straight to closed.
    // Act
    const result = evaluateTransition({
      transitionExists: transitionExists('intake', 'completion'),
      ticketFlowTemplateId: STANDARD_REPAIR,
      targetNode: nodes.completion,
      rolePermissionIds: [],
    });
    // Assert
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe('TRANSITION_NOT_ALLOWED');
    }
  });

  it('rejects a target node belonging to a different tenant\'s flow template', () => {
    // Arrange — same idea as BUG-02: a node UUID from another tenant's template
    const crossTenantNode = { id: 'node-other', flowTemplateId: OTHER_TEMPLATE, requiredPermissionId: null };
    // Act
    const result = evaluateTransition({
      transitionExists: false, // a cross-tenant node also won't have a matching transition row
      ticketFlowTemplateId: STANDARD_REPAIR,
      targetNode: crossTenantNode,
      rolePermissionIds: [],
    });
    // Assert
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.code).toBe('NODE_WRONG_TEMPLATE');
    }
  });

  it('Completion has no outgoing transitions — it is a terminal node', () => {
    const outgoingFromCompletion = seededTransitions.filter(([from]) => from === 'completion');
    expect(outgoingFromCompletion).toHaveLength(0);
  });
});
