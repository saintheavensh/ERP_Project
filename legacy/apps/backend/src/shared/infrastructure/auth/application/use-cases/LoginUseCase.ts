import type { IUserRepository, UserWithRoles, IPasswordService, ITokenService } from "../../domain";

export interface LoginInput {
    username: string;
    password: string;
    roleId?: string;
    roleBehaviorMode?: 'strict' | 'flexible';
    dbOrTx?: unknown;
}

export type LoginResult = {
    requiresRoleSelection: boolean;
    availableRoles?: string[];
    user?: Omit<UserWithRoles, "password" | "roles"> & { roles: string[] };
    accessToken?: string;
    refreshToken?: string;
};

import { appConfig } from "../../../config/AppConfig";
import { parseDuration } from "../../../utils/time/duration";

export class LoginUseCase {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly passwordVerifier: IPasswordService,
        private readonly tokenIssuer: ITokenService
    ) { }

    async execute(input: LoginInput): Promise<LoginResult> {
        const user = await this.userRepository.findByUsername(input.username, input.dbOrTx);

        if (!user) {
            throw new Error("Invalid username or password");
        }

        const isMatch = await this.passwordVerifier.verify(input.password, user.password);
        if (!isMatch) {
            throw new Error("Invalid username or password");
        }

        let userRoles = (user as UserWithRoles).roles?.map((ur: { role: { id: string } }) => ur.role.id) || [];
        if (userRoles.length === 0 && user.role) {
            userRoles = [user.role];
        }

        const isStrict = input.roleBehaviorMode === 'strict';

        if (isStrict) {
            // Strict Mode: Must have a selected role if multiple available
            if (userRoles.length > 1 && !input.roleId) {
                return {
                    requiresRoleSelection: true,
                    availableRoles: userRoles
                };
            }

            const selectedRole = input.roleId && userRoles.includes(input.roleId) ? input.roleId : userRoles[0];
            const sessionId = await this.userRepository.createSession(user.id, selectedRole, input.dbOrTx);

            const accessToken = await this.tokenIssuer.signAccessToken({
                id: user.id,
                sessionId: sessionId,
                username: user.username,
                name: user.name,
                role: selectedRole,
                roles: userRoles
            });

            const refreshToken = await this.tokenIssuer.signRefreshToken({
                sessionId: sessionId
            });

            const hashedRefreshToken = await this.passwordVerifier.hash(refreshToken);
            const expiresAt = new Date(Date.now() + parseDuration(appConfig.jwtRefreshExpires).ms);

            await this.userRepository.updateRefreshToken(sessionId, hashedRefreshToken, expiresAt, input.dbOrTx);

            const { password: _p, ...userWithoutPassword } = user;

            return {
                requiresRoleSelection: false,
                user: { ...userWithoutPassword, roles: userRoles },
                accessToken,
                refreshToken
            };
        } else {
            // Flexible Mode: Automatically accept and grant all roles, optionally setting primary
            const selectedRole = input.roleId && userRoles.includes(input.roleId) ? input.roleId :
                (userRoles.includes("owner") ? "owner" : userRoles[0]);
            const sessionId = await this.userRepository.createSession(user.id, selectedRole, input.dbOrTx);

            const accessToken = await this.tokenIssuer.signAccessToken({
                id: user.id,
                sessionId: sessionId,
                username: user.username,
                name: user.name,
                role: selectedRole,
                roles: userRoles
            });

            const refreshToken = await this.tokenIssuer.signRefreshToken({
                sessionId: sessionId
            });

            const hashedRefreshToken = await this.passwordVerifier.hash(refreshToken);
            const expiresAt = new Date(Date.now() + parseDuration(appConfig.jwtRefreshExpires).ms);

            await this.userRepository.updateRefreshToken(sessionId, hashedRefreshToken, expiresAt, input.dbOrTx);

            const { password: _p, ...userWithoutPassword } = user;

            return {
                requiresRoleSelection: false,
                user: { ...userWithoutPassword, roles: userRoles },
                accessToken,
                refreshToken
            };
        }
    }
}
