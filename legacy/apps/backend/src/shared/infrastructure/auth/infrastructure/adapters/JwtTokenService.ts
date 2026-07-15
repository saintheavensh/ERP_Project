import { sign, verify } from "hono/jwt";
import type { ITokenService, TokenPayload, AccessTokenPayload, RefreshTokenPayload } from "../../domain";
import { appConfig } from "../../../config/AppConfig";
import { parseDuration } from "../../../utils/time/duration";

export class JwtTokenService implements ITokenService {
    // Temporary compatibility method
    async sign(payload: TokenPayload): Promise<string> {
        return await sign(payload as unknown as Record<string, unknown>, appConfig.jwtSecret);
    }

    async signAccessToken(payload: AccessTokenPayload): Promise<string> {
        const expiresInSeconds = parseDuration(appConfig.jwtAccessExpires).seconds;
        const payloadToSign = {
            ...payload,
            exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
        };
        return await sign(payloadToSign as unknown as Record<string, unknown>, appConfig.jwtAccessSecret);
    }

    async signRefreshToken(payload: RefreshTokenPayload): Promise<string> {
        const expiresInSeconds = parseDuration(appConfig.jwtRefreshExpires).seconds;
        const payloadToSign = {
            ...payload,
            exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
        };
        return await sign(payloadToSign as unknown as Record<string, unknown>, appConfig.jwtRefreshSecret);
    }

    async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
        return (await verify(token, appConfig.jwtAccessSecret, "HS256")) as unknown as AccessTokenPayload;
    }

    async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
        return (await verify(token, appConfig.jwtRefreshSecret, "HS256")) as unknown as RefreshTokenPayload;
    }
}
