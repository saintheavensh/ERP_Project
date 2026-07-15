import { injectable } from "inversify";
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as legacySchema from "./schema";
import * as products from "../../../modules/02-inventory/products/infrastructure/schema/ProductSchema";
import * as categories from "../../../modules/02-inventory/categories/infrastructure/schema/CategorySchema";
import * as inventoryBatches from "../../../modules/02-inventory/inventory/infrastructure/schema/BatchSchema";
import * as inventoryVariants from "../../../modules/02-inventory/inventory/infrastructure/schema/VariantSchema";
import * as inventoryOpname from "../../../modules/02-inventory/inventory/infrastructure/schema/StockOpnameSchema";
import * as defectiveItems from "../../../modules/02-inventory/inventory/infrastructure/schema/DefectiveItemSchema";
import { appConfig } from "../config/AppConfig";

const schema = {
    ...legacySchema,
    ...products,
    ...categories,
    ...inventoryBatches,
    ...inventoryVariants,
    ...inventoryOpname,
    ...defectiveItems,
};

/**
 * DrizzleClient
 * Wrapper around the Drizzle ORM client to allow for dependency injection.
 */
@injectable()
export class DrizzleClient {
    private db: NodePgDatabase<typeof schema>;

    constructor() {
        const connectionString = appConfig.databaseUrl;
        const pool = new Pool({
            connectionString,
        });
        this.db = drizzle(pool, { schema });
    }

    /**
     * Returns the underlying Drizzle client instance.
     */
    public getClient(): NodePgDatabase<typeof schema> {
        return this.db;
    }

    /**
     * Executes a callback within a database transaction.
     */
    public async transaction<T>(callback: (tx: any) => Promise<T>): Promise<T> {
        return await this.db.transaction(callback);
    }
}
