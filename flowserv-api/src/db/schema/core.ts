import {
  pgTable,
  uuid,
  text,
  varchar,
  integer,
  decimal,
  timestamp,
  boolean,
  jsonb,
  unique,
  index,
  uniqueIndex,
  primaryKey,
  numeric,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';



export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  subscriptionTier: varchar('subscription_tier', { length: 50 }).notNull().default('trial'),
  status: varchar('status', { length: 50 }).notNull().default('trial'),
  settings: jsonb('settings').notNull().default({}), // termasuk { simplifiedFinanceMode: true } — default sembunyikan istilah akuntansi
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const branches = pgTable('branches', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  name: text('name').notNull(),
  address: text('address'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  tenantIdx: index('branches_tenant_idx').on(table.tenantId),
}));

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  name: text('name').notNull(),
  email: text('email').notNull(),
  passwordHash: text('password_hash').notNull(),
  status: varchar('status', { length: 50 }).notNull().default('active'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  tenantEmailUnique: unique('users_tenant_email_unique').on(table.tenantId, table.email),
  tenantIdx: index('users_tenant_idx').on(table.tenantId),
}));

export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  name: text('name').notNull(),
  isCustom: boolean('is_custom').notNull().default(false),
}, (table) => ({
  // tenantNameUnique: unique('roles_tenant_name_unique').on(table.tenantId, table.name),
  tenantIdx: index('roles_tenant_idx').on(table.tenantId),
}));

export const permissions = pgTable('permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(), // e.g. "ticket.approve_quote"
  description: text('description').notNull(),
});

export const rolePermissions = pgTable('role_permissions', {
  roleId: uuid('role_id').notNull().references(() => roles.id),
  permissionId: uuid('permission_id').notNull().references(() => permissions.id),
}, (table) => ({
  pk: primaryKey({ columns: [table.roleId, table.permissionId] }),
}));

export const userRoleAssignments = pgTable('user_role_assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  roleId: uuid('role_id').notNull().references(() => roles.id),
  branchId: uuid('branch_id').references(() => branches.id), // null = semua cabang
}, (table) => ({
  userIdx: index('user_role_assignments_user_idx').on(table.userId),
}));
