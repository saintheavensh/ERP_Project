class UIStore {
    isSidebarCollapsed = $state(false);

    setSidebarCollapsed(value: boolean) {
        this.isSidebarCollapsed = value;
    }

    toggleSidebar() {
        this.isSidebarCollapsed = !this.isSidebarCollapsed;
    }
}

export const uiStore = new UIStore();
