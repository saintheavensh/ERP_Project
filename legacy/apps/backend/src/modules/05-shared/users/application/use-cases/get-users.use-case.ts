import { DBContext } from "../../../../../shared/types/db-context";
import { IUserRepository, User } from "../../domain";
import { HTTPException } from "hono/http-exception";

export class GetUsersUseCase {
    constructor(private readonly repository: IUserRepository) { }

    async execute(tenantId: string, role: string | undefined, tx: DBContext): Promise<User[]> {
        return await this.repository.findAll(tenantId, tx, role);
    }
}

export class GetUserByIdUseCase {
    constructor(private readonly repository: IUserRepository) { }

    async execute(tenantId: string, id: string, tx: DBContext): Promise<User> {
        const user = await this.repository.findById(tenantId, id, tx);
        if (!user) {
            throw new HTTPException(404, { message: "User not found" });
        }
        return user;
    }
}
