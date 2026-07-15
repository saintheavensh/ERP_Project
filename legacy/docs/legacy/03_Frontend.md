# Frontend Documentation

## Svelte 5 + SvelteKit Frontend

---

## 1. Overview

Frontend aplikasi Saint Heavens dibangun dengan **Svelte 5** menggunakan **SvelteKit** sebagai framework full-stack. Aplikasi ini menggunakan **Runes** (fitur baru Svelte 5) untuk state management reaktif.

### 1.1 Key Technologies

| Technology | Purpose |
|------------|---------|
| Svelte 5 | UI framework dengan Runes |
| SvelteKit 2 | Routing, SSR, API routes |
| TailwindCSS 3.4 | Utility-first CSS |
| TanStack Query | Server state management |
| Bits UI | Accessible component primitives |
| Lucide Svelte | Icon library |
| Axios | HTTP client |
| svelte-sonner | Toast notifications |

---

## 2. Project Structure

```
apps/frontend/src/
├── lib/
│   ├── api.ts              # Axios instance dengan interceptors
│   ├── utils.ts            # Helper functions
│   ├── index.ts            # Re-exports
│   ├── components/
│   │   ├── ui/             # Base components (Button, Card, Dialog, etc.)
│   │   ├── custom/         # App-specific components
│   │   ├── app-sidebar.svelte
│   │   └── site-header.svelte
│   ├── services/           # API service wrappers
│   │   ├── auth.service.ts
│   │   ├── customers.service.ts
│   │   ├── inventory.service.ts
│   │   ├── purchase.service.ts
│   │   ├── sales.service.ts
│   │   └── service.service.ts
│   └── stores/
│       └── auth.ts         # Auth store
├── routes/
│   ├── +layout.svelte      # Root layout
│   ├── +page.svelte        # Dashboard
│   ├── login/
│   ├── products/
│   ├── sales/
│   ├── purchases/
│   ├── customers/
│   ├── service/
│   ├── suppliers/
│   ├── categories/
│   ├── purchase-returns/
│   ├── reports/
│   └── settings/
└── app.css                 # Global styles + Tailwind directives
```

---

## 3. Svelte 5 Runes

### 3.1 State Management dengan Runes

Svelte 5 memperkenalkan **Runes** - cara baru untuk mengelola state yang lebih eksplisit:

```svelte
<script lang="ts">
    // $state - Reactive state
    let count = $state(0);
    let name = $state("");
    
    // $derived - Computed values
    let doubled = $derived(count * 2);
    
    // $effect - Side effects
    $effect(() => {
        console.log(`Count changed to ${count}`);
    });
</script>
```

### 3.2 Props dengan Runes

```svelte
<script lang="ts">
    // Destructure from $props()
    let { title, onClose } = $props<{
        title: string;
        onClose: () => void;
    }>();
</script>
```

### 3.3 Contoh: Customer Page State

```svelte
<script lang="ts">
    // Form state
    let editingId = $state<string | null>(null);
    let name = $state("");
    let phone = $state("");
    let creditLimit = $state(0);
    
    // Dialog state
    let openDialog = $state(false);
    
    // Derived from query
    let customers = $derived(customersQuery.data || []);
    let filteredCustomers = $derived(
        customers.filter(c => 
            c.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
    );
</script>
```

---

## 4. TanStack Query Integration

### 4.1 Query Client Setup

```svelte
<!-- +layout.svelte -->
<script lang="ts">
    import { QueryClient, QueryClientProvider } from "@tanstack/svelte-query";
    
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                enabled: browser,
                staleTime: 5 * 1000, // 5 seconds
            },
        },
    });
</script>

<QueryClientProvider client={queryClient}>
    {@render children()}
</QueryClientProvider>
```

### 4.2 Using Queries

```svelte
<script lang="ts">
    import { createQuery, createMutation, useQueryClient } from "@tanstack/svelte-query";
    import { CustomersService } from "$lib/services/customers.service";
    
    const client = useQueryClient();
    
    // Query
    const customersQuery = createQuery(() => ({
        queryKey: ["customers"],
        queryFn: () => CustomersService.getAll(),
    }));
    
    // Mutation
    const saveCustomerMutation = createMutation(() => ({
        mutationFn: async (data: any) => {
            if (data.id) {
                return CustomersService.update(data.id, data);
            }
            return CustomersService.create(data);
        },
        onSuccess: () => {
            client.invalidateQueries({ queryKey: ["customers"] });
            toast.success("Data saved");
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || "Error");
        },
    }));
</script>
```

---

## 5. API Service Pattern

### 5.1 Axios Instance

```typescript
// lib/api.ts
import axios from "axios";

export const api = axios.create({
    baseURL: "http://localhost:4000",
    headers: {
        "Content-Type": "application/json",
    },
});

// Request interceptor - Add auth token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor - Handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem("token");
            window.location.href = "/login";
        }
        return Promise.reject(error);
    }
);
```

### 5.2 Service Class Pattern

```typescript
// lib/services/customers.service.ts
import { api } from "$lib/api";

export class CustomersService {
    static async getAll(query?: string) {
        const { data } = await api.get("/customers", { params: { q: query } });
        return data.data;
    }
    
    static async getById(id: string) {
        const { data } = await api.get(`/customers/${id}`);
        return data.data;
    }
    
    static async create(payload: any) {
        const { data } = await api.post("/customers", payload);
        return data.data;
    }
    
    static async update(id: string, payload: any) {
        const { data } = await api.put(`/customers/${id}`, payload);
        return data.data;
    }
    
    static async delete(id: string) {
        const { data } = await api.delete(`/customers/${id}`);
        return data;
    }
    
    static async payDebt(id: string, amount: number, notes?: string) {
        const { data } = await api.post(`/customers/${id}/payment`, { amount, notes });
        return data.data;
    }
}
```

---

## 6. Component Library

### 6.1 Base UI Components (Bits UI + shadcn-svelte)

```
lib/components/ui/
├── avatar/
├── badge/
├── button/
├── card/
├── dialog/
├── dropdown-menu/
├── input/
├── label/
├── popover/
├── select/
├── separator/
├── sheet/
├── sonner/
├── table/
└── tabs/
```

### 6.2 Usage Example

```svelte
<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
    import { Dialog, DialogContent, DialogHeader, DialogTitle } from "$lib/components/ui/dialog";
</script>

<Card>
    <CardHeader>
        <CardTitle>Customer Form</CardTitle>
    </CardHeader>
    <CardContent>
        <Input bind:value={name} placeholder="Name" />
        <Button onclick={handleSave}>Save</Button>
    </CardContent>
</Card>
```

---

## 7. Routing Structure

### 7.1 Page Routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | Dashboard | Overview stats |
| `/login` | Login | Authentication |
| `/products` | Products List | Inventory management |
| `/products/new` | New Product | Create product |
| `/products/[id]` | Product Detail | View/edit product |
| `/sales` | Sales List | Transaction history |
| `/sales/new` | New Sale (POS) | Point of sale |
| `/purchases` | Purchases List | Purchase orders |
| `/purchases/new` | New Purchase | Create PO |
| `/customers` | Customers List | Customer management |
| `/customers/[id]` | Customer Detail | View/edit customer |
| `/service` | Service List | Service center |
| `/service/new` | New Service | Create service ticket |
| `/suppliers` | Suppliers | Supplier management |
| `/categories` | Categories | Category management |
| `/purchase-returns` | Returns | Purchase returns |
| `/reports` | Reports | Business reports |
| `/settings` | Settings | App settings |

### 7.2 Layout Structure

```svelte
<!-- +layout.svelte -->
<script lang="ts">
    import AppSidebar from "$lib/components/app-sidebar.svelte";
    import SiteHeader from "$lib/components/site-header.svelte";
</script>

{#if $page.url.pathname.startsWith("/login")}
    <!-- Login layout: No sidebar -->
    {@render children()}
{:else}
    <!-- Main layout: Sidebar + Header -->
    <div class="flex h-screen">
        <aside class="hidden lg:block border-r">
            <AppSidebar />
        </aside>
        <div class="flex flex-col flex-1">
            <SiteHeader />
            <main class="flex-1 overflow-y-auto p-6">
                {@render children()}
            </main>
        </div>
    </div>
{/if}
```

---

## 8. Authentication Guard

### 8.1 Client-side Auth Check

```svelte
<!-- +layout.svelte -->
<script lang="ts">
    import { browser } from "$app/environment";
    import { page } from "$app/stores";
    
    $effect(() => {
        if (browser) {
            const token = localStorage.getItem("token");
            
            // No token & not on login page → redirect to login
            if (!token && !$page.url.pathname.startsWith("/login")) {
                window.location.href = "/login";
            }
            
            // Has token & on login page → redirect to home
            if (token && $page.url.pathname.startsWith("/login")) {
                window.location.href = "/";
            }
        }
    });
</script>
```

---

## 9. Form Patterns

### 9.1 Dialog Form Pattern

```svelte
<script lang="ts">
    let openDialog = $state(false);
    let editingId = $state<string | null>(null);
    let name = $state("");
    
    function resetForm() {
        editingId = null;
        name = "";
    }
    
    function handleEdit(item: any) {
        editingId = item.id;
        name = item.name;
        openDialog = true;
    }
    
    function handleSave() {
        if (!name) return toast.error("Name required");
        saveMutation.mutate({ id: editingId, name });
    }
</script>

<Dialog bind:open={openDialog} onOpenChange={(o) => !o && resetForm()}>
    <DialogTrigger class={buttonVariants()}>
        <Plus class="mr-2 h-4 w-4" /> Add New
    </DialogTrigger>
    <DialogContent>
        <DialogHeader>
            <DialogTitle>{editingId ? "Edit" : "Add"} Item</DialogTitle>
        </DialogHeader>
        <Input bind:value={name} placeholder="Name" />
        <Button onclick={handleSave} disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : "Save"}
        </Button>
    </DialogContent>
</Dialog>
```

---

## 10. Utility Functions

```typescript
// lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Tailwind class merge utility
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Format currency to IDR
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(amount);
}

// Format date
export function formatDate(date: Date | string): string {
    return new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(new Date(date));
}
```

---

## 11. Environment Variables

```env
# .env
PUBLIC_API_URL=http://localhost:4000
```

```typescript
// Usage
import { PUBLIC_API_URL } from "$env/static/public";
```
