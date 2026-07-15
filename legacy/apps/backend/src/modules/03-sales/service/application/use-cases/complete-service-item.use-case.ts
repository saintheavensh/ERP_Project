import { TransactionContext } from "../../../../../shared/types/db-context";
import { IServiceItemRepository } from "../../domain/repositories/service-item-repository.port";
import { IServicePartRepository } from "../../domain/repositories/service-part-repository.port";
import { eq, sql } from "drizzle-orm";
import { productBatches } from "../../../../02-inventory/inventory/infrastructure/schema/BatchSchema";
import { HTTPException } from "hono/http-exception";
import { ICommissionSettingsRepository, ICommissionRepository } from "../../domain/repositories/commission-repository.port";
import { IServiceTypeRepository } from "../../domain/repositories/service-type-repository.port";
import { CommissionCalculator } from "../../domain/services/commission-calculator.service";

export class CompleteServiceItemUseCase {
    constructor(
        private readonly itemRepository: IServiceItemRepository,
        private readonly partRepository: IServicePartRepository,
        private readonly commissionSettingsRepo: ICommissionSettingsRepository,
        private readonly commissionRepo: ICommissionRepository,
        private readonly typeRepo: IServiceTypeRepository
    ) { }

    async execute(tenantId: string, itemId: string, tx: TransactionContext) {
        const item = await this.itemRepository.findById(tenantId, itemId, tx);
        if (!item) throw new HTTPException(404, { message: "Service item not found" });
        if (item.status === 'COMPLETED') throw new HTTPException(400, { message: "Item is already completed" });

        const parts = await this.partRepository.findByServiceItemId(tenantId, itemId, tx);

        // Deduct from batches
        for (const part of parts) {
            if (part.variantBatchId) {
                await tx.update(productBatches)
                    .set({ currentStock: sql`${productBatches.currentStock} - ${part.quantity}` })
                    .where(eq(productBatches.id, part.variantBatchId));
            }
        }

        // Calculate actual cost based on parts if not set manually
        const newActualCost = parts.reduce((acc, part) => acc + (part.sellingPrice * part.quantity), 0);

        await this.itemRepository.update(tenantId, itemId, {
            status: "COMPLETED",
            completedAt: new Date(),
            actualCost: item.actualCost || newActualCost
        }, tx);

        // Calculate and record Commission
        if (item.technicianId && item.serviceTypeId) {
            const setting = await this.commissionSettingsRepo.findByTechnicianId(tenantId, item.technicianId, tx);
            const serviceType = await this.typeRepo.findById(tenantId, item.serviceTypeId, tx);

            if (setting && serviceType) {
                const commissionAmount = CommissionCalculator.calculate(
                    setting,
                    { ...item, actualCost: item.actualCost || newActualCost },
                    serviceType
                );

                if (commissionAmount > 0) {
                    await this.commissionRepo.create(tenantId, {
                        technicianId: item.technicianId,
                        serviceItemId: itemId,
                        commissionType: setting.commissionType,
                        baseAmount: item.actualCost || newActualCost,
                        commissionAmount,
                    }, tx);
                }
            }
        }

        return { message: "Service item completed" };
    }
}
