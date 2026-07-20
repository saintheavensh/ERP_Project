import { db } from './connection';
import { tenants, branches, users, roles, userRoleAssignments } from './schema';
import * as dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { eq, and } from 'drizzle-orm';

dotenv.config();

async function generatePasswordHash(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function runSeed(): Promise<void> {
  console.log('🌱 Starting database seeding...');

  try {
    // 1. Find-or-create the demo tenant. Without this, re-running the seed
    // silently creates a second tenant and every later lookup becomes ambiguous.
    let [tenant] = await db.select().from(tenants).where(eq(tenants.name, 'Demo Service Center'));

    if (!tenant) {
      [tenant] = await db.insert(tenants).values({
        name: 'Demo Service Center',
        subscriptionTier: 'pro',
        status: 'active',
        settings: { simplifiedFinanceMode: true }
      }).returning();
      console.log(`✅ Tenant created: ${tenant.id}`);
    } else {
      console.log(`↩️  Tenant already exists, reusing: ${tenant.id}`);
    }

    const tenantId = tenant.id;

    // 2. Find-or-create the branch
    let [branch] = await db.select().from(branches).where(
      and(eq(branches.tenantId, tenantId), eq(branches.name, 'Pusat (Headquarter)'))
    );

    if (!branch) {
      [branch] = await db.insert(branches).values({
        tenantId,
        name: 'Pusat (Headquarter)',
        address: 'Jl. Sudirman No. 1, Jakarta'
      }).returning();
      console.log(`✅ Branch created: ${branch.id}`);
    } else {
      console.log(`↩️  Branch already exists, reusing: ${branch.id}`);
    }

    // 3. Find-or-create each role
    const roleNames = ['Super Admin', 'Manager', 'Technician', 'Cashier'];
    const roleIds: Record<string, string> = {};

    for (const name of roleNames) {
      let [role] = await db.select().from(roles).where(
        and(eq(roles.tenantId, tenantId), eq(roles.name, name))
      );

      if (!role) {
        [role] = await db.insert(roles).values({ tenantId, name, isCustom: false }).returning();
        console.log(`✅ Role created: ${name}`);
      } else {
        console.log(`↩️  Role already exists, reusing: ${name}`);
      }
      roleIds[name] = role.id;
    }

    // 4. Find-or-create the admin user
    let [user] = await db.select().from(users).where(
      and(eq(users.tenantId, tenantId), eq(users.email, 'admin@demo.com'))
    );

    if (!user) {
      [user] = await db.insert(users).values({
        tenantId,
        name: 'System Admin',
        email: 'admin@demo.com',
        passwordHash: await generatePasswordHash('admin123'),
        status: 'active'
      }).returning();
      console.log('✅ User created (admin@demo.com / admin123)');
    } else {
      console.log('↩️  User already exists, reusing');
    }

    // 5. Assign the Super Admin role, if not already assigned. Without this,
    // the seeded admin logs in as 'no-role' and gets no access at all.
    const existingAssignment = await db.select().from(userRoleAssignments)
      .where(eq(userRoleAssignments.userId, user.id));

    if (existingAssignment.length === 0) {
      await db.insert(userRoleAssignments).values({
        userId: user.id,
        roleId: roleIds['Super Admin'],
        branchId: null, // null = all branches
      });
      console.log('✅ Super Admin role assigned');
    } else {
      console.log('↩️  User already has a role assigned, skipping');
    }

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
