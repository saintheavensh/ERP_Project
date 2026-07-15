import type { ITokenService, IUserRepository } from "../../domain";

export interface SwitchRoleInput {
    userPayload: any; // The current decoded JWT payload
    targetRoleId: string;
}

export interface SwitchRoleResult {
    accessToken: string;
    role: string;
}

export class SwitchRoleUseCase {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly tokenIssuer: ITokenService
    ) { }

    async execute(input: SwitchRoleInput): Promise<SwitchRoleResult> {
        const { userPayload, targetRoleId } = input;
        const availableRoles: string[] = userPayload.roles || [];

        if (!availableRoles.includes(targetRoleId)) {
            throw new Error("Invalid target role");
        }

        // Fix: Force the DB session to also update so next /refresh uses this new active role
        await this.userRepository.updateSessionRole(userPayload.sessionId, targetRoleId);

        const accessToken = await this.tokenIssuer.signAccessToken({
            id: userPayload.id,
            sessionId: userPayload.sessionId,
            username: userPayload.username,
            name: userPayload.name,
            role: targetRoleId,
            roles: availableRoles
        });

        return { accessToken, role: targetRoleId };
    }
}
