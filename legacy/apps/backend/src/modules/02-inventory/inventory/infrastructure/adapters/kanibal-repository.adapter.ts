import { eq, desc } from "drizzle-orm";
import { TransactionContext } from "@shared/types/db-context";
import { forfeitedDevices, partHarvestLogs } from "../schema/GamblingSchema";
import { IKanibalRepository, ForfeitedDevice, PartHarvestLog, ForfeitedDeviceStatus, KanibalFilters } from "@domain/repositories/kanibal-repository.port";

export class KanibalRepositoryAdapter implements IKanibalRepository {
    async saveForfeitedDevice(device: Partial<ForfeitedDevice>, tx: TransactionContext): Promise<ForfeitedDevice> {
        // Drizzle schema .values() expects exact column types; domain Partial differs
        const [result] = await tx.insert(forfeitedDevices).values(device as unknown as typeof forfeitedDevices.$inferInsert).returning();
        return result as unknown as ForfeitedDevice;
    }

    async saveHarvestLog(log: Partial<PartHarvestLog>, tx: TransactionContext): Promise<PartHarvestLog> {
        const [result] = await tx.insert(partHarvestLogs).values(log as typeof partHarvestLogs.$inferInsert).returning();
        return result as unknown as PartHarvestLog;
    }

    async findForfeitedDevices(tx: TransactionContext, _filters?: KanibalFilters): Promise<ForfeitedDevice[]> {
        const rows = await tx.query.forfeitedDevices.findMany({
            orderBy: [desc(forfeitedDevices.forfeitedDate)]
        });
        return rows as unknown as ForfeitedDevice[];
    }

    async findForfeitedDeviceById(id: string, tx: TransactionContext): Promise<ForfeitedDevice | null> {
        const result = await tx.query.forfeitedDevices.findFirst({
            where: eq(forfeitedDevices.id, id)
        });
        return (result as unknown as ForfeitedDevice) ?? null;
    }

    async updateForfeitedStatus(id: string, status: ForfeitedDeviceStatus, tx: TransactionContext): Promise<void> {
        await tx.update(forfeitedDevices)
            .set({ status })
            .where(eq(forfeitedDevices.id, id));
    }
}
