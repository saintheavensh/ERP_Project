import bcrypt from 'bcryptjs';
import {
  tenants,
  branches,
  roles,
  permissions,
  rolePermissions,
  users,
  userRoleAssignments,
} from '../schema';
import { IDS } from './ids';
import type { SeedTx } from './types';

// Permission catalog, taken directly from the action rows of the permission
// matrix in specification/03-rbac-roles.md — not invented. This table has no
// tenantId: it is a single global catalog shared by every tenant.
const PERMISSIONS = [
  { id: IDS.permTicketCreate, code: 'ticket.create', description: 'Create a service ticket' },
  { id: IDS.permTicketDiagnose, code: 'ticket.diagnose', description: 'Update ticket diagnosis' },
  { id: IDS.permTicketApproveQuote, code: 'ticket.approve_quote', description: 'Approve a quote to the customer' },
  { id: IDS.permInventoryReserve, code: 'inventory.reserve_part', description: 'Reserve or consume a part' },
  { id: IDS.permInventoryAdjust, code: 'inventory.adjust_stock', description: 'Manually adjust stock' },
  { id: IDS.permPosPayment, code: 'pos.process_payment', description: 'Process a POS payment' },
  { id: IDS.permPosVoid, code: 'pos.void_transaction', description: 'Void a POS transaction' },
  { id: IDS.permFinanceRefund, code: 'finance.approve_refund', description: 'Approve a refund' },
  { id: IDS.permFinanceReports, code: 'finance.view_reports', description: 'View branch finance reports' },
  { id: IDS.permFlowConfigure, code: 'flow.configure_template', description: 'Configure a flow template' },
] as const;

// Role -> permission codes, mapped from the same matrix (✅ and ➕ both
// granted — thresholds/approval-gating are not enforced yet, that is H12).
const ROLE_PERMISSION_CODES: Record<string, string[]> = {
  [IDS.roleSuperAdmin]: PERMISSIONS.map(p => p.code), // Tenant Owner equivalent: everything
  [IDS.roleManager]: [
    'ticket.create', 'ticket.diagnose', 'ticket.approve_quote',
    'inventory.reserve_part', 'inventory.adjust_stock',
    'pos.process_payment', 'pos.void_transaction',
    'finance.approve_refund', 'finance.view_reports',
  ],
  [IDS.roleTechnician]: ['ticket.create', 'ticket.diagnose', 'inventory.reserve_part'],
  [IDS.roleCashier]: ['pos.process_payment'],
};

export async function seedCore(tx: SeedTx): Promise<void> {
  // 1. Tenants — a second tenant with its own branch/role/user is what makes
  // the H12 cross-tenant isolation test possible at all.
  await tx.insert(tenants).values([
    {
      id: IDS.tenantMain,
      name: 'Demo Service Center',
      subscriptionTier: 'pro',
      status: 'active',
      settings: { simplifiedFinanceMode: true },
    },
    {
      id: IDS.tenantSecond,
      name: 'Bengkel Sebelah',
      subscriptionTier: 'trial',
      status: 'active',
      settings: { simplifiedFinanceMode: true },
    },
  ]).onConflictDoNothing();

  // 2. Branches — two for the main tenant (branch-scoping bugs only show up
  // once there is more than one), one for the second tenant.
  await tx.insert(branches).values([
    { id: IDS.branchPusat, tenantId: IDS.tenantMain, name: 'Pusat (Headquarter)', address: 'Jl. Sudirman No. 1, Jakarta' },
    { id: IDS.branchCabang, tenantId: IDS.tenantMain, name: 'Cabang Bandung', address: 'Jl. Asia Afrika No. 10, Bandung' },
    { id: IDS.branchSecond, tenantId: IDS.tenantSecond, name: 'Pusat', address: 'Jl. Gatot Subroto No. 5, Surabaya' },
  ]).onConflictDoNothing();

  // 3. Roles
  await tx.insert(roles).values([
    { id: IDS.roleSuperAdmin, tenantId: IDS.tenantMain, name: 'Super Admin', isCustom: false },
    { id: IDS.roleManager, tenantId: IDS.tenantMain, name: 'Manager', isCustom: false },
    { id: IDS.roleTechnician, tenantId: IDS.tenantMain, name: 'Technician', isCustom: false },
    { id: IDS.roleCashier, tenantId: IDS.tenantMain, name: 'Cashier', isCustom: false },
    { id: IDS.roleSecondAdmin, tenantId: IDS.tenantSecond, name: 'Super Admin', isCustom: false },
  ]).onConflictDoNothing();

  // 4. Permission catalog + role grants
  await tx.insert(permissions).values(
    PERMISSIONS.map(p => ({ id: p.id, code: p.code, description: p.description }))
  ).onConflictDoNothing();

  const codeToId = new Map<string, string>(PERMISSIONS.map(p => [p.code, p.id]));
  const rolePermissionRows = Object.entries(ROLE_PERMISSION_CODES).flatMap(([roleId, codes]) =>
    codes.map(code => ({ roleId, permissionId: codeToId.get(code)! }))
  );
  await tx.insert(rolePermissions).values(rolePermissionRows).onConflictDoNothing();

  // 5. Users — same password for all, so a developer can log in as any role
  // without looking anything up.
  const passwordHash = await bcrypt.hash('admin123', 10);
  await tx.insert(users).values([
    { id: IDS.userSuperAdmin, tenantId: IDS.tenantMain, name: 'Super Admin', email: 'admin@demo.com', passwordHash, status: 'active' },
    { id: IDS.userManager, tenantId: IDS.tenantMain, name: 'Budi Manager', email: 'manager@demo.com', passwordHash, status: 'active' },
    { id: IDS.userTechnician, tenantId: IDS.tenantMain, name: 'Teknisi Andi', email: 'technician@demo.com', passwordHash, status: 'active' },
    { id: IDS.userCashier, tenantId: IDS.tenantMain, name: 'Kasir Sari', email: 'cashier@demo.com', passwordHash, status: 'active' },
    { id: IDS.userSecondAdmin, tenantId: IDS.tenantSecond, name: 'Admin Bengkel Sebelah', email: 'admin@bengkelsebelah.com', passwordHash, status: 'active' },
  ]).onConflictDoNothing();

  // 6. Role assignments — branchId null = all branches, matching the existing
  // seed's convention for a tenant-wide role.
  await tx.insert(userRoleAssignments).values([
    { id: IDS.assignSuperAdmin, userId: IDS.userSuperAdmin, roleId: IDS.roleSuperAdmin, branchId: null },
    { id: IDS.assignManager, userId: IDS.userManager, roleId: IDS.roleManager, branchId: null },
    { id: IDS.assignTechnician, userId: IDS.userTechnician, roleId: IDS.roleTechnician, branchId: IDS.branchPusat },
    { id: IDS.assignCashier, userId: IDS.userCashier, roleId: IDS.roleCashier, branchId: IDS.branchPusat },
    { id: IDS.assignSecondAdmin, userId: IDS.userSecondAdmin, roleId: IDS.roleSecondAdmin, branchId: null },
  ]).onConflictDoNothing();
}
