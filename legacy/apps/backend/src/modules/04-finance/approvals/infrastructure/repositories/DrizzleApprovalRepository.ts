import { eq, and, ne, count } from "drizzle-orm";
import { TransactionContext } from "../../../../../shared/types/db-context";
import { approvals } from "../../infrastructure/schema/ApprovalSchema";
import { Approval, IApprovalRepository } from "../../domain";

export class DrizzleApprovalRepository implements IApprovalRepository {
    async findById(tenantId: string, id: string, tx: TransactionContext): Promise<Approval | null> {
        const result = await tx.query.approvals.findFirst({
            where: and(eq(approvals.tenantId, tenantId), eq(approvals.id, id)),
            with: {
                requestedBy: true,
                approvedBy: true,
            }
        });
        return (result as any) || null;
    }

    async findByEntity(tenantId: string, entityType: string, entityId: string, tx: TransactionContext): Promise<Approval[]> {
        const result = await tx.query.approvals.findMany({
            where: and(
                eq(approvals.tenantId, tenantId),
                eq(approvals.entityType, entityType),
                eq(approvals.entityId, entityId)
            ),
            with: {
                requestedBy: true,
                approvedBy: true,
            }
        });
        return result as any[];
    }

    async save(tenantId: string, data: Partial<Approval>, tx: TransactionContext): Promise<Approval> {
        const [result] = await tx.insert(approvals).values({ ...data, tenantId } as any).returning();
        if (!result) throw new Error("Failed to create approval");
        return result as any;
    }

    async update(tenantId: string, id: string, data: Partial<Approval>, tx: TransactionContext): Promise<Approval> {
        const [result] = await tx.update(approvals)
            .set(data as any)
            .where(and(eq(approvals.tenantId, tenantId), eq(approvals.id, id)))
            .returning();
        if (!result) throw new Error("Failed to update approval");
        return result as any;
    }

    async findPending(tenantId: string, tx: TransactionContext): Promise<Approval[]> {
        const result = await tx.query.approvals.findMany({
            where: and(eq(approvals.tenantId, tenantId), eq(approvals.status, 'PENDING')),
            with: {
                requestedBy: true,
            }
        });
        return result as any[];
    }

    async findHistory(tenantId: string, tx: TransactionContext, filters?: { type?: string | undefined; status?: string | undefined }): Promise<Approval[]> {
        const conditions: any[] = [eq(approvals.tenantId, tenantId), ne(approvals.status, 'PENDING')];
        if (filters?.type) {
            conditions.push(eq(approvals.type, filters.type as any));
        }
        if (filters?.status) {
            conditions.push(eq(approvals.status, filters.status as any));
        }

        const result = await tx.query.approvals.findMany({
            where: and(...conditions),
            with: {
                requestedBy: true,
                approvedBy: true,
            },
            orderBy: (a: any, { desc }: any) => [desc(a.requestedAt)]
        });
        return result as any[];
    }

    async getStats(tenantId: string, tx: TransactionContext): Promise<{ pending: number; approved: number; rejected: number; totalAmount: number }> {
        const rows = await tx.select({
            status: approvals.status,
            count: count(),
        }).from(approvals).where(eq(approvals.tenantId, tenantId)).groupBy(approvals.status);

        const stats = { pending: 0, approved: 0, rejected: 0, totalAmount: 0 };
        for (const row of rows) {
            if (row.status === 'PENDING') stats.pending = Number(row.count);
            else if (row.status === 'APPROVED') stats.approved = Number(row.count);
            else if (row.status === 'REJECTED') stats.rejected = Number(row.count);
        }
        return stats;
    }
}
