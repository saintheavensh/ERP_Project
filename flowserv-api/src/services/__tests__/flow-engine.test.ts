import { describe, it, expect } from 'vitest';
import { evaluateTransition, type TransitionFacts } from '../flow-engine';

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
