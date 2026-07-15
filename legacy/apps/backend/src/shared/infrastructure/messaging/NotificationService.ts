import { db } from "../../../shared/infrastructure/database/client";
import { notifications } from "../../../shared/infrastructure/database/schema";

type NotificationType = "low_stock" | "service_update" | "new_assignment" | "sale_complete" | "purchase_complete";

interface NotificationPayload {
    tenantId: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    entityType?: string;
    entityId?: string;
}

/**
 * Send a notification to a specific user
 * - Saves to database for persistence
 * - Real-time delivery is handled by Supabase listening to the database changes
 */
export async function sendNotification(payload: NotificationPayload) {
    // Save to database
    const [notification] = await db.insert(notifications).values({
        userId: payload.userId,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        entityType: payload.entityType,
        entityId: payload.entityId,
        tenantId: payload.tenantId,
        isRead: false,
    }).returning();

    return notification;
}

/**
 * Send notification to multiple users
 */
export async function broadcastNotification(
    payload: Omit<NotificationPayload, "userId"> & { tenantId: string },
    userIds: string[]
) {
    const results = [];

    for (const userId of userIds) {
        const result = await sendNotification({ ...payload, userId });
        results.push(result);
    }

    return results;
}

/**
 * Common notification helpers
 */
export const NotificationService = {
    // Stock alerts
    async lowStock(tenantId: string, userId: string, productName: string, currentStock: number, productId: string) {
        return sendNotification({
            tenantId,
            userId,
            type: "low_stock",
            title: "Stok Rendah",
            message: `${productName} tersisa ${currentStock} unit`,
            entityType: "product",
            entityId: productId,
        });
    },

    // Service updates
    async serviceStatusChanged(tenantId: string, userId: string, serviceNo: string, newStatus: string, serviceId: string) {
        return sendNotification({
            tenantId,
            userId,
            type: "service_update",
            title: "Status Servis Berubah",
            message: `Servis ${serviceNo} sekarang: ${newStatus}`,
            entityType: "service",
            entityId: serviceId,
        });
    },

    // Technician assignment
    async technicianAssigned(tenantId: string, technicianId: string, serviceNo: string, serviceId: string) {
        return sendNotification({
            tenantId,
            userId: technicianId,
            type: "new_assignment",
            title: "Tugas Baru",
            message: `Anda ditugaskan untuk servis ${serviceNo}`,
            entityType: "service",
            entityId: serviceId,
        });
    },

    // Sale complete
    async saleCompleted(tenantId: string, userId: string, saleId: string, amount: number) {
        return sendNotification({
            tenantId,
            userId,
            type: "sale_complete",
            title: "Penjualan Selesai",
            message: `Transaksi ${saleId} senilai Rp ${amount.toLocaleString("id-ID")} berhasil`,
            entityType: "sale",
            entityId: saleId,
        });
    },

    // Purchase complete
    async purchaseCompleted(tenantId: string, userId: string, purchaseId: string, supplierName: string) {
        return sendNotification({
            tenantId,
            userId,
            type: "purchase_complete",
            title: "Pembelian Selesai",
            message: `Pembelian dari ${supplierName} (${purchaseId}) tercatat`,
            entityType: "purchase",
            entityId: purchaseId,
        });
    },

    // Legacy sync helpers (Deprecated/No-op as we rely on DB changes now)
    async syncStockUpdate(productId: string, newStock: number) {
        // No-op: Frontend should listen to inventory table
        return null;
    },

    async syncServiceUpdate(serviceId: string, status: string) {
        // No-op: Frontend should listen to service table
        return null;
    }
};
