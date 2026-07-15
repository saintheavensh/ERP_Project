import { api } from "$lib/shared/lib/api-client";
import { browser } from "$app/environment";

export type User = {
    id: string;
    username: string;
    name: string;
    role?: string | { id: string; name: string };
    roles?: string[]; // Multiple roles support
    email?: string;
};

/** Display metadata for each role in the switcher UI */
export const ROLE_CONFIG: Record<string, { label: string; icon: string; dashboard: string }> = {
    super_admin: { label: "Super Admin", icon: "🛡️", dashboard: "/dashboard/superadmin" },
    owner: { label: "Owner", icon: "👑", dashboard: "/dashboard/owner" },
    manager: { label: "Manager", icon: "📊", dashboard: "/dashboard/manager" },
    teknisi: { label: "Teknisi", icon: "🔧", dashboard: "/dashboard/teknisi" },
    kasir: { label: "Kasir", icon: "💰", dashboard: "/sales/kasir/kasir" },
    warehouse: { label: "Warehouse", icon: "📦", dashboard: "/dashboard/warehouse" },
};

class AuthStore {
    user = $state<User | null>(null);
    loading = $state(false);
    isAuthenticated = $derived(!!this.user);

    /** The currently active role mode (persisted in localStorage) */
    activeRole = $state<string | null>(null);

    /** Consolidated roles list from user data */
    roles = $derived.by(() => {
        if (!this.user) return [];
        let r: string[] = [];

        if (this.user.roles && this.user.roles.length > 0) {
            r = this.user.roles;
        } else {
            // Fallback to legacy single role field
            const legacyRole = typeof this.user.role === "object" ? this.user.role.id : this.user.role;
            r = legacyRole ? [legacyRole] : [];
        }

        // Super Admin gets access to all modes
        if (r.includes('super_admin')) {
            // Preserve unique set just in case, though static list is fine
            return ['super_admin', 'owner', 'manager', 'teknisi', 'kasir', 'warehouse'];
        }

        return r;
    });

    /** Primary role (highest privilege) — used as fallback and for backend compatibility */
    role = $derived.by(() => {
        if (this.roles.includes('super_admin')) return 'super_admin';
        if (this.roles.includes('owner')) return 'owner';
        if (this.roles.includes('manager')) return 'manager';
        if (this.roles.includes('teknisi')) return 'teknisi';
        if (this.roles.includes('kasir')) return 'kasir';
        if (this.roles.includes('warehouse')) return 'warehouse';
        return this.roles[0] || null;
    });

    /** Whether the user has more than one role (show switcher if true) */
    hasMultipleRoles = $derived(this.roles.length > 1);

    /** Current active role config for display */
    activeRoleConfig = $derived(
        this.activeRole ? ROLE_CONFIG[this.activeRole] : null
    );

    hasRole(roleNames: string | string[]) {
        const checkRoles = Array.isArray(roleNames) ? roleNames : [roleNames];
        return this.roles.some(r => checkRoles.includes(r));
    }

    /**
     * Switch to a different role mode.
     * Returns the dashboard path to navigate to.
     */
    switchRole(roleId: string): string {
        if (!this.roles.includes(roleId)) return this.getRedirectPath();

        this.activeRole = roleId;
        if (browser) {
            localStorage.setItem("activeRole", roleId);
        }

        return ROLE_CONFIG[roleId]?.dashboard || "/";
    }

    /**
     * Initialize activeRole from localStorage or default to primary role.
     * Called after checkAuth() resolves.
     */
    initActiveRole() {
        if (!browser) return;

        const stored = localStorage.getItem("activeRole");
        // Only use stored value if the user still has that role
        if (stored && this.roles.includes(stored)) {
            this.activeRole = stored;
        } else {
            // Default to primary (highest privilege) role
            this.activeRole = this.role;
            if (this.activeRole) {
                localStorage.setItem("activeRole", this.activeRole);
            }
        }
    }

    /** Returns the dashboard path for the current active role */
    getRedirectPath(): string {
        if (!this.isAuthenticated) return "/login";

        const role = this.activeRole || this.role;
        return ROLE_CONFIG[role || ""]?.dashboard || "/";
    }

    private _checkAuthPromise: Promise<void> | null = null;

    async checkAuth() {
        if (!browser) return;
        if (this._checkAuthPromise) return this._checkAuthPromise;

        this._checkAuthPromise = (async () => {
            this.loading = true;
            try {
                const res = await api.get("/auth/me");
                this.user = res.data.data || res.data;
                // Initialize active role after user data is loaded
                this.initActiveRole();
            } catch (err) {
                this.user = null;
            } finally {
                this.loading = false;
                this._checkAuthPromise = null;
            }
        })();

        return this._checkAuthPromise;
    }

    setUserInfo(userData: User | null) {
        this.user = userData;
        this.loading = false;
        if (userData) this.initActiveRole();
    }

    async logout() {
        try {
            await api.post("/auth/logout");
        } finally {
            this.user = null;
            this.activeRole = null;
            if (browser) {
                localStorage.removeItem("activeRole");
                window.location.href = "/login";
            }
        }
    }
}

export const authStore = new AuthStore();
