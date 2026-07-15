/**
 * Service-tool repository adapter with tenant isolation.
 * All queries are scoped by tenant_id from tx.__tenantId.
 * All inserts derive tenant_id from tx.__tenantId (never from DTO).
 */
import { eq, and, desc } from "drizzle-orm";
import { TransactionContext } from "../../../../../shared/types/db-context";
import { serviceTools, serviceToolRequests } from "../../../../../shared/infrastructure/database/schema";
import { IServiceToolRepository, ServiceTool, ServiceToolRequest } from "../../domain";
import { requireTenantContext } from "../../../inventory/application/helpers/require-tenant-context";

export class ServiceToolRepositoryAdapter implements IServiceToolRepository {
    async findAll(tx: TransactionContext): Promise<ServiceTool[]> {
        const tenantId = requireTenantContext(tx);
        const results = await tx.select().from(serviceTools)
            .where(eq(serviceTools.tenantId, tenantId))
            .orderBy(desc(serviceTools.createdAt));
        return results as ServiceTool[];
    }

    async findById(id: string, tx: TransactionContext): Promise<ServiceTool | null> {
        const tenantId = requireTenantContext(tx);
        const results = await tx.select().from(serviceTools)
            .where(and(eq(serviceTools.id, id), eq(serviceTools.tenantId, tenantId)));
        return results[0] ? (results[0] as ServiceTool) : null;
    }

    async findByUserId(userId: string, tx: TransactionContext): Promise<ServiceTool[]> {
        const tenantId = requireTenantContext(tx);
        const results = await tx.select().from(serviceTools)
            .where(and(eq(serviceTools.userId, userId), eq(serviceTools.tenantId, tenantId)))
            .orderBy(desc(serviceTools.createdAt));
        return results as ServiceTool[];
    }

    async findLast(tx: TransactionContext): Promise<ServiceTool | null> {
        const tenantId = requireTenantContext(tx);
        const results = await tx.select().from(serviceTools)
            .where(eq(serviceTools.tenantId, tenantId))
            .orderBy(desc(serviceTools.id))
            .limit(1);
        return results[0] ? (results[0] as ServiceTool) : null;
    }

    async create(data: any, tx: TransactionContext): Promise<ServiceTool> {
        const tenantId = requireTenantContext(tx);
        const result = await tx.insert(serviceTools).values({ ...data, tenantId }).returning();
        return result[0] as ServiceTool;
    }

    async update(id: string, data: any, tx: TransactionContext): Promise<void> {
        const tenantId = requireTenantContext(tx);
        await tx.update(serviceTools)
            .set(data)
            .where(and(eq(serviceTools.id, id), eq(serviceTools.tenantId, tenantId)));
    }

    async delete(id: string, tx: TransactionContext): Promise<void> {
        const tenantId = requireTenantContext(tx);
        await tx.delete(serviceTools)
            .where(and(eq(serviceTools.id, id), eq(serviceTools.tenantId, tenantId)));
    }

    // Tool Requests
    async findAllRequests(tx: TransactionContext): Promise<ServiceToolRequest[]> {
        const tenantId = requireTenantContext(tx);
        const results = await tx.select().from(serviceToolRequests)
            .where(eq(serviceToolRequests.tenantId, tenantId))
            .orderBy(desc(serviceToolRequests.createdAt));
        return results as ServiceToolRequest[];
    }

    async findRequestsByUserId(userId: string, tx: TransactionContext): Promise<ServiceToolRequest[]> {
        const tenantId = requireTenantContext(tx);
        const results = await tx.select().from(serviceToolRequests)
            .where(and(eq(serviceToolRequests.userId, userId), eq(serviceToolRequests.tenantId, tenantId)))
            .orderBy(desc(serviceToolRequests.createdAt));
        return results as ServiceToolRequest[];
    }

    async createRequest(data: any, tx: TransactionContext): Promise<ServiceToolRequest> {
        const tenantId = requireTenantContext(tx);
        const result = await tx.insert(serviceToolRequests).values({ ...data, tenantId }).returning();
        return result[0] as ServiceToolRequest;
    }

    async updateRequestStatus(id: string, status: string, tx: TransactionContext): Promise<void> {
        const tenantId = requireTenantContext(tx);
        await tx.update(serviceToolRequests)
            .set({ status: status as any })
            .where(and(eq(serviceToolRequests.id, id), eq(serviceToolRequests.tenantId, tenantId)));
    }
}
