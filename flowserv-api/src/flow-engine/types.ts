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
