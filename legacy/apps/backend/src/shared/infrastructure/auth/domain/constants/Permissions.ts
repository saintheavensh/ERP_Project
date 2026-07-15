/**
 * Centralized Application Permissions.
 * Provides standard autocomplete strings for Middleware Guards.
 */
export const Permissions = {
    // Super bypass
    ALL: "all",

    // Inventory Module
    INVENTORY_READ: "inventory.read",
    INVENTORY_VIEW: "inventory.view",
    INVENTORY_CREATE: "inventory.create",
    INVENTORY_UPDATE: "inventory.update",
    INVENTORY_DELETE: "inventory.delete",
    INVENTORY_WRITE: "inventory.write",
    INVENTORY_MANAGE: "inventory.manage",

    // Sales Module
    SALE_READ: "sale.read",
    SALE_VIEW: "sale.view",
    SALE_CREATE: "sale.create",
    SALE_MANAGE: "sale.manage",

    // Purchase Module
    PURCHASE_READ: "purchase.read",
    PURCHASE_CREATE: "purchase.create",
    PURCHASE_MANAGE: "purchase.manage",
    PURCHASE_RETURN_CREATE: "purchase-return.create",

    // Finance/Accounting Module
    FINANCE_READ: "finance.read",
    FINANCE_MANAGE: "finance.manage",

    // User & Role Domain
    USER_MANAGE: "user.manage",
    ROLE_MANAGE: "role.manage",

    // Settings & Configuration
    SETTINGS_MANAGE: "settings.manage",

    // Miscellaneous Additions to satisfy routes
    ADMIN: "admin",
    REPORT_READ: "report.read",
    EMPLOYEE_MANAGE: "employee.manage",
    ANALYTICS_VIEW: "analytics.view",
} as const;

export type Permission = typeof Permissions[keyof typeof Permissions];
