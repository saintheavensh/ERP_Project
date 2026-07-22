import { flowTemplates, flowNodes, flowTransitions } from '../schema';
import { IDS } from './ids';
import type { SeedTx } from './types';

export async function seedFlows(tx: SeedTx): Promise<void> {
  // Same "Standard Repair" flow as the old seed-flows.ts, now with fixed IDs
  // so re-running this doesn't create a second template (the old script's bug).
  await tx.insert(flowTemplates).values({
    id: IDS.flowTemplate,
    tenantId: IDS.tenantMain,
    name: 'Standard Repair',
    domain: 'service',
    isDefault: true,
  }).onConflictDoNothing();

  await tx.insert(flowNodes).values([
    { id: IDS.nodeIntake, flowTemplateId: IDS.flowTemplate, name: 'Intake', nodeType: 'action', sequenceOrder: 1 },
    // H12 — first node to actually use requiredPermissionId, so
    // evaluateTransition's PERMISSION_DENIED branch (flow-engine/engine.ts)
    // finally runs against real data instead of only unit tests.
    { id: IDS.nodeDiagnosis, flowTemplateId: IDS.flowTemplate, name: 'Diagnosis', nodeType: 'action', sequenceOrder: 2, requiredPermissionId: IDS.permTicketDiagnose },
    { id: IDS.nodeApproval, flowTemplateId: IDS.flowTemplate, name: 'Waiting Approval', nodeType: 'decision', sequenceOrder: 3 },
    { id: IDS.nodeRepair, flowTemplateId: IDS.flowTemplate, name: 'Repair', nodeType: 'action', sequenceOrder: 4 },
    // No outgoing transitions below — the flow engine detects a terminal node
    // structurally (no rows in flow_transitions with this as fromNodeId), and
    // that is what closes a ticket. Keep it that way; do not name-match "Completion".
    { id: IDS.nodeCompletion, flowTemplateId: IDS.flowTemplate, name: 'Completion', nodeType: 'action', sequenceOrder: 5 },
  ]).onConflictDoNothing();

  await tx.insert(flowTransitions).values([
    { id: IDS.transIntakeToDiagnosis, fromNodeId: IDS.nodeIntake, toNodeId: IDS.nodeDiagnosis },
    { id: IDS.transDiagnosisToApproval, fromNodeId: IDS.nodeDiagnosis, toNodeId: IDS.nodeApproval },
    { id: IDS.transDiagnosisToRepair, fromNodeId: IDS.nodeDiagnosis, toNodeId: IDS.nodeRepair },
    { id: IDS.transApprovalToRepair, fromNodeId: IDS.nodeApproval, toNodeId: IDS.nodeRepair },
    { id: IDS.transApprovalToCompletion, fromNodeId: IDS.nodeApproval, toNodeId: IDS.nodeCompletion },
    { id: IDS.transRepairToCompletion, fromNodeId: IDS.nodeRepair, toNodeId: IDS.nodeCompletion },
  ]).onConflictDoNothing();
}
