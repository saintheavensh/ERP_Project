import {
    LayoutDashboard,
    ShoppingCart,
    Wrench,
    Package,
    DollarSign,
    Settings,
    Tag,
    FolderTree,
    Truck,
    Undo2,
    ClipboardCheck,
    Search,
    Users,
    History,
    Smartphone,
    Shield,
} from 'lucide-svelte';

export type UserRole = 'kasir' | 'teknisi' | 'warehouse' | 'supervisor' | 'manager' | 'owner' | 'super_admin';

export interface NavItem {
    id: string;
    title: string;
    href?: string;
    icon?: any; // Lucide icon component reference
    roles: UserRole[] | ['*']; // '*' means all roles
    children?: NavItem[];
    divider?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
    {
        id: 'dashboard',
        title: 'Dashboard',
        href: '/',
        icon: LayoutDashboard,
        roles: ['*']
    },
    {
        id: 'inventory',
        title: 'Inventory',
        icon: Package,
        roles: ['manager', 'warehouse', 'teknisi'],
        children: [
            {
                id: 'manager-products',
                title: 'Products',
                href: '/inventory/manager/products',
                roles: ['manager']
            },
            {
                id: 'inventory-brands',
                title: 'Brands',
                href: '/inventory/manager/brands',
                roles: ['manager']
            },
            {
                id: 'inventory-categories',
                title: 'Categories',
                href: '/inventory/manager/categories',
                roles: ['manager']
            },
            {
                id: 'inventory-suppliers',
                title: 'Suppliers',
                href: '/inventory/manager/suppliers',
                roles: ['manager']
            },
            {
                id: 'inventory-returns',
                title: 'Purchase Returns',
                href: '/inventory/manager/returns',
                roles: ['manager']
            },
            {
                id: 'warehouse-stock',
                title: 'Stock',
                href: '/inventory/warehouse/stock',
                roles: ['warehouse']
            },
            {
                id: 'warehouse-opname',
                title: 'Stock Opname',
                href: '/inventory/warehouse/opname',
                roles: ['warehouse']
            },
            {
                id: 'defective',
                title: 'Defective Items',
                href: '/inventory/warehouse/defective',
                roles: ['warehouse']
            },
            {
                id: 'service-tools',
                title: 'Service Tools',
                href: '/inventory/warehouse/service-tools',
                roles: ['warehouse']
            },
            {
                id: 'teknisi-parts',
                title: 'Spareparts',
                href: '/inventory/teknisi/parts',
                roles: ['teknisi']
            },
            {
                id: 'product-search',
                title: 'Search Products',
                href: '/inventory/shared/search',
                roles: ['*']
            }
        ]
    },
    {
        id: 'services',
        title: 'Services',
        icon: Wrench,
        roles: ['teknisi', 'manager'],
        children: [
            {
                id: 'service-queue',
                title: 'Queue',
                href: '/services/teknisi/queue',
                roles: ['teknisi']
            },
            {
                id: 'service-devices',
                title: 'Devices',
                href: '/services/manager/devices',
                roles: ['manager']
            },
            {
                id: 'service-warranty',
                title: 'Warranty',
                href: '/services/manager/warranty',
                roles: ['manager']
            },
            {
                id: 'service-reports',
                title: 'Reports',
                href: '/services/manager/reports',
                roles: ['manager']
            }
        ]
    },
    {
        id: 'sales',
        title: 'Sales',
        icon: ShoppingCart,
        roles: ['kasir', 'manager'],
        children: [
            {
                id: 'pos',
                title: 'POS',
                href: '/sales/kasir',
                roles: ['kasir']
            },
            {
                id: 'sales-customers',
                title: 'Customers',
                href: '/sales/manager/customers',
                roles: ['manager']
            },
            {
                id: 'sales-history',
                title: 'Sales History',
                href: '/sales/manager/history',
                roles: ['manager']
            },
            {
                id: 'approvals',
                title: 'Approvals',
                href: '/sales/manager/approvals',
                roles: ['manager']
            }
        ]
    },
    {
        id: 'finance',
        title: 'Finance',
        icon: DollarSign,
        roles: ['manager'],
        children: [
            {
                id: 'finance-reports',
                title: 'Reports',
                href: '/finance/manager/reports',
                roles: ['manager']
            },
            {
                id: 'finance-accounting',
                title: 'Accounting',
                href: '/finance/manager/accounting',
                roles: ['manager']
            }
        ]
    },
    {
        id: 'settings',
        title: 'Settings',
        icon: Settings,
        href: '/shared/settings',
        roles: ['*']
    },
    {
        id: 'roles',
        title: 'Roles',
        href: '/shared/roles',
        icon: Shield,
        roles: ['super_admin']
    }
];

export function filterNavByRole(items: NavItem[], role: UserRole): NavItem[] {
    return items
        .filter(item => (item.roles as string[]).includes('*') || (item.roles as string[]).includes(role))
        .map(item => ({
            ...item,
            children: item.children ? filterNavByRole(item.children, role) : undefined
        }))
        .filter(item => item.children === undefined || item.children.length > 0);
}
