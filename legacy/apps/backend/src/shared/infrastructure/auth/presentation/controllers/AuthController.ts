import { Context } from "hono";
import { apiSuccess, apiError } from "../../../../application/middlewares/ResponseHelpers";
import { setCookie, getCookie } from "hono/cookie";
import { loginUseCase, getCurrentUserUseCase, switchRoleUseCase, refreshTokenUseCase, logoutUseCase } from "../../AuthContainer";
import { appConfig } from "../../../../infrastructure/config/AppConfig";
import { settingsService } from "../../../../../modules/05-shared/settings/settings-container";
import { DEFAULT_ROLE_BEHAVIOR } from "../../../../../modules/05-shared/settings/application/constants";
import { parseDuration } from "../../../../infrastructure/utils/time/duration";

export class AuthController {
    async login(c: Context) {
        try {
            const { username, password, roleId } = await c.req.json();

            if (!username || !password) {
                return apiError(c, "Username and password are required", "Validation Error", 400);
            }

            const roleBehavior = await settingsService.get("system", "role_behavior", DEFAULT_ROLE_BEHAVIOR);

            const result = await loginUseCase.execute({
                username,
                password,
                roleId,
                roleBehaviorMode: (roleBehavior as any).mode
            });

            if (result.requiresRoleSelection) {
                return apiSuccess(c, {
                    requiresRoleSelection: true,
                    availableRoles: result.availableRoles
                }, "Role selection required");
            }

            setCookie(c, "access_token", result.accessToken!, {
                httpOnly: true,
                secure: appConfig.isProduction,
                sameSite: "Lax",
                path: "/",
                maxAge: parseDuration(appConfig.jwtAccessExpires).seconds
            });

            setCookie(c, "refresh_token", result.refreshToken!, {
                httpOnly: true,
                secure: appConfig.isProduction,
                sameSite: "Lax",
                path: "/",
                maxAge: parseDuration(appConfig.jwtRefreshExpires).seconds
            });

            return apiSuccess(c, { user: result.user }, "Login successful");
        } catch (e: any) {
            if (e.message === "Invalid username or password") {
                return apiError(c, e.message, "Unauthorized", 401);
            }
            return apiError(c, e, "Login failed", 500);
        }
    }

    async refresh(c: Context) {
        try {
            const refreshToken = getCookie(c, "refresh_token");
            if (!refreshToken) {
                return apiError(c, "Refresh token missing", "Unauthorized", 401);
            }

            const result = await refreshTokenUseCase.execute({ refreshToken });

            setCookie(c, "access_token", result.accessToken, {
                httpOnly: true,
                secure: appConfig.isProduction,
                sameSite: "Lax",
                path: "/",
                maxAge: parseDuration(appConfig.jwtAccessExpires).seconds
            });

            return apiSuccess(c, null, "Token refreshed successfully");
        } catch (e: any) {
            return apiError(c, e.message || "Failed to refresh token", "Unauthorized", 401);
        }
    }

    async logout(c: Context) {
        const payload = c.get("user");

        if (payload && payload.sessionId) {
            try {
                // Ensure the database session flips to inactive to prevent reused stolen refresh tokens.
                await logoutUseCase.execute({ sessionId: payload.sessionId });
            } catch (e) {
                console.error("Failed to deactivate session during logout:", e);
                // We still want to clear cookies even if DB is unreachable
            }
        }

        setCookie(c, "access_token", "", { httpOnly: true, path: "/", maxAge: 0 });
        setCookie(c, "refresh_token", "", { httpOnly: true, path: "/", maxAge: 0 });
        // Clean legacy cookie just in case
        setCookie(c, "auth_token", "", { httpOnly: true, path: "/", maxAge: 0 });

        return apiSuccess(c, null, "Logged out successfully");
    }

    async me(c: Context) {
        const payload = c.get("user");
        if (!payload) return apiError(c, null, "Not authenticated", 401);

        try {
            const result = await getCurrentUserUseCase.execute({ userId: payload.id });
            if (!result) return apiError(c, null, "User not found", 404);

            return apiSuccess(c, result.user, "OK");
        } catch (e) {
            return apiError(c, e, "Failed to fetch user data", 500);
        }
    }

    async switchRole(c: Context) {
        const payload = c.get("user");
        if (!payload) return apiError(c, null, "Not authenticated", 401);

        try {
            const { roleId } = await c.req.json();
            if (!roleId) return apiError(c, "roleId is required", "Validation Error", 400);

            const result = await switchRoleUseCase.execute({
                userPayload: payload,
                targetRoleId: roleId
            });

            setCookie(c, "access_token", result.accessToken, {
                httpOnly: true,
                secure: appConfig.isProduction,
                sameSite: "Lax",
                path: "/",
                maxAge: parseDuration(appConfig.jwtAccessExpires).seconds
            });

            return apiSuccess(c, { role: result.role }, "Role switched successfully");
        } catch (e: any) {
            if (e.message === "Invalid target role") {
                return apiError(c, e.message, "Forbidden", 403);
            }
            return apiError(c, e, "Failed to switch role", 500);
        }
    }
}
