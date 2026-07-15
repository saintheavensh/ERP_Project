import { eq, desc, like, count, and } from "drizzle-orm";
import { TransactionContext } from "../../../../../shared/types/db-context";
import { services, activityLogs, users } from "../../../../../shared/infrastructure/database/schema";
import { IServiceRepository, ServiceTicket } from "../../domain";

export class ServiceRepositoryAdapter implements IServiceRepository {
    async findAll(tenantId: string, params: { status?: string | undefined; technicianId?: string | undefined }, tx: TransactionContext): Promise<ServiceTicket[]> {
        const conditions: any[] = [eq(services.tenantId, tenantId)];

        if (params.status) {
            conditions.push(eq(services.status, params.status as any));
        }

        if (params.technicianId && params.technicianId !== 'all') {
            conditions.push(eq(services.technicianId, params.technicianId));
        }

        const results = await tx.query.services.findMany({
            where: and(...conditions),
            orderBy: [desc(services.dateIn)],
            with: {
                technician: true,
                items: {
                    with: {
                        parts: true,
                        serviceType: true,
                        technician: true
                    }
                }
            }
        });

        return results as ServiceTicket[];
    }

    async findById(tenantId: string, id: string, tx: TransactionContext): Promise<ServiceTicket | null> {
        const result = await tx.query.services.findFirst({
            where: and(eq(services.tenantId, tenantId), eq(services.id, id)),
            with: {
                technician: true,
                creator: true,
                items: {
                    with: {
                        parts: {
                            with: { variantBatch: true }
                        },
                        serviceType: true,
                        technician: true
                    }
                }
            }
        });

        return result ? (result as ServiceTicket) : null;
    }

    async findLastServiceNo(tenantId: string, prefix: string, tx: TransactionContext): Promise<{ no: string } | null> {
        const result = await tx.query.services.findFirst({
            where: and(eq(services.tenantId, tenantId), like(services.no, `${prefix}%`)),
            orderBy: [desc(services.id)]
        });
        return result ? { no: result.no } : null;
    }

    async getCountsByStatus(tenantId: string, tx: TransactionContext): Promise<Array<{ status: string; count: number }>> {
        const results = await tx.select({
            status: services.status,
            count: count()
        })
            .from(services)
            .where(eq(services.tenantId, tenantId))
            .groupBy(services.status);
        return results;
    }

    async getTechnicianStats(tenantId: string, technicianId: string, start: Date, end: Date, tx: TransactionContext): Promise<ServiceTicket[]> {
        const results = await tx.query.services.findMany({
            where: (services: any, { and: andOp, eq: eqOp, gte, lte }: any) => andOp(
                eqOp(services.tenantId, tenantId),
                eqOp(services.technicianId, technicianId),
                gte(services.dateIn, start),
                lte(services.dateIn, end)
            )
        });
        return results as ServiceTicket[];
    }

    async create(tenantId: string, data: any, tx: TransactionContext): Promise<{ id: string }> {
        const result = await tx.insert(services).values({ ...data, tenantId }).returning({ id: services.id });
        return { id: result[0].id };
    }

    async update(tenantId: string, id: string, data: any, tx: TransactionContext): Promise<void> {
        await tx.update(services).set(data).where(and(eq(services.tenantId, tenantId), eq(services.id, id)));
    }

    async delete(tenantId: string, id: string, tx: TransactionContext): Promise<void> {
        const srv = await this.findById(tenantId, id, tx);
        if (!srv) return;

        await tx.delete(activityLogs).where(eq(activityLogs.entityId, srv.no));
        await tx.delete(services).where(and(eq(services.tenantId, tenantId), eq(services.id, id)));
    }

    async logActivity(tenantId: string, params: any, tx: TransactionContext): Promise<void> {
        await tx.insert(activityLogs).values({
            ...params,
            tenantId,
            oldValue: params.oldValue ? JSON.stringify(params.oldValue) : null,
            newValue: params.newValue ? JSON.stringify(params.newValue) : null,
        });
    }

    async getTimeline(tenantId: string, entityId: string, tx: TransactionContext): Promise<any[]> {
        const logs = await tx.select({
            log: activityLogs,
            userName: users.name
        })
            .from(activityLogs)
            .leftJoin(users, eq(activityLogs.userId, users.id))
            .where(and(eq(activityLogs.tenantId, tenantId), eq(activityLogs.entityId, entityId)))
            .orderBy(desc(activityLogs.createdAt));

        return logs.map(({ log, userName }: any) => {
            let event = log.description || log.action;
            let details: any = {};

            if (log.action === 'CREATE') {
                event = 'Service Dibuat';
                try {
                    const data = JSON.parse(log.newValue as string || '{}');
                    details = {
                        customer: data.customer?.name,
                        phone: data.unit ? `${data.unit.brand} ${data.unit.model}` : null,
                        complaint: data.complaint,
                        technician: data.technicianId ? 'Assigned' : 'Belum ditugaskan',
                        isWalkin: data.isWalkin ? 'Walk-in' : 'Regular'
                    };
                } catch { }
            } else if (log.action === 'STATUS_CHANGE') {
                try {
                    const oldVal = JSON.parse(log.oldValue as string || '{}');
                    const newVal = JSON.parse(log.newValue as string || '{}');
                    event = `Status: ${oldVal.status || '-'} → ${newVal.status}`;
                    details = { from: oldVal.status, to: newVal.status };
                } catch {
                    event = log.description || 'Status changed';
                }
            } else if (log.action === 'ASSIGN') {
                event = 'Teknisi Ditugaskan';
            } else if (log.action === 'UPDATE') {
                event = 'Data Diperbarui';
            }

            return {
                event,
                by: userName || 'System',
                time: log.createdAt?.toLocaleString('id-ID', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }) || "-",
                action: log.action,
                details
            };
        });
    }
}
