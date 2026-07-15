import { eq, or, like, desc, and } from "drizzle-orm";
import { TransactionContext } from "../../../../../shared/types/db-context";
import { members, sales } from "../../../../../shared/infrastructure/database/schema";
import { ICustomerRepository, Customer, CustomerSale } from "../../domain";

export class CustomerRepositoryAdapter implements ICustomerRepository {
    async findAll(tenantId: string, tx: TransactionContext, query?: string): Promise<Customer[]> {
        if (!query) {
            return await tx.query.members.findMany({
                where: eq(members.tenantId, tenantId),
                orderBy: [desc(members.createdAt)]
            }) as Customer[];
        }

        return await tx.query.members.findMany({
            where: and(
                eq(members.tenantId, tenantId),
                or(
                    like(members.name, `%${query}%`),
                    like(members.phone, `%${query}%`)
                )
            ),
            orderBy: [desc(members.createdAt)]
        }) as Customer[];
    }

    async findById(tenantId: string, id: string, tx: TransactionContext): Promise<Customer | null> {
        const result = await tx.query.members.findFirst({
            where: and(eq(members.tenantId, tenantId), eq(members.id, id))
        });
        return (result as Customer) || null;
    }

    async findByPhone(tenantId: string, phone: string, tx: TransactionContext): Promise<Customer | null> {
        const result = await tx.query.members.findFirst({
            where: and(eq(members.tenantId, tenantId), eq(members.phone, phone))
        });
        return (result as Customer) || null;
    }

    async create(tenantId: string, data: any, tx: TransactionContext): Promise<Customer> {
        const [result] = await tx.insert(members).values({ ...data, tenantId }).returning();
        return result as Customer;
    }

    async update(tenantId: string, id: string, data: any, tx: TransactionContext): Promise<Customer> {
        const [result] = await tx.update(members)
            .set(data)
            .where(and(eq(members.tenantId, tenantId), eq(members.id, id)))
            .returning();
        return result as Customer;
    }

    async delete(tenantId: string, id: string, tx: TransactionContext): Promise<void> {
        await tx.delete(members).where(and(eq(members.tenantId, tenantId), eq(members.id, id)));
    }

    async findSales(tenantId: string, memberId: string, tx: TransactionContext): Promise<CustomerSale[]> {
        return await tx.query.sales.findMany({
            where: and(eq(sales.tenantId, tenantId), eq(sales.memberId, memberId)),
            orderBy: [desc(sales.createdAt)],
            with: {
                payments: true
            }
        }) as CustomerSale[];
    }

    async findUnpaidSales(tenantId: string, memberId: string, tx: TransactionContext): Promise<CustomerSale[]> {
        return await tx.query.sales.findMany({
            where: and(
                eq(sales.tenantId, tenantId),
                eq(sales.memberId, memberId),
                or(eq(sales.paymentStatus, "unpaid"), eq(sales.paymentStatus, "partial"))
            ),
            orderBy: [desc(sales.createdAt)],
            with: {
                payments: true
            }
        }) as CustomerSale[];
    }
}
