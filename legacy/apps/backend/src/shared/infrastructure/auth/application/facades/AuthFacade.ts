import { Result } from "../../../../core/Result";
import { LoginUseCase, LoginInput, LoginResult } from "../use-cases/LoginUseCase";
import { GetCurrentUserUseCase } from "../use-cases/GetCurrentUserUseCase";
import { GetRolesUseCase } from "../use-cases/GetRolesUseCase";
import { GetRolePermissionsUseCase } from "../use-cases/GetRolePermissionsUseCase";
import type { IUserRepository } from "../../domain";
import { injectable, inject } from "inversify";

@injectable()
export class AuthFacade {
    constructor(
        private readonly loginUseCase: LoginUseCase,
        private readonly getCurrentUserUseCase: GetCurrentUserUseCase,
        private readonly getRolesUseCase: GetRolesUseCase,
        private readonly userRepository: IUserRepository,
        private readonly getRolePermissionsUseCase: GetRolePermissionsUseCase
    ) { }

    async login(input: LoginInput): Promise<LoginResult> {
        return await this.loginUseCase.execute(input);
    }

    async getCurrentUser(id: string) {
        return await this.getCurrentUserUseCase.execute({ userId: id });
    }

    async getRoles() {
        return await this.getRolesUseCase.execute();
    }

    async validateSession(sessionId: string) {
        return await this.userRepository.validateSession(sessionId);
    }

    async getRolePermissions(roleId: string): Promise<string[]> {
        return await this.getRolePermissionsUseCase.execute({ roleId });
    }

    clearPermissionCache() {
        this.getRolePermissionsUseCase.clearCache();
    }

    invalidateRolePermissions(roleId: string) {
        this.getRolePermissionsUseCase.invalidateRole(roleId);
    }
}
