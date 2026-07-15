import { db } from "../../../shared/infrastructure/database/client";
import { SharedTransactionAuthority } from "../application/services/shared-transaction-authority";
import { UserRepositoryAdapter } from "./infrastructure";
import {
    GetUsersUseCase,
    GetUserByIdUseCase,
    CreateUserUseCase,
    UpdateUserUseCase,
    DeleteUserUseCase
} from "./application";
import { User, CreateUserData, UpdateUserData } from "./domain";

// Authority
const authority = new SharedTransactionAuthority(db as any);

// Infrastructure adapters
const repository = new UserRepositoryAdapter();

// Use cases
const getUsersUC = new GetUsersUseCase(repository);
const getUserByIdUC = new GetUserByIdUseCase(repository);
const createUserUC = new CreateUserUseCase(repository);
const updateUserUC = new UpdateUserUseCase(repository);
const deleteUserUC = new DeleteUserUseCase(repository);

/**
 * UsersService — facade for external and presentation layers.
 */
export class UsersService {
    constructor(private readonly authority: SharedTransactionAuthority) { }

    async findAll(tenantId: string, role?: string): Promise<User[]> {
        return await this.authority.execute({ tenantId }, async (tx) => {
            return await getUsersUC.execute(tenantId, role, tx);
        });
    }

    async getById(tenantId: string, id: string): Promise<User> {
        return await this.authority.execute({ tenantId }, async (tx) => {
            return await getUserByIdUC.execute(tenantId, id, tx);
        });
    }

    async create(tenantId: string, data: CreateUserData): Promise<User> {
        return await this.authority.execute({ tenantId }, async (tx) => {
            return await createUserUC.execute(tenantId, data, tx);
        });
    }

    async update(tenantId: string, id: string, data: UpdateUserData): Promise<User> {
        return await this.authority.execute({ tenantId }, async (tx) => {
            return await updateUserUC.execute(tenantId, id, data, tx);
        });
    }

    async delete(tenantId: string, id: string): Promise<void> {
        return await this.authority.execute({ tenantId }, async (tx) => {
            return await deleteUserUC.execute(tenantId, id, tx);
        });
    }
}

/** Singleton service instance */
export const usersService = new UsersService(authority);
