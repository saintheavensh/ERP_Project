import { ICommissionSettingsRepository, ICommissionRepository } from "../../domain/repositories/commission-repository.port";
import { technicianCommissionSettings, technicianCommissions } from "../schema/ServiceSchema";
import { eq, and, gte, lte } from "drizzle-orm";
import { TransactionContext } from "../../../../../shared/types/db-context";

export class DrizzleCommissionSettingsRepository implements ICommissionSettingsRepository {
    async findByTechnicianId(tenantId: string, technicianId: string, tx: TransactionContext): Promise<any | null> {
        const rows = await tx.select()
            .from(technicianCommissionSettings)
            .where(and(eq(technicianCommissionSettings.tenantId, tenantId), eq(technicianCommissionSettings.technicianId, technicianId)));
        return rows[0] || null;
    }

    async upsert(tenantId: string, data: any, tx: TransactionContext): Promise<void> {
        const existing = await this.findByTechnicianId(tenantId, data.technicianId, tx);
        if (existing) {
            await tx.update(technicianCommissionSettings)
                .set({ ...data, updatedAt: new Date() })
                .where(and(eq(technicianCommissionSettings.tenantId, tenantId), eq(technicianCommissionSettings.technicianId, data.technicianId)));
        } else {
            await tx.insert(technicianCommissionSettings).values({ ...data, tenantId });
        }
    }
}

export class DrizzleCommissionRepository implements ICommissionRepository {
    async create(tenantId: string, data: any, tx: TransactionContext): Promise<{ id: string }> {
        const rows = await tx.insert(technicianCommissions).values({ ...data, tenantId }).returning({ id: technicianCommissions.id });
        return { id: rows[0].id };
    }

    async findByTechnicianId(tenantId: string, technicianId: string, tx: TransactionContext, startDate?: Date | undefined, endDate?: Date | undefined): Promise<any[]> {
        const conditions: any[] = [
            eq(technicianCommissions.tenantId, tenantId),
            eq(technicianCommissions.technicianId, technicianId)
        ];

        if (startDate) conditions.push(gte(technicianCommissions.createdAt, startDate));
        if (endDate) conditions.push(lte(technicianCommissions.createdAt, endDate));

        const result = await tx.select().from(technicianCommissions).where(and(...conditions));
        return result;
    }

    async markAsPaid(tenantId: string, ids: string[], tx: TransactionContext): Promise<void> {
        for (const id of ids) {
            await tx.update(technicianCommissions)
                .set({ paid: true, paidAt: new Date() })
                .where(and(eq(technicianCommissions.tenantId, tenantId), eq(technicianCommissions.id, id)));
        }
    }
}
