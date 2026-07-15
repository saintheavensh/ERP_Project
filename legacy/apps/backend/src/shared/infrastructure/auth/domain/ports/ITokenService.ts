/**
 * Port for issuing tokens. Use cases depend on this, not on Hono JWT.
 */

export interface TokenPayload {
    id: string;
    username: string;
    name: string;
    role: string;
    roles: string[];
    exp: number;
}

export interface AccessTokenPayload {
    id: string;
    username: string;
    name: string;
    role: string;
    roles: string[];
    sessionId: string;
    exp?: number;
}

export interface RefreshTokenPayload {
    sessionId: string;
    exp?: number;
}

export interface ITokenService {
    // Legacy method for backward compatibility
    sign(payload: TokenPayload): Promise<string>;

    // New dual-token methods
    signAccessToken(payload: AccessTokenPayload): Promise<string>;
    signRefreshToken(payload: RefreshTokenPayload): Promise<string>;
    verifyAccessToken(token: string): Promise<AccessTokenPayload>;
    verifyRefreshToken(token: string): Promise<RefreshTokenPayload>;
}
