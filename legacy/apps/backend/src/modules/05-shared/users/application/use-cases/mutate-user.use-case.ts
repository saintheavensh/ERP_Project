import { DBContext } from "../../../../../shared/types/db-context";
import { IUserRepository, User, CreateUserData, UpdateUserData } from "../../domain";
import { HTTPException } from "hono/http-exception";

export class CreateUserUseCase {
    constructor(private readonly repository: IUserRepository) { }

    async execute(tenantId: string, data: CreateUserData, tx: DBContext): Promise<User> {
        const { roles, ...userData } = data;

        const user = await this.repository.create(tenantId, userData, tx);

        if (roles && roles.length > 0) {
            await this.repository.syncRoles(tenantId, user.id, roles, tx);
        }

        return await this.repository.findById(tenantId, user.id, tx) as User;
    }
}

export class UpdateUserUseCase {
    constructor(private readonly repository: IUserRepository) { }

    async execute(tenantId: string, id: string, data: UpdateUserData, tx: DBContext): Promise<User> {
        const { roles, ...userData } = data;

        const existing = await this.repository.findById(tenantId, id, tx);
        if (!existing) {
            throw new HTTPException(404, { message: "User not found" });
        }

        await this.repository.update(tenantId, id, userData, tx);

        if (roles !== undefined) {
            await this.repository.syncRoles(tenantId, id, roles, tx);
        }

        return await this.repository.findById(tenantId, id, tx) as User;
    }
}

export class DeleteUserUseCase {
    constructor(private readonly repository: IUserRepository) { }

    async execute(tenantId: string, id: string, tx: DBContext): Promise<void> {
        const existing = await this.repository.findById(tenantId, id, tx);
        if (!existing) {
            throw new HTTPException(404, { message: "User not found" });
        }
        await this.repository.delete(tenantId, id, tx);
    }
}
