import { db } from './connection';
import { tenants, branches, users, roles } from './schema';
import * as dotenv from 'dotenv';
import crypto from 'node:crypto';
import { sql } from 'drizzle-orm';

dotenv.config();

function generatePasswordHash(password: string): string {
  // Simulating bcrypt hash for seed data, in production use bcryptjs or argon2
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function runSeed(): Promise<void> {
  console.log('🌱 Starting database seeding...');

  try {
    // 1. Seed Tenant
    const insertedTenants = await db.insert(tenants).values({
      name: 'Demo Service Center',
      subscriptionTier: 'pro',
      status: 'active',
      settings: { simplifiedFinanceMode: true }
    }).returning({ id: tenants.id });
    
    const tenantId: string = insertedTenants[0]?.id as string;
    console.log(`✅ Tenant created: ${tenantId}`);

    // 2. Seed Branch
    const insertedBranches = await db.insert(branches).values({
      tenantId,
      name: 'Pusat (Headquarter)',
      address: 'Jl. Sudirman No. 1, Jakarta'
    }).returning({ id: branches.id });

    const branchId: string = insertedBranches[0]?.id as string;
    console.log(`✅ Branch created: ${branchId}`);

    // 3. Seed Roles
    const rolesData = [
      { tenantId, name: 'Super Admin', isCustom: false },
      { tenantId, name: 'Manager', isCustom: false },
      { tenantId, name: 'Technician', isCustom: false },
      { tenantId, name: 'Cashier', isCustom: false }
    ];
    
    await db.insert(roles).values(rolesData);
    console.log('✅ Roles created');

    // 4. Seed User
    await db.insert(users).values({
      tenantId,
      name: 'System Admin',
      email: 'admin@demo.com',
      passwordHash: generatePasswordHash('admin123'),
      status: 'active'
    });
    console.log('✅ User created (admin@demo.com / admin123)');

    console.log('🎉 Seeding completed successfully!');
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
