# Task 09 — Fix Seed Data and Remove the `'no-role'` Fallback

**Depends on:** nothing, but **must land before Phase 4.5B (RBAC)**
**Risk:** Medium — the step order matters; getting it wrong locks you out of the menu
**PHASES.md tasks:** 3.5E.2 (prerequisite for 4.5B)
**Branch:** `phase-3.5/stabilization`

---

## Background

`flowserv-api/src/db/seed.ts` has three problems.

### Problem 1 — no user ever gets a role

The seed creates four roles (Super Admin, Manager, Technician, Cashier) and creates
the admin user, but **never inserts a `user_role_assignments` row linking them.**

So `admin@demo.com` logs in with `roleId: 'no-role'`, `roleName: 'no-role'`. Verified
2026-07-20 — that is the literal login response.

This is currently masked by a fallback in
`flowserv-web/src/routes/(app)/+layout.svelte:9`:

```svelte
if (user?.roleName === 'Super Admin' || user?.roleName === 'no-role') {
```

A user with **no role assigned gets the full admin menu.** That is backwards — an
unassigned user should get the least access, not the most. It only looks harmless
because there is exactly one user today, who happens to be the admin.

> **Be clear-eyed about severity:** there is currently **no API-level RBAC at all**
> (RECOVERY-PLAN GAP-04). Anyone can `curl` any endpoint regardless of what the menu
> displays. So fixing this makes the UI *honest*, not *secure*. Real enforcement is
> Phase 4.5B. The reason to fix it now is that 4.5B cannot be built or tested while
> every user is `'no-role'`.

### Problem 2 — the seed is not idempotent

It calls bare `db.insert(tenants)`, `db.insert(branches)`, `db.insert(roles)` with no
conflict handling. Run `npm run db:seed` twice and you get two tenants, two branches,
and eight roles. There is no warning.

### Problem 3 — passwords are unsalted SHA-256

```ts
function generatePasswordHash(password: string): string {
  // Simulating bcrypt hash for seed data, in production use bcryptjs or argon2
  return crypto.createHash('sha256').update(password).digest('hex');
}
```

This is *why* `routes/auth.ts` carries a weak legacy branch:

```ts
if (user.passwordHash.length === 64) {   // sha256 hex length
  // ...compare unsalted sha256
}
```

`bcryptjs` is already a dependency and already used in the `else` branch.

---

## ⚠️ Step order matters — read before starting

**Do not remove the `'no-role'` fallback before the seed assigns roles.**

If you delete the fallback first, the existing admin user (who has no role) drops
straight to the `else` branch, sees only "Dashboard", and has no menu route to fix
anything. Recovering means going into Postgres by hand.

Correct order: **fix the seed → apply roles to existing data → then remove the
fallback.**

---

## Goal

1. Seeded users have real roles.
2. Re-running the seed is safe.
3. Seeded passwords use bcrypt.
4. The `'no-role'` full-menu fallback is gone.

---

## Files to change

| File | Action |
|---|---|
| `flowserv-api/src/db/seed.ts` | all three fixes |
| `flowserv-web/src/routes/(app)/+layout.svelte` | remove the fallback (**last**) |

---

## Step 1 — Make the seed idempotent

Wrap each insert in a find-or-create. `users` has a unique constraint on
`(tenantId, email)` and can use `.onConflictDoNothing()`, but `tenants`, `branches`,
and `roles` have no usable unique constraint (the one on `roles` is commented out in
`db/schema/core.ts:60`), so check first:

```ts
// Find-or-create the demo tenant. Without this, re-running the seed
// silently creates a second tenant and every later lookup becomes ambiguous.
let [tenant] = await db.select().from(tenants).where(eq(tenants.name, 'Demo Service Center'));

if (!tenant) {
  [tenant] = await db.insert(tenants).values({
    name: 'Demo Service Center',
    subscriptionTier: 'pro',
    status: 'active',
    settings: { simplifiedFinanceMode: true },
  }).returning();
  console.log('✅ Tenant created');
} else {
  console.log('↩️  Tenant already exists, reusing');
}
```

Apply the same pattern to the branch and to each role (match roles on
`tenantId` + `name`).

---

## Step 2 — Use bcrypt for the seeded password

Replace the SHA-256 helper:

```ts
import bcrypt from 'bcryptjs';

async function generatePasswordHash(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}
```

Note it becomes `async` — `await` it at the call site.

> **Leave the SHA-256 branch in `routes/auth.ts` alone.** Any user already in the
> database still has a SHA-256 hash and would be locked out. `PHASES.md` already
> schedules its removal under Phase 11. This task only stops *creating* new weak
> hashes.

---

## Step 3 — Assign the Super Admin role

After creating the user, link it to the Super Admin role:

```ts
const [superAdminRole] = await db.select().from(roles)
  .where(and(eq(roles.tenantId, tenant.id), eq(roles.name, 'Super Admin')));

const existingAssignment = await db.select().from(userRoleAssignments)
  .where(eq(userRoleAssignments.userId, user.id));

if (existingAssignment.length === 0) {
  await db.insert(userRoleAssignments).values({
    userId: user.id,
    roleId: superAdminRole.id,
    branchId: null,   // null = all branches
  });
  console.log('✅ Super Admin role assigned');
}
```

Import `userRoleAssignments` and `and` — the current file imports neither.

---

## Step 4 — Apply to your existing database

The seed only affects fresh data. Your current admin user still has no role. Either:

**Option A — wipe and re-seed** (cleanest, loses all local data):
```bash
npx drizzle-kit push --force   # or drop/recreate the database
npm run db:seed
npm run db:seed   # run twice — proves idempotency
```

**Option B — assign the role by hand** (keeps existing data):
```sql
INSERT INTO user_role_assignments (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.email = 'admin@demo.com'
  AND r.name = 'Super Admin'
  AND r.tenant_id = u.tenant_id;
```

Note: the existing admin's password stays SHA-256 under Option B. That is fine —
`auth.ts` still handles it.

**Confirm before continuing to step 5:**
```bash
curl -s -X POST http://localhost:3001/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.com","password":"admin123"}'
```
The response must show `"roleName":"Super Admin"`. **If it still says `'no-role'`,
stop — do not do step 5.**

---

## Step 5 — Remove the fallback (only after step 4 passes)

In `flowserv-web/src/routes/(app)/+layout.svelte:9`:

```svelte
<!-- before -->
if (user?.roleName === 'Super Admin' || user?.roleName === 'no-role') {

<!-- after -->
if (user?.roleName === 'Super Admin') {
```

Consider also giving unassigned users a visible signal rather than a silent empty
menu — a small notice such as *"No role assigned. Contact your administrator."* is
far easier to diagnose than a sidebar that just looks broken.

The `'no-role'` fallbacks in `routes/auth.ts` and `services/flow-engine.ts` **stay** —
they correctly handle a user with no assignment, and `flow-engine.ts` needs it to
avoid passing a non-UUID string into a UUID column.

---

## How to verify (evidence required)

1. **Idempotency:** run `npm run db:seed` twice. Second run logs "already exists"
   messages and creates nothing. Confirm with:
   ```sql
   SELECT COUNT(*) FROM tenants;  -- expect 1
   SELECT COUNT(*) FROM roles;    -- expect 4
   ```
2. **Role assigned:** the login response shows `"roleName":"Super Admin"`.
3. **bcrypt:** a freshly seeded user's `password_hash` starts with `$2` and is ~60
   chars, not 64 hex chars.
4. **Login still works** after re-seeding.
5. **Sidebar:** log in and see the full menu, with the badge reading `Super Admin`.

**Evidence:** the double-seed output, the login response, and the hash format.

---

## Do NOT do

- **Do not** remove the SHA-256 branch from `routes/auth.ts` — Phase 11.
- **Do not** seed `permissions` or `role_permissions` — that is Phase 4.5B and needs
  the full catalog from `specification/03-rbac-roles.md`.
- **Do not** build RBAC middleware here.
- **Do not** remove the `'no-role'` handling in `auth.ts` or `flow-engine.ts`.
- **Do not** change the demo credentials (`admin@demo.com` / `admin123`) — they are
  referenced in other task files and docs.

---

## When done

Mark in `PHASES.md`: `3.5E.2` as `[x]`. Revisit `1E.3` and `1E.5` — the seed is now
genuinely complete.

Commit: `fix(seed): assign roles, make seed idempotent, use bcrypt`
