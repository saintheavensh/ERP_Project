import { db } from './src/db/connection';
import { branches, tenants } from './src/db/schema';
import { eq } from 'drizzle-orm';

async function createDummyBranch() {
  try {
    // Get the first tenant
    const allTenants = await db.query.tenants.findMany();
    if (allTenants.length === 0) {
      console.log('No tenant found. Cannot create branch.');
      process.exit(1);
    }
    const tenantId = allTenants[0].id;

    // Check if branch exists
    const existing = await db.query.branches.findMany({
      where: eq(branches.tenantId, tenantId)
    });

    if (existing.length === 0) {
      await db.insert(branches).values({
        tenantId,
        name: 'Kantor Pusat / Gudang Utama',
        code: 'HQ-001',
        address: 'Jl. Sudirman No. 1'
      });
      console.log('Successfully created dummy branch: HQ-001');
    } else {
      console.log('Branch already exists, no need to create dummy.');
    }
  } catch (err) {
    console.error('Error creating dummy branch:', err);
  }
  process.exit(0);
}

createDummyBranch();
