import { DBContext } from "../../../../types/db-context";

export interface Role {
    id: string;
    name?: string | null;
    description?: string | null;
}

export interface IRoleRepository {
    findAll(dbOrTx?: DBContext): Promise<Role[]>;
}
