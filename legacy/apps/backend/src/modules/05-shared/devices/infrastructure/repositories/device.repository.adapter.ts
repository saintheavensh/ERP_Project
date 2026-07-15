import { devices, products, productDeviceCompatibility } from "../../../../../shared/infrastructure/database/schema";
import { eq, or, and, sql, inArray, ilike, desc, isNull } from "drizzle-orm";
import { DBContext } from "../../../../../shared/types/db-context";
import { IDeviceRepository, IDeviceFilters, Device, CreateDeviceData, UpdateDeviceData } from "../../domain";

export class DeviceRepositoryAdapter implements IDeviceRepository {
    async findAll(tenantId: string, filters: IDeviceFilters, tx: DBContext): Promise<Device[]> {
        const { search, limit = 50, offset = 0, brand } = filters;

        // Base query with tenant filter
        const conditions = [eq(devices.tenantId, tenantId)];
        const term = search?.trim();

        if (term) {
            conditions.push(
                or(
                    sql`${devices.brand} || ' ' || ${devices.model} ILIKE ${"%" + term + "%"}`,
                    ilike(devices.brand, `%${term}%`),
                    ilike(devices.model, `%${term}%`),
                    ilike(devices.code, `%${term}%`)
                )
            );
        }

        if (brand) {
            conditions.push(ilike(devices.brand, brand.trim()));
        }

        const combinedName = sql`${devices.brand} || ' ' || ${devices.model}`;

        let results;
        const baseWhere = and(...conditions);
        if (!baseWhere) throw new Error("Tenant invariant violation: No conditions provided for device query.");

        if (term) {
            results = await tx.select().from(devices)
                .where(baseWhere)
                .orderBy(
                    sql`CASE 
                        WHEN ${devices.model} ILIKE ${term} THEN 1
                        WHEN ${combinedName} ILIKE ${term + "%"} THEN 2
                        WHEN ${devices.model} ILIKE ${term + "%"} THEN 3
                        WHEN ${combinedName} ILIKE ${"%" + term + "%"} THEN 4
                        WHEN ${devices.code} ILIKE ${"%" + term + "%"} THEN 5
                        ELSE 6
                    END`,
                    desc(devices.createdAt)
                )
                .limit(limit)
                .offset(offset);
        } else {
            results = await tx.select().from(devices)
                .where(baseWhere)
                .orderBy(desc(devices.createdAt))
                .limit(limit)
                .offset(offset);
        }

        return results as Device[];
    }

    async findById(tenantId: string, id: string, tx: DBContext): Promise<Device | null> {
        const result = await tx.select()
            .from(devices)
            .where(and(eq(devices.tenantId, tenantId), eq(devices.id, id)));
        return (result[0] as Device) || null;
    }

    async create(tenantId: string, data: CreateDeviceData, tx: DBContext): Promise<Device> {
        const result = await tx.insert(devices)
            .values({ ...data, tenantId })
            .returning();
        return result[0] as Device;
    }

    async update(tenantId: string, id: string, data: UpdateDeviceData, tx: DBContext): Promise<Device> {
        const result = await tx
            .update(devices)
            .set({ ...data, updatedAt: new Date() })
            .where(and(eq(devices.tenantId, tenantId), eq(devices.id, id)))
            .returning();
        return result[0] as Device;
    }

    async delete(tenantId: string, id: string, tx: DBContext): Promise<Device> {
        const result = await tx.delete(devices)
            .where(and(eq(devices.tenantId, tenantId), eq(devices.id, id)))
            .returning();
        return result[0] as Device;
    }

    async bulkDelete(tenantId: string, ids: string[], tx: DBContext): Promise<Device[]> {
        return await tx.delete(devices)
            .where(and(eq(devices.tenantId, tenantId), inArray(devices.id, ids)))
            .returning() as Device[];
    }

    async getUnlinkedProducts(tenantId: string, limit: number = 50, offset: number = 0, tx: DBContext): Promise<any[]> {
        return await tx.select({
            id: products.id,
            name: products.name,
            sku: products.sku,
            stock: products.stock,
            image: products.image
        })
            .from(products)
            .leftJoin(productDeviceCompatibility, eq(products.id, productDeviceCompatibility.productId))
            .where(and(
                eq(products.tenantId, tenantId),
                isNull(productDeviceCompatibility.productId)
            ))
            .limit(limit)
            .offset(offset);
    }

    async findProductsByName(tenantId: string, name: string, tx: DBContext): Promise<any[]> {
        return await tx.select().from(products)
            .where(and(
                eq(products.tenantId, tenantId),
                ilike(products.name, `%${name}%`)
            ));
    }

    async addCompatibilityLinks(tenantId: string, links: { productId: string; deviceId: string }[], tx: DBContext): Promise<void> {
        if (links.length === 0) return;

        const valuesToInsert = links.map(link => ({
            ...link,
            tenantId
        }));

        await tx.insert(productDeviceCompatibility)
            .values(valuesToInsert)
            .onConflictDoNothing();
    }
}
