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

  // Tahap A (go-live gap Tier-1 #2, plan/tahap-a-flow-templates.md) — two new
  // service flow templates, added alongside "Standard Repair" above WITHOUT
  // touching it (its fixed node/transition IDs are hardcoded across several
  // existing tests). Neither is isDefault, so Standard Repair stays the sole
  // default template.
  await tx.insert(flowTemplates).values([
    { id: IDS.flowTemplateDitunggu, tenantId: IDS.tenantMain, name: 'Servis - Ditunggu', domain: 'service', isDefault: false },
    { id: IDS.flowTemplateDisimpan, tenantId: IDS.tenantMain, name: 'Servis - Disimpan', domain: 'service', isDefault: false },
  ]).onConflictDoNothing();

  await tx.insert(flowNodes).values([
    // Ditunggu — 7 nodes. Only Diagnosis carries requiredPermissionId, mirroring
    // Standard Repair's own pattern exactly (no new gating decisions here).
    { id: IDS.nodeDitungguIntake, flowTemplateId: IDS.flowTemplateDitunggu, name: 'Intake', nodeType: 'action', sequenceOrder: 1 },
    { id: IDS.nodeDitungguDiagnosis, flowTemplateId: IDS.flowTemplateDitunggu, name: 'Diagnosis', nodeType: 'action', sequenceOrder: 2, requiredPermissionId: IDS.permTicketDiagnose },
    { id: IDS.nodeDitungguApproval, flowTemplateId: IDS.flowTemplateDitunggu, name: 'Menunggu Persetujuan', nodeType: 'decision', sequenceOrder: 3 },
    { id: IDS.nodeDitungguQcAwal, flowTemplateId: IDS.flowTemplateDitunggu, name: 'QC Awal', nodeType: 'action', sequenceOrder: 4 },
    { id: IDS.nodeDitungguRepair, flowTemplateId: IDS.flowTemplateDitunggu, name: 'Pengerjaan', nodeType: 'action', sequenceOrder: 5 },
    { id: IDS.nodeDitungguQcAkhir, flowTemplateId: IDS.flowTemplateDitunggu, name: 'QC Akhir', nodeType: 'action', sequenceOrder: 6 },
    // No outgoing transitions — terminal node, closes the ticket structurally (see engine.ts).
    { id: IDS.nodeDitungguSelesai, flowTemplateId: IDS.flowTemplateDitunggu, name: 'Selesai', nodeType: 'action', sequenceOrder: 7 },

    // Disimpan — same 7 nodes + "Unit Disimpan" inserted right after Diagnosis
    // (the plan's structural difference: unit ditinggal, tanda-terima dicetak
    // di sini nanti -- pemicu cetak is a separate task).
    { id: IDS.nodeDisimpanIntake, flowTemplateId: IDS.flowTemplateDisimpan, name: 'Intake', nodeType: 'action', sequenceOrder: 1 },
    { id: IDS.nodeDisimpanDiagnosis, flowTemplateId: IDS.flowTemplateDisimpan, name: 'Diagnosis', nodeType: 'action', sequenceOrder: 2, requiredPermissionId: IDS.permTicketDiagnose },
    { id: IDS.nodeDisimpanUnitDisimpan, flowTemplateId: IDS.flowTemplateDisimpan, name: 'Unit Disimpan', nodeType: 'action', sequenceOrder: 3 },
    { id: IDS.nodeDisimpanApproval, flowTemplateId: IDS.flowTemplateDisimpan, name: 'Menunggu Persetujuan', nodeType: 'decision', sequenceOrder: 4 },
    { id: IDS.nodeDisimpanQcAwal, flowTemplateId: IDS.flowTemplateDisimpan, name: 'QC Awal', nodeType: 'action', sequenceOrder: 5 },
    { id: IDS.nodeDisimpanRepair, flowTemplateId: IDS.flowTemplateDisimpan, name: 'Pengerjaan', nodeType: 'action', sequenceOrder: 6 },
    { id: IDS.nodeDisimpanQcAkhir, flowTemplateId: IDS.flowTemplateDisimpan, name: 'QC Akhir', nodeType: 'action', sequenceOrder: 7 },
    { id: IDS.nodeDisimpanSelesai, flowTemplateId: IDS.flowTemplateDisimpan, name: 'Selesai', nodeType: 'action', sequenceOrder: 8 },
  ]).onConflictDoNothing();

  await tx.insert(flowTransitions).values([
    // Ditunggu — linear chain + a shortcut from Approval straight to Selesai
    // (mirrors Standard Repair's transApprovalToCompletion: "ternyata tidak
    // ada kerusakan", close without repair/QC).
    { id: IDS.transDitungguIntakeToDiagnosis, fromNodeId: IDS.nodeDitungguIntake, toNodeId: IDS.nodeDitungguDiagnosis },
    { id: IDS.transDitungguDiagnosisToApproval, fromNodeId: IDS.nodeDitungguDiagnosis, toNodeId: IDS.nodeDitungguApproval },
    { id: IDS.transDitungguApprovalToQcAwal, fromNodeId: IDS.nodeDitungguApproval, toNodeId: IDS.nodeDitungguQcAwal },
    { id: IDS.transDitungguApprovalToSelesai, fromNodeId: IDS.nodeDitungguApproval, toNodeId: IDS.nodeDitungguSelesai },
    { id: IDS.transDitungguQcAwalToRepair, fromNodeId: IDS.nodeDitungguQcAwal, toNodeId: IDS.nodeDitungguRepair },
    { id: IDS.transDitungguRepairToQcAkhir, fromNodeId: IDS.nodeDitungguRepair, toNodeId: IDS.nodeDitungguQcAkhir },
    { id: IDS.transDitungguQcAkhirToSelesai, fromNodeId: IDS.nodeDitungguQcAkhir, toNodeId: IDS.nodeDitungguSelesai },

    // Disimpan — same shape with Unit Disimpan inserted after Diagnosis.
    { id: IDS.transDisimpanIntakeToDiagnosis, fromNodeId: IDS.nodeDisimpanIntake, toNodeId: IDS.nodeDisimpanDiagnosis },
    { id: IDS.transDisimpanDiagnosisToUnitDisimpan, fromNodeId: IDS.nodeDisimpanDiagnosis, toNodeId: IDS.nodeDisimpanUnitDisimpan },
    { id: IDS.transDisimpanUnitDisimpanToApproval, fromNodeId: IDS.nodeDisimpanUnitDisimpan, toNodeId: IDS.nodeDisimpanApproval },
    { id: IDS.transDisimpanApprovalToQcAwal, fromNodeId: IDS.nodeDisimpanApproval, toNodeId: IDS.nodeDisimpanQcAwal },
    { id: IDS.transDisimpanApprovalToSelesai, fromNodeId: IDS.nodeDisimpanApproval, toNodeId: IDS.nodeDisimpanSelesai },
    { id: IDS.transDisimpanQcAwalToRepair, fromNodeId: IDS.nodeDisimpanQcAwal, toNodeId: IDS.nodeDisimpanRepair },
    { id: IDS.transDisimpanRepairToQcAkhir, fromNodeId: IDS.nodeDisimpanRepair, toNodeId: IDS.nodeDisimpanQcAkhir },
    { id: IDS.transDisimpanQcAkhirToSelesai, fromNodeId: IDS.nodeDisimpanQcAkhir, toNodeId: IDS.nodeDisimpanSelesai },
  ]).onConflictDoNothing();
}
