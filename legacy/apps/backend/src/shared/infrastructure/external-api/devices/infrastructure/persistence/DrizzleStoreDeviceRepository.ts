import { eq } from "drizzle-orm";
import { inject, injectable } from "inversify";
import { Result } from "../../../../../core/Result";
import { StoreDevice } from "../../domain/entities/StoreDevice.entity";
import { IStoreDeviceRepository } from "../../domain/ports/IStoreDeviceRepository";
import { storeDeviceTable, StoreDeviceRow } from "../schema";
import { TYPES } from "../../../../../core/types";

@injectable()
export class DrizzleStoreDeviceRepository implements IStoreDeviceRepository {
    constructor(
        @inject(TYPES.DrizzleClient) private db: any
    ) { }

    async findById(id: string): Promise<Result<StoreDevice>> {
        try {
            const client = this.db.getClient ? this.db.getClient() : this.db;
            const result = await client
                .select()
                .from(storeDeviceTable)
                .where(eq(storeDeviceTable.id, id))
                .limit(1);

            if (result.length === 0) {
                return Result.fail(`Store device with id ${id} not found`);
            }

            return this.toDomain(result[0]);
        } catch (error: any) {
            return Result.fail(`Database error: ${error.message}`);
        }
    }

    async findByDeviceId(deviceId: string): Promise<Result<StoreDevice>> {
        try {
            const client = this.db.getClient ? this.db.getClient() : this.db;
            const result = await client
                .select()
                .from(storeDeviceTable)
                .where(eq(storeDeviceTable.deviceId, deviceId))
                .limit(1);

            if (result.length === 0) {
                return Result.fail(`Store device with deviceId ${deviceId} not found`);
            }

            return this.toDomain(result[0]);
        } catch (error: any) {
            return Result.fail(`Database error: ${error.message}`);
        }
    }

    async findByStore(storeId: string): Promise<Result<StoreDevice[]>> {
        try {
            const client = this.db.getClient ? this.db.getClient() : this.db;
            const results = await client
                .select()
                .from(storeDeviceTable)
                .where(eq(storeDeviceTable.storeId, storeId));

            return this.toDomainList(results);
        } catch (error: any) {
            return Result.fail(`Database error: ${error.message}`);
        }
    }

    async findByStatus(status: string): Promise<Result<StoreDevice[]>> {
        try {
            const client = this.db.getClient ? this.db.getClient() : this.db;
            const results = await client
                .select()
                .from(storeDeviceTable)
                .where(eq(storeDeviceTable.status, status));

            return this.toDomainList(results);
        } catch (error: any) {
            return Result.fail(`Database error: ${error.message}`);
        }
    }

    async save(device: StoreDevice): Promise<Result<void>> {
        try {
            const client = this.db.getClient ? this.db.getClient() : this.db;
            const data = this.toPersistence(device);

            await client
                .insert(storeDeviceTable)
                .values(data)
                .onConflictDoUpdate({
                    target: storeDeviceTable.deviceId,
                    set: {
                        name: data.name,
                        status: data.status,
                        lastPingAt: data.lastPingAt,
                        firmwareVersion: data.firmwareVersion,
                        metadata: data.metadata,
                        updatedAt: new Date()
                    }
                });

            return Result.ok();
        } catch (error: any) {
            return Result.fail(`Database error: ${error.message}`);
        }
    }

    async delete(id: string): Promise<Result<boolean>> {
        try {
            const client = this.db.getClient ? this.db.getClient() : this.db;
            const result = await client
                .delete(storeDeviceTable)
                .where(eq(storeDeviceTable.id, id));

            return Result.ok((result as any).rowCount > 0);
        } catch (error: any) {
            return Result.fail(`Database error: ${error.message}`);
        }
    }

    private toDomain(row: StoreDeviceRow): Result<StoreDevice> {
        return StoreDevice.create({
            deviceId: row.deviceId,
            name: row.name,
            type: row.type as any,
            storeId: row.storeId as any,
            firmwareVersion: row.firmwareVersion || "",
            metadata: row.metadata as any
        }, row.id);
    }

    private toDomainList(rows: StoreDeviceRow[]): Result<StoreDevice[]> {
        const devices: StoreDevice[] = [];
        for (const row of rows) {
            const deviceResult = this.toDomain(row);
            if (deviceResult.isSuccess) {
                devices.push(deviceResult.getValue());
            }
        }
        return Result.ok(devices);
    }

    private toPersistence(device: StoreDevice): any {
        return {
            id: device.id,
            deviceId: device.deviceId,
            name: device.name,
            type: device.type,
            storeId: device.storeId,
            status: device.status,
            lastPingAt: device.lastPingAt,
            firmwareVersion: device.firmwareVersion,
            metadata: device.metadata,
            createdAt: device.createdAt,
            updatedAt: device.updatedAt
        };
    }
}
