import { eq, desc, inArray } from "drizzle-orm";
import { TransactionContext } from "../../../../../shared/types/db-context";
import { defectiveItems } from "../../../../../shared/infrastructure/database/schema";
import { IDefectiveItemRepository, DefectiveItem, DefectiveItemStatus } from "../../domain";

export class DefectiveItemRepositoryAdapter implements IDefectiveItemRepository {
    async findAll(status: DefectiveItemStatus | undefined, tx: TransactionContext): Promise<DefectiveItem[]> {
        const results = await tx.query.defectiveItems.findMany({
            where: status ? eq(defectiveItems.status, status) : undefined,
            with: {
                product: true,
                batch: {
                    with: {
                        supplier: true
                    }
                },
                supplier: true
            },
            orderBy: [desc(defectiveItems.createdAt)]
        });
        return results as DefectiveItem[];
    }

    async findByIds(ids: string[], tx: TransactionContext): Promise<DefectiveItem[]> {
        const results = await tx.query.defectiveItems.findMany({
            where: inArray(defectiveItems.id, ids),
            with: {
                batch: true
            }
        });
        return results as DefectiveItem[];
    }

    async create(data: any, tx: TransactionContext): Promise<DefectiveItem> {
        const [result] = await tx.insert(defectiveItems).values(data).returning();
        return result as DefectiveItem;
    }

    async updateStatus(ids: string[], status: DefectiveItemStatus, tx: TransactionContext): Promise<void> {
        await tx.update(defectiveItems)
            .set({ status })
            .where(inArray(defectiveItems.id, ids));
    }
}
