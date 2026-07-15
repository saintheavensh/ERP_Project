import { api } from "$lib/shared/lib/api-client";
import type { LoginRequest, LoginResponse, ApiResponse } from "@repo/shared";

export const AuthService = {
    login: async (data: LoginRequest) => {
        const res = await api.post<ApiResponse<{ user: LoginResponse["user"] }>>("/auth/login", data);
        if (res.data.data?.user) {
            // Only store user info in localStorage (token is in HTTP-only cookie)
            localStorage.setItem("user", JSON.stringify(res.data.data.user));
        }
        return res.data.data!;
    },
    logout: async () => {
        try {
            await api.post("/auth/logout");
        } catch {
            // Ignore errors on logout
        }
        localStorage.removeItem("user");
    },
    getUser: () => {
        const u = localStorage.getItem("user");
        return u ? JSON.parse(u) : null;
    },
    // Check if user is authenticated by calling /me endpoint
    checkAuth: async () => {
        try {
            const res = await api.get<ApiResponse<{ user: any }>>("/auth/me");
            if (res.data.data?.user) {
                localStorage.setItem("user", JSON.stringify(res.data.data.user));
                return res.data.data.user;
            }
            return null;
        } catch {
            localStorage.removeItem("user");
            return null;
        }
    },
    register: async (data: any) => {
        const res = await api.post<ApiResponse<any>>("/users", data);
        return res.data.data;
    },
    updateUser: async (id: string, data: any) => {
        const res = await api.put<ApiResponse<any>>(`/users/${id}`, data);
        return res.data.data;
    },
    deleteUser: async (id: string) => {
        const res = await api.delete<ApiResponse<any>>(`/users/${id}`);
        return res.data.data;
    }
};
