/**
 * Shared Types for Saint Heavens POS
 * 
 * These types are the single source of truth for the entire application.
 * Use these in frontend, backend, and keep in sync with database schema.
 */

// ============================================
// USER & AUTH
// ============================================

export type UserRole = "admin" | "teknisi" | "kasir";

export interface User {
    id: string;
    username: string;
    password?: string; // Only used in backend
    name: string;
    role: UserRole;
    image?: string | null;
    createdAt?: Date | null;
}

export interface AuthUser {
    id: string;
    username: string;
    name: string;
    role: UserRole;
}

// ============================================
// MASTER DATA
// ============================================

export interface Category {
    id: string;
    name: string;
    description?: string | null;
    parentId?: string | null;
    variantTemplates?: { id: number; name: string }[];
    createdAt?: Date | null;
}

export interface Device {
    id: string;
    brand: string;
    series?: string | null;
    model: string;
    code?: string | null;
    image?: string | null;
    colors?: string[] | null;
    specs?: string | null;
    chipset?: string | null;
    specifications?: Record<string, any> | null;
    createdAt?: Date | null;
    updatedAt?: Date | null;
}

export interface Supplier {
    id: string;
    name: string;
    contact?: string | null;
    phone?: string | null;
    address?: string | null;
    image?: string | null;
    createdAt?: Date | null;
}

export interface Customer {
    id: string;
    name: string;
    phone: string;
    email?: string | null;
    address?: string | null;
    discountPercent: number;
    points: number;
    debt: number;
    creditLimit: number;
    image?: string | null;
    createdAt?: Date | null;
}

// ============================================
// INVENTORY
// ============================================

export interface Product {
    id: string;
    code?: string | null;
    name: string;
    categoryId?: string | null;
    image?: string | null;
    stock: number;
    minStock: number;
    createdAt?: Date | null;
    // Relations (optional, populated by queries)
    category?: Category | null;
    batches?: ProductBatch[];
    price?: number; // Calculated price (e.g. from batch)
    variants?: ProductVariant[]; // Pre-defined variants
    compatibility?: Device[]; // Array of compatible devices
}

export interface ProductVariant {
    id: string;
    productId: string;
    name: string;
    image?: string | null;
    sku?: string | null;
    defaultPrice?: number | null;
    createdAt?: Date | null;
}

export interface ProductBatch {
    id: string;
    productId: string;
    supplierId?: string | null;
    variantId?: string | null; // Link to defined variant
    variant?: string | null;
    supplierName?: string | null;
    buyPrice: number;
    sellPrice: number;
    initialStock: number;
    currentStock: number;
    createdAt?: Date | null;
    updatedAt?: Date | null;
    // Relations
    product?: Product;
    supplier?: Supplier | null;
    variantLink?: ProductVariant | null;
}

// ============================================
// PURCHASES
// ============================================

export interface Purchase {
    id: string;
    supplierId: string;
    userId?: string | null;
    totalAmount: number;
    notes?: string | null;
    date?: Date | null;
    // Relations
    supplier?: Supplier;
    user?: User;
    items?: PurchaseItem[];
}

export interface PurchaseItem {
    id: number;
    purchaseId: string;
    productId: string;
    variant?: string | null;
    qtyOrdered: number;
    qtyReceived: number;
    buyPrice: number;
    sellPrice: number;
    batchId?: string | null;
    createdAt?: Date | null;
    // Relations
    product?: Product;
    batch?: ProductBatch | null;
}

// ============================================
// SALES
// ============================================

export type PaymentMethod = "cash" | "transfer" | "qris" | "mixed";
export type PaymentStatus = "paid" | "partial" | "unpaid";

export interface Sale {
    id: string;
    memberId?: string | null;
    customerName?: string | null;
    totalAmount: number;
    discountAmount: number;
    finalAmount: number;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    userId: string;
    notes?: string | null;
    createdAt?: Date | null;
    // Relations
    member?: Customer | null;
    user?: User;
    items?: SaleItem[];
    payments?: SalePayment[];
}

export interface SaleItem {
    id: number;
    saleId: string;
    productId: string;
    batchId: string;
    variant?: string | null;
    qty: number;
    price: number;
    subtotal: number;
    createdAt?: Date | null;
    // Relations
    product?: Product;
    batch?: ProductBatch;
}

export interface SalePayment {
    id: number;
    saleId: string;
    method: string;
    amount: number;
    reference?: string | null;
    proofImage?: string | null;
    createdAt?: Date | null;
}

// ============================================
// SERVICE CENTER
// ============================================

export type ServiceStatus =
    | "antrian"
    | "dicek"
    | "konfirmasi"
    | "dikerjakan"
    | "re-konfirmasi"
    | "selesai"
    | "diambil"
    | "batal";

export interface ServiceCustomer {
    name: string;
    phone: string;
    address?: string;
}

export interface ServiceDevice {
    brand: string;
    model: string;
    imei?: string;
    equipment?: string;
}

export interface Service {
    id: number;
    no: string;
    customer: ServiceCustomer;
    device: ServiceDevice;
    complaint: string;
    diagnosis?: string | null;
    notes?: string | null;
    status: ServiceStatus;
    technicianId?: string | null;
    createdBy?: string | null;
    costEstimate?: number | null;
    actualCost?: number | null;
    dateIn?: Date | null;
    dateOut?: Date | null;
    // Relations
    technician?: User | null;
    creator?: User | null;
}

// ============================================
// PURCHASE RETURNS
// ============================================

export interface PurchaseReturn {
    id: string;
    supplierId: string;
    userId: string;
    notes?: string | null;
    date?: Date | null;
    createdAt?: Date | null;
    // Relations
    supplier?: Supplier;
    user?: User;
    items?: PurchaseReturnItem[];
}

export interface PurchaseReturnItem {
    id: number;
    returnId: string;
    productId: string;
    batchId: string;
    qty: number;
    reason?: string | null;
    createdAt?: Date | null;
}

// ============================================
// DEFECTIVE ITEMS
// ============================================

export type DefectiveSource = "manual" | "sales_return" | "service_return";
export type DefectiveStatus = "pending" | "processed";

export interface DefectiveItem {
    id: string;
    productId: string;
    batchId: string;
    supplierId: string;
    qty: number;
    source: DefectiveSource;
    sourceRefId?: string | null;
    reason?: string | null;
    status: DefectiveStatus;
    createdAt?: Date | null;
}

// ============================================
// NOTIFICATIONS
// ============================================

export type NotificationType =
    | "low_stock"
    | "service_update"
    | "new_assignment"
    | "sale_complete"
    | "purchase_complete";

export interface Notification {
    id: number;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    entityType?: string | null;
    entityId?: string | null;
    isRead: boolean;
    createdAt?: Date | null;
}

// ============================================
// ACTIVITY LOGS
// ============================================

export type ActivityAction = "CREATE" | "UPDATE" | "DELETE" | "ASSIGN" | "STATUS_CHANGE";

export interface ActivityLog {
    id: number;
    userId: string;
    action: ActivityAction;
    entityType: string;
    entityId: string;
    oldValue?: any;
    newValue?: any;
    description?: string | null;
    createdAt?: Date | null;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    meta?: any;
    errors?: any[];
    error_code?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// ============================================
// ID PREFIXES (for reference)
// ============================================

export const ID_PREFIXES = {
    USER: "USR",
    CUSTOMER: "CUST",
    PRODUCT: "PRD",
    SUPPLIER: "SUP",
    BATCH: "B",
    PURCHASE: "PO",
    SALE: "SAL",
    RETURN: "RET",
    DEFECTIVE: "DEF",
    CATEGORY: "CAT",
    SERVICE: "SRV",
    VARIANT: "VAR",
    PAYMENT: "PAY",
} as const;

export type IdPrefix = typeof ID_PREFIXES[keyof typeof ID_PREFIXES];
