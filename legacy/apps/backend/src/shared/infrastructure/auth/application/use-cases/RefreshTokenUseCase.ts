import type { IUserRepository, ITokenService, IPasswordService } from "../../domain";
import { appConfig } from "../../../config/AppConfig";
import { parseDuration } from "../../../utils/time/duration";

export interface RefreshTokenInput {
    refreshToken: string;
}

export interface RefreshTokenResult {
    accessToken: string;
    refreshToken: string;
}

export class RefreshTokenUseCase {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly tokenIssuer: ITokenService,
        private readonly passwordVerifier: IPasswordService
    ) { }

    async execute(input: RefreshTokenInput): Promise<RefreshTokenResult> {
        if (!input.refreshToken) throw new Error("Refresh token missing");

        let payload;
        try {
            payload = await this.tokenIssuer.verifyRefreshToken(input.refreshToken);
        } catch (e) {
            throw new Error("Invalid or expired refresh token");
        }

        if (!payload || !payload.sessionId) throw new Error("Invalid refresh token payload");

        const session = await this.userRepository.validateSession(payload.sessionId);

        // Replay/Rotation Check: If session exists but refreshToken is null or doesn't match the hash,
        // it signifies a reused token (or compromised session). We MUST terminate it.
        if (!session) {
            throw new Error("Session is no longer active");
        }

        if (!session.refreshToken) {
            await this.userRepository.deactivateSession(session.id);
            throw new Error("Session compromised: token reused");
        }

        const isValidHash = await this.passwordVerifier.verify(input.refreshToken, session.refreshToken);
        if (!isValidHash) {
            // Replay attack! Someone is trying to use an old token. Terminate session.
            await this.userRepository.deactivateSession(session.id);
            throw new Error("Session compromised: token reused");
        }

        const user = await this.userRepository.findById(session.userId);
        if (!user) {
            await this.userRepository.deactivateSession(session.id);
            throw new Error("User not found for session");
        }

        const userRoles = user.roles?.map((ur: { role: { id: string } }) => ur.role.id) || [];
        const role = session.role;

        // Sign new Access Token
        const accessToken = await this.tokenIssuer.signAccessToken({
            id: user.id,
            sessionId: session.id,
            username: user.username,
            name: user.name,
            role: role,
            roles: userRoles
        });

        // Sign new Refresh Token (Rotation)
        const newRefreshToken = await this.tokenIssuer.signRefreshToken({
            sessionId: session.id
        });

        // Hash it before throwing in DB
        const hashedRefreshToken = await this.passwordVerifier.hash(newRefreshToken);
        const expiresAt = new Date(Date.now() + parseDuration(appConfig.jwtRefreshExpires).ms);

        await this.userRepository.updateRefreshToken(session.id, hashedRefreshToken, expiresAt);

        // We technically need to return the new refresh token so the controller can set it in the cookie too
        // Let's modify the return type in the interface
        return { accessToken, refreshToken: newRefreshToken };
    }
}
