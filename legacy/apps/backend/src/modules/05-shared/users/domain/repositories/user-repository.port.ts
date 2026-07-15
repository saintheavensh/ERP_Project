import { DBContext } from "../../../../../shared/types/db-context";
import { User, CreateUserData, UpdateUserData } from "../entities/user.entity";

export interface IUserRepository {
    findAll(tenantId: string, tx: DBContext, role?: string): Promise<User[]>;
    findById(tenantId: string, id: string, tx: DBContext): Promise<User | null>;
    create(tenantId: string, data: Omit<CreateUserData, 'roles'>, tx: DBContext): Promise<User>;
    update(tenantId: string, id: string, data: Omit<UpdateUserData, 'roles'>, tx: DBContext): Promise<User>;
    delete(tenantId: string, id: string, tx: DBContext): Promise<void>;

    // Role synchronization
    syncRoles(tenantId: string, userId: string, roles: string[], tx: DBContext): Promise<void>;
}
