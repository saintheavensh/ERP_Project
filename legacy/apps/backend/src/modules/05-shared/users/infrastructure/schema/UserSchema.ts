import { text, integer, boolean, timestamp, pgTable, json, index, primaryKey } from "drizzle-orm/pg-core";
import { randomUUID } from "crypto";

// Helpers
const uuid = () => text("id").primaryKey().$defaultFn(() => randomUUID());
const timestamps = () => ({
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
    deletedAt: timestamp("deleted_at"),
});

// ============================================
// USERS & AUTH
// ============================================

export const roles = pgTable("roles", {
    id: text("id").primaryKey(), // "admin", "teknisi", "kasir"
    name: text("name").notNull(),
    tenantId: text("tenant_id").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
});

export const permissions = pgTable("permissions", {
    id: text("id").primaryKey(), // e.g. "inventory.create"
    description: text("description"),
    tenantId: text("tenant_id").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
});

export const rolePermissions = pgTable("role_permissions", {
    roleId: text("role_id").notNull().references(() => roles.id, { onDelete: 'cascade' }),
    permissionId: text("permission_id").notNull().references(() => permissions.id, { onDelete: 'cascade' }),
    createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
    return {
        // Compound Primary Key
        pk: primaryKey({ columns: [table.roleId, table.permissionId] }),
        // Covering index for rapid role_id lookups
        roleIdIdx: index("role_permissions_role_id_idx").on(table.roleId)
    };
});

export const users = pgTable("users", {
    id: text("id").primaryKey(),
    username: text("username").notNull().unique(),
    email: text("email").notNull().unique(),
    emailVerified: timestamp("email_verified"),
    password: text("password").notNull(),
    role: text("role").notNull().references(() => roles.id).default("teknisi"),
    name: text("name").notNull(),
    image: text("image"),
    commissionConfig: json("commission_config"),
    isActive: boolean("is_active").default(true),
    tenantId: text("tenant_id").notNull(),
    ...timestamps(),
}, (table) => ({
    tenantIdx: index("users_tenant_idx").on(table.tenantId),
}));

export const userRoles = pgTable("user_roles", {
    id: uuid(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
    role: text("role").notNull(),
    isActive: boolean("is_active").default(true),
    tenantId: text("tenant_id").notNull(),
    createdAt: timestamp("created_at").defaultNow()
}, (table) => ({
    tenantIdx: index("user_roles_tenant_idx").on(table.tenantId),
}));

export const userSessions = pgTable("user_sessions", {
    id: uuid(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
    role: text("role").notNull(),
    refreshToken: text("refresh_token"), // Nullable initially to support existing sessions
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    loginTime: timestamp("login_time").defaultNow(),
    logoutTime: timestamp("logout_time"),
    isActive: boolean("is_active").default(true),
    tenantId: text("tenant_id").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
}, (table) => {
    return {
        userIdIdx: index("user_sessions_user_id_idx").on(table.userId),
        isActiveIdx: index("user_sessions_is_active_idx").on(table.isActive),
        tenantIdx: index("user_sessions_tenant_idx").on(table.tenantId),
        // Compound index for finding an active session quickly by ID (used in middleware)
        activeSessionIdx: index("user_sessions_active_idx").on(table.id, table.isActive)
    };
});


