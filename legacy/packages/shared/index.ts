import { z } from "@hono/zod-openapi";

// --- Auth Schemas ---
export const loginSchema = z.object({
    username: z.string(),
    password: z.string()
});
export type LoginRequest = z.infer<typeof loginSchema>;
export type LoginResponse = {
    token: string;
    user: {
        id: string;
        name: string;
        role: string;
    }
};

// --- Inventory Schemas ---
// --- Inventory Schemas ---
export const categorySchema = z.object({
    name: z.string().min(1),
    description: z.string().optional()
});
export type CreateCategoryRequest = z.infer<typeof categorySchema>;

export const productSchema = z.object({
    name: z.string().min(1),
    code: z.string().optional(), // Universal Code
    categoryId: z.string().optional(), // Link to category
    image: z.string().optional(),
    minStock: z.number().default(5),
    compatibility: z.array(z.string()).optional() // Array of Device IDs
});
export type CreateProductRequest = z.infer<typeof productSchema>;

export const batchSchema = z.object({
    productId: z.string(),
    brand: z.string().optional(), // Brand/Merk for this batch
    supplier: z.string().optional(),
    buyPrice: z.number(),
    sellPrice: z.number(),
    stock: z.number()
});
export type AddBatchRequest = z.infer<typeof batchSchema>;

// Device Type



// --- Service Schemas ---
export const createServiceSchema = z.object({
    type: z.enum(["regular", "walk_in"]),
    customer: z.object({
        name: z.string(),
        phone: z.string().optional(), // Made optional for Quick Input
        address: z.string().optional()
    }),
    unit: z.object({
        brand: z.string(),
        model: z.string(),
        status: z.string(),
        imei: z.string().optional(),
        color: z.string().optional(), // Added color
        pin: z.string().optional(),
        condition: z.array(z.string()).optional(),
        completeness: z.array(z.string()).optional(),
        physicalNotes: z.string().optional()
    }),
    complaint: z.string(),
    technicianId: z.string().nullable().optional(),
    // Schema says: technicianId: text("technician_id").references(() => users.id)
    // Users ID is text (UUID). So string.
    // Frontend sent parseInt(technician).
    // I need to check backend schema again.

    status: z.enum(["antrian", "dicek", "konfirmasi", "dikerjakan", "re-konfirmasi", "selesai", "diambil", "batal"]).default("antrian"),

    // Regular specific
    diagnosis: z.object({
        initial: z.string().optional(),
        possibleCauses: z.string().optional(),
        estimatedCost: z.string().optional(), // Can be range "100-200" or simple "150000"
        downPayment: z.string().optional() // received as string from input?
    }).optional(),

    // Walk-in/Parts
    parts: z.array(z.object({
        productId: z.string().or(z.number()), // might be ID or name?
        qty: z.number(),
        price: z.number()
    })).optional(),
    photos: z.array(z.string()).optional(),

    // Estimated completion date for regular services
    estimatedCompletionDate: z.string().optional(),

    // Initial QC for walk-in (nyala phones only)
    initialQC: z.record(z.boolean()).optional(),

    // Final QC for walk-in services
    qc: z.object({
        passed: z.boolean().optional(), // Optional for initial creation
        before: z.record(z.boolean()).optional(),
        after: z.record(z.boolean()).optional(), // Optional for initial creation
        notes: z.string().optional(),
    }).optional(),

    // Actual cost for walk-in (paid immediately)
    actualCost: z.number().optional(),

    // Added missing fields
    warranty: z.string().optional(),
    priority: z.enum(["standard", "wait"]).optional(),
    isDirectComplete: z.boolean().optional()
});

export type CreateServiceRequest = z.infer<typeof createServiceSchema>;

// Update Status Schema
export const updateStatusSchema = z.object({
    status: z.enum(["antrian", "dicek", "konfirmasi", "dikerjakan", "re-konfirmasi", "selesai", "diambil", "batal"]),
    notes: z.string().optional(),
    actualCost: z.number().optional(),
    userId: z.string() // Who performed the action
});
export type UpdateStatusRequest = z.infer<typeof updateStatusSchema>;





// ============================================
// Sales Schemas
// ============================================

export const saleItemSchema = z.object({
    productId: z.string(),
    variant: z.string().default("Standard"),
    qty: z.number().min(1),
    price: z.number().min(0)
});
export type SaleItemRequest = z.infer<typeof saleItemSchema>;

export const paymentSchema = z.object({
    method: z.string(),
    methodId: z.string().optional(),
    variantId: z.string().optional(),
    variantName: z.string().optional(),
    amount: z.number().min(0),
    reference: z.string().optional()
});
export type PaymentRequest = z.infer<typeof paymentSchema>;

export const createSaleSchema = z.object({
    memberId: z.string().optional(),
    customerName: z.string().optional(),
    payments: z.array(paymentSchema).min(1),
    userId: z.string(),
    notes: z.string().optional(),
    items: z.array(saleItemSchema).min(1),
    discountAmount: z.number().optional()
});
export type CreateSaleRequest = z.infer<typeof createSaleSchema>;

// ============================================
// Re-export all shared types
// ============================================
export * from "./types";
export * from "./constants";
