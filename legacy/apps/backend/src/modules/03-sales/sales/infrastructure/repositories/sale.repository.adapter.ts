import { eq, desc, and } from "drizzle-orm";
import { TransactionContext } from "../../../../../shared/types/db-context";
import { sales, saleItems, salePayments } from "../../../../../shared/infrastructure/database/schema";
import { ISaleRepository, Sale } from "../../domain";

export class SaleRepositoryAdapter implements ISaleRepository {
    async findAll(tenantId: string, params: { startDate?: Date | undefined; endDate?: Date | undefined; search?: string | undefined; limit?: number | undefined }, tx: TransactionContext): Promise<Sale[]> {
        const { startDate, endDate, search, limit = 50 } = params;

        const results = await tx.query.sales.findMany({
            where: (sales: any, { and: andOp, gte, lte, or, like, eq: eqOp }: any) => {
                const conditions = [eqOp(sales.tenantId, tenantId)];
                if (startDate) conditions.push(gte(sales.createdAt, startDate));
                if (endDate) conditions.push(lte(sales.createdAt, endDate));
                if (search) {
                    conditions.push(or(
                        like(sales.id, `%${search}%`),
                        like(sales.customerName, `%${search}%`)
                    ));
                }
                return andOp(...conditions);
            },
            orderBy: [desc(sales.createdAt)],
            with: {
                user: true,
                member: true,
                items: {
                    with: {
                        product: true
                    }
                }
            },
            limit: limit
        });

        return results.map((sale: any) => ({
            ...sale,
            finalAmount: sale.totalAmount - (sale.discountAmount || 0),
            items: sale.items.map((item: any) => ({
                ...item,
                subtotal: item.qty * item.price
            }))
        })) as Sale[];
    }

    async findById(tenantId: string, id: string, tx: TransactionContext): Promise<Sale | null> {
        const sale = await tx.query.sales.findFirst({
            where: and(eq(sales.tenantId, tenantId), eq(sales.id, id)),
            with: {
                user: true,
                member: true,
                items: {
                    with: {
                        product: true,
                        batch: true
                    }
                },
                payments: true
            }
        });

        if (!sale) return null;

        return {
            ...sale,
            finalAmount: sale.totalAmount - (sale.discountAmount || 0),
            items: sale.items.map((item: any) => ({
                ...item,
                subtotal: item.qty * item.price
            }))
        } as Sale;
    }

    async create(tenantId: string, sale: any, tx: TransactionContext): Promise<void> {
        await tx.insert(sales).values({ ...sale, tenantId });
    }

    async createItem(tenantId: string, item: any, tx: TransactionContext): Promise<void> {
        await tx.insert(saleItems).values({ ...item, tenantId });
    }

    async createPayment(tenantId: string, payment: any, tx: TransactionContext): Promise<void> {
        await tx.insert(salePayments).values({ ...payment, tenantId });
    }
}
