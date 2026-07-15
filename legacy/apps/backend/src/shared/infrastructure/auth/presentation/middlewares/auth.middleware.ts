import { createMiddleware } from "hono/factory";
import { verify } from "hono/jwt";
import { getCookie } from "hono/cookie";
import { apiError } from "../../../../application/middlewares/ResponseHelpers";
import { appConfig } from "../../../../infrastructure/config/AppConfig";
import { authFacade } from "../../AuthContainer";

export const authMiddleware = createMiddleware(async (c, next) => {
    const JWT_SECRET = appConfig.jwtAccessSecret;

    // Preferred: access_token cookie
    let token = getCookie(c, "access_token");

    // Fallback: Authorization header for API clients
    if (!token) {
        const authHeader = c.req.header("Authorization");
        if (authHeader) {
            token = authHeader.split(" ")[1];
        }
    }

    if (!token) {
        return apiError(c, "No token provided", "Unauthorized", 401);
    }

    let payload: any;
    try {
        payload = await verify(token, JWT_SECRET, "HS256");
    } catch (e: any) {
        return apiError(c, e, "Invalid Token", 401);
    }

    // Critical Patch: sessionId MUST exist
    if (!payload.sessionId) {
        return apiError(c, "Malformed or legacy token.", "Unauthorized", 401);
    }

    // Clean Architecture Patch: Route through Facade
    const session = await authFacade.validateSession(payload.sessionId);

    if (!session || !session.isActive) {
        console.log(`[AuthMiddleware] Session denied or inactive for: ${payload.sessionId}`);
        return apiError(c, "Session is no longer active. Please log in again.", "Unauthorized", 401);
    }

    c.set("jwtPayload", payload);
    c.set("user", payload);
    await next();
});

