import axios, { type AxiosError, type AxiosResponse } from "axios";
import { browser } from "$app/environment";
import type { ApiResponse } from "@repo/shared";

// Use relative /api by default so HTTPS frontend can safely proxy to HTTP backend without mixed-content issues.
// In production, override with VITE_API_BASE_URL if you expose the API separately.
export const API_URL =
    import.meta.env.PUBLIC_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:4000";

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
    withCredentials: true // Cookies are sent automatically
});

// Response Interceptor
api.interceptors.response.use(
    (response: AxiosResponse<ApiResponse>) => {
        // If the backend returns HTTP 200 but explicitly says success: false (logical error)
        if (response.data && response.data.success === false) {
            return Promise.reject(new AppError(
                response.data.message || "Operation failed",
                response.data.errors,
                response.data.error_code
            ));
        }
        return response;
    },
    async (error: AxiosError<ApiResponse>) => {
        if (browser && error.response?.status === 401) {
            const path = window.location.pathname;
            const isPublicPage = path === "/" || path.startsWith("/warranty") || path.startsWith("/ticket") || path.startsWith("/login");

            // Only redirect to login if we're not on a public page
            if (!isPublicPage) {
                const { authStore } = await import("$lib/shared/lib/auth-store.svelte");
                authStore.setUserInfo(null);
                // Redirect to login
                window.location.href = `/login?redirect=${encodeURIComponent(path)}`;
            }
        }

        // Extract error message from backend response if available
        const message = error.response?.data?.message || error.message || "Network Error";
        const details = error.response?.data?.errors || [];
        const code = error.response?.data?.error_code || String(error.response?.status || 500);

        return Promise.reject(new AppError(message, details, code));
    }
);

export class AppError extends Error {
    constructor(
        public override message: string,
        public details: any[] = [],
        public code: string = "UNKNOWN"
    ) {
        super(message);
        this.name = "AppError";
    }
}
