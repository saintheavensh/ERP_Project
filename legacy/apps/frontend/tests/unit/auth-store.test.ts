import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { authStore } from '$lib/shared/lib/auth-store.svelte';

vi.mock('$lib/shared/lib/api-client', () => ({
    api: {
        post: vi.fn().mockResolvedValue({}),
        get: vi.fn(),
    }
}));

describe('AuthStore', () => {
    let originalLocation: any;

    beforeEach(async () => {
        vi.clearAllMocks();
        originalLocation = window.location;
        // @ts-ignore
        delete window.location;
        // @ts-ignore
        window.location = { href: '', replace: vi.fn() } as any;
        await authStore.logout();
    });

    afterEach(() => {
        // @ts-ignore
        window.location = originalLocation;
    });

    it('should initialize with null user', () => {
        expect(authStore.user).toBeNull();
        expect(authStore.isAuthenticated).toBe(false);
    });

    it('should set user info correctly', () => {
        const mockUser = { id: '1', username: 'test', name: 'Test User', roles: ['admin'] };
        authStore.setUserInfo(mockUser);
        expect(authStore.user).toBeDefined();
        expect(authStore.user?.username).toBe('test');
        expect(authStore.isAuthenticated).toBe(true);
    });

    it('should handle role checking correctly', () => {
        authStore.setUserInfo({ id: '1', username: 'test', name: 'Test User', roles: ['admin'] });
        expect(authStore.hasRole('admin')).toBe(true);
        expect(authStore.hasRole('user')).toBe(false);
    });

    it('should reset state on logout', async () => {
        authStore.setUserInfo({ id: '1', username: 'test', name: 'Test User', roles: ['admin'] });
        expect(authStore.user).not.toBeNull();
        await authStore.logout();
        expect(authStore.user).toBeNull();
    });
});
