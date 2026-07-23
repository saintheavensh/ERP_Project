# UI/UX: Design Principles & Key Screens

> **Implementation status (2026-07-23):** Design principle #3 below was originally scoped
> to "technicians" only and never made explicit that it governs the whole app shell. It
> didn't, in practice: an audit found the core layout (`(app)/+layout.svelte`) has a fixed
> 256px sidebar with no responsive/collapsed state at all, several list pages render wide
> `<table>`s with no horizontal-scroll wrapper, and the POS cart panel is a fixed 384px
> column — all effectively unusable on a ~375px phone viewport. Principle #3 is corrected
> below to state the real, broader intent. **Decision: fix the shared app shell (sidebar
> nav, base layout) first — everything renders inside it, so one fix cascades correctness
> everywhere — then build new screens mobile-first from the start. Older pages (ticket/
> customer/inventory list tables, etc.) are retrofitted incrementally as they're touched,
> not in one big-bang pass** (same incremental-retrofit rule this codebase already applies
> to architecture debt — see `PHASES.md` → Architecture Debt). See `plan/P1.5-mobile-shell-fix.md`.

## Design Principles

1. **Dashboard = personal workbench per role** — upon login, show ONLY what's relevant to that role's work today. Technicians don't need finance reports; cashiers don't need Flow Template settings.
2. **Real-time by default** — ticket status changes, stock levels, payments must be visible live (WebSocket), not requiring manual refresh.
3. **Mobile-first, app-wide** — the app is used on the service floor, at a POS counter, and in the field, not only at a desk. This is not limited to technician screens: the app shell (navigation), every list/table, and every new screen must be built mobile-first (design for the smallest viewport, then enhance for larger ones) and be comfortable on phone/tablet. Existing desktop-only screens are retrofitted incrementally as they're touched — see the implementation-status note above.
4. **Configuration is a first-class UI feature** — Flow Template Builder and RBAC management must have clear UIs, not "hidden settings" only changeable via database/code.
5. **Minimal double data entry** — data entered once (e.g., during Diagnosis) must automatically appear everywhere relevant (Quote, Invoice).
6. **Simple for non-technical users** — assume some staff (cashiers, technicians) are not tech-savvy. Big, clear buttons; everyday language (not technical terms); maximum 1 primary action per screen; flat navigation (common actions max 2 clicks from main screen).

## Key Screens

### 1. Dashboard (per role) — Personal Workbench
- **Technician**: ONLY their assigned ticket queue, sorted by priority. One big button per ticket ("Start" / "Continue"). No finance, inventory, or settings visible.
- **Cashier**: ONLY tickets ready for payment + "New Transaction" button. No access to technician data, inventory, or reports.
- **Inventory Staff**: ONLY stock & purchase orders for their branch. No service ticket details or finance reports.
- **Branch Manager**: Branch KPIs, pending approvals, technician performance — broader view, but grouped by category.
- **Tenant Owner**: The only role that's truly cross-branch & cross-module (revenue, margin, active tickets, trend graphs).

Principle: if a role doesn't need data/feature for daily work, **DON'T show it** — don't show it then disable it.

### 2. Ticket Board (Kanban)
- Columns = stages from active Flow Template (dynamic, follows configuration)
- Ticket cards show: customer, asset, assigned technician, ticket age at current stage
- Drag-and-drop between stages (with Transition Rule + permission check behind the scenes)
- Mobile-first (principle #3): on a phone, columns scroll horizontally (one column-width
  snap at a time) instead of shrinking to unreadable width; drag-and-drop must have a
  tap-based fallback (e.g. tap a card → pick a target stage) since drag gestures are
  unreliable on touch screens.

### 3. Ticket Detail View
- Timeline of stage change history (audit trail)
- Live cost breakdown (parts + labor, real-time margin)
- Attachments (before/after photos, notes)
- Approval panel (when waiting for Customer Approval)

### 4. Flow Template Builder (Admin)
- Visual builder for composing/editing nodes & transition rules
- Preview flow as diagram before publishing
- Clone from existing Flow Template as starting point

### 5. Inventory Dashboard
- Stock levels per item, low-stock alerts
- Purchase Order list & status
- Stock movement history per item (FIFO batch & supplier origin)

### 6. Product Catalog
- Browse by category (LCD, Battery, etc.); each product shows compatible sparepart brands & device models
- Price comparison table across suppliers for the same product
- Accessed by Inventory Staff & Branch Manager for purchase decisions

### 7. Global Search (Smart Search)
- One search bar, accessible from anywhere (top bar, all roles)
- Results grouped: **Spareparts** (search by name/SKU/device model) and **Service Tickets** (search by ticket ID, customer name/phone, or asset info)
- Typo-tolerant, not just exact match

### 8. POS/Cashier Screen
- Simple, fast, touch-friendly
- Start from service ticket (auto-fill items) or new transaction (direct retail)
- Big buttons for common actions (pay, void, discount — per permission)

### 9. Finance Reports Dashboard
- **Simple Mode** (default for Owner/Branch Mgr): everyday numbers — "Today's Income", "Estimated Profit This Month", simple trend graph. No accounting terms.
- **Accountant Mode** (toggle in Settings, default for Finance Staff): P&L per branch/period/tenant consolidation, job costing report per ticket/category, export to Excel/PDF
- Same data source — only the presentation and terminology differ.

### 10. Technician Dashboard & Calendar
- Assigned jobs list with priority and due dates
- Quick Actions: Start Repair, Update Status, Request Parts, Complete Repair
- **Calendar/Schedule View**: daily/weekly view of jobs, color-coded by status
- Personal performance metrics
- Mobile-friendly (required)

### 11. Customer Portal (External)
- Real-time ticket status, accessed via **magic link** (unique token sent via WA/SMS, single-use, expires 7 days)
- Approve/reject quote with 1 tap
- Service history for their devices

### 12. RBAC Management (Admin)
- Visual role & permission matrix (not raw database tables)
- Assign roles to users, scoped by branch

### 13. Audit Log Viewer
- List of recorded actions: who (actor), what action, which entity, when, from which IP
- Filter by user, action type, date range, entity
- Accessed by Tenant Owner, Branch Manager (own branch only), and Auditor/Viewer

### 14. Printer Settings (Admin/Branch Manager)
- **Manage Devices**: registered printers per branch (name, connection type, paper size)
- **Manage Templates**: select paper size → arrange displayed fields → **WYSIWYG preview** rendered with the same code as actual print output
- **Assignment**: which document type (Receipt, Label, A4 Invoice) goes to which device

## Navigation Structure

```
Sidebar (changes per role):
├─ Dashboard
├─ Search (global, always in top bar)
├─ Service Tickets (Kanban/List)
├─ Inventory
│   ├─ Stock
│   ├─ Product Catalog
│   └─ Purchase Orders
├─ POS/Cashier
├─ Finance & Reports (Simple/Accountant Mode)
├─ Settings (Admin only)
│   ├─ Flow Template Builder
│   ├─ Roles & Permissions
│   ├─ Branches
│   ├─ Printer (Device, Template, Assignment)
│   └─ Audit Log
└─ Profile/Logout
```
