import { db } from './connection';
import { tenants, flowTemplates, flowNodes, flowTransitions } from './schema';
import * as dotenv from 'dotenv';

dotenv.config();

async function runSeed(): Promise<void> {
  console.log('🌱 Starting flow templates seeding...');

  try {
    const tenantList = await db.select().from(tenants).limit(1);
    if (tenantList.length === 0) {
      throw new Error('No tenant found to associate flows with.');
    }
    const tenantId = tenantList[0].id;

    // 1. Create Template
    const [template] = await db.insert(flowTemplates).values({
      tenantId,
      name: 'Standard Repair',
      domain: 'service',
      isDefault: true
    }).returning();

    console.log(`✅ Flow Template created: ${template.name}`);

    // 2. Create Nodes
    const [intakeNode] = await db.insert(flowNodes).values({
      flowTemplateId: template.id,
      name: 'Intake',
      nodeType: 'action',
      sequenceOrder: 1
    }).returning();

    const [diagnosisNode] = await db.insert(flowNodes).values({
      flowTemplateId: template.id,
      name: 'Diagnosis',
      nodeType: 'action',
      sequenceOrder: 2
    }).returning();

    const [approvalNode] = await db.insert(flowNodes).values({
      flowTemplateId: template.id,
      name: 'Waiting Approval',
      nodeType: 'decision',
      sequenceOrder: 3
    }).returning();

    const [repairNode] = await db.insert(flowNodes).values({
      flowTemplateId: template.id,
      name: 'Repair',
      nodeType: 'action',
      sequenceOrder: 4
    }).returning();

    const [completionNode] = await db.insert(flowNodes).values({
      flowTemplateId: template.id,
      name: 'Completion',
      nodeType: 'action',
      sequenceOrder: 5
    }).returning();

    console.log(`✅ Flow Nodes created`);

    // 3. Create Transitions
    await db.insert(flowTransitions).values([
      { fromNodeId: intakeNode.id, toNodeId: diagnosisNode.id },
      
      { fromNodeId: diagnosisNode.id, toNodeId: approvalNode.id },
      { fromNodeId: diagnosisNode.id, toNodeId: repairNode.id },
      
      { fromNodeId: approvalNode.id, toNodeId: repairNode.id },
      { fromNodeId: approvalNode.id, toNodeId: completionNode.id },
      
      { fromNodeId: repairNode.id, toNodeId: completionNode.id }
    ]);

    console.log(`✅ Flow Transitions created`);
    console.log('🎉 Flow Seeding completed successfully!');
  } catch (error: unknown) {
    console.error('❌ Seeding failed:', error instanceof Error ? error.message : error);
  } finally {
    process.exit(0);
  }
}

runSeed().catch((error: unknown) => {
  console.error('Unhandled error during seeding:', error);
  process.exit(1);
});
