import { db } from "../../../../../shared/infrastructure/database/client";
import { roles } from "../../../../../shared/infrastructure/database/schema";
import { IRoleRepository, Role } from "../../domain";

export class DrizzleRoleRepository implements IRoleRepository {
    async findAll(dbOrTx: any = db): Promise<Role[]> {
        return await dbOrTx.select().from(roles);
    }
}
