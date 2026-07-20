# Task 02 — Fix Sidebar Role Check (and the hardcoded API URL)

**Depends on:** nothing (can run before or after task 01)
**Risk:** Low
**PHASES.md tasks:** 3.5A.6
**Branch:** `phase-3.5/stabilization`

---

## Background

The sidebar menu is broken for every properly configured user.

In `flowserv-web/src/routes/(app)/+layout.svelte` around line 8:

```svelte
if (user?.roleId === 'Super Admin' || user?.roleId === 'no-role') {
```

But `roles.id` in the database is a **UUID** (`flowserv-api/src/db/schema/core.ts:55`),
and the login route puts that UUID into the JWT
(`flowserv-api/src/routes/auth.ts:44`). So a real user with a role assignment has a
`roleId` like `"a3f8...-..."`, which matches neither `'Super Admin'` nor
`'no-role'` — and also fails the `'Technician'` branch below it.

**The result:** a correctly configured user sees only "Dashboard". Ironically, only
users with *no role assigned* (`'no-role'`) see the full menu. The app looks broken
to exactly the people it should work for.

The fix is to send the role **name** alongside the id, and compare against the name.

---

## Goal

1. Include `roleName` in the JWT payload and in the `/v1/auth/me` response.
2. Compare against `roleName` in the sidebar.
3. While in this file: replace the hardcoded API URL in `hooks.server.ts` with an
   environment variable.

---

## Files to change

| File | Action |
|---|---|
| `flowserv-api/src/routes/auth.ts` | join `roles`, add `roleName` |
| `flowserv-api/src/middleware/auth.ts` | add `roleName` to the `JwtPayload` type |
| `flowserv-web/src/routes/(app)/+layout.svelte` | compare on `roleName` |
| `flowserv-web/src/hooks.server.ts` | use env var for the API URL |
| `flowserv-web/.env` | add `API_URL` |

---

## Step 1 — Backend: include the role name

In `flowserv-api/src/routes/auth.ts`, the login handler currently does:

```ts
const assignments = await db.select().from(userRoleAssignments).where(eq(userRoleAssignments.userId, user.id));
const roleId = assignments[0]?.roleId || 'no-role';
```

Change this to also fetch the role's `name` — join `userRoleAssignments` to `roles`,
filtered by the user's `tenantId`. Then include both in the payload:

```ts
const payload = {
  userId: user.id,
  tenantId: user.tenantId,
  roleId,
  roleName,          // <-- new: e.g. "Super Admin"
  exp: ...,
};
```

Add `roleName` to the returned `user` object too, and to the `/v1/auth/me` response
(it reads from the JWT payload, so it just needs the extra field passed through).

Use `'no-role'` as the fallback for `roleName` when there is no assignment, so the
existing fallback behaviour is preserved.

In `flowserv-api/src/middleware/auth.ts`, add the field to the type:

```ts
export type JwtPayload = {
  userId: string;
  tenantId: string;
  roleId: string;
  roleName: string;   // <-- new
  exp: number;
};
```

---

## Step 2 — Frontend: compare on the name

In `flowserv-web/src/routes/(app)/+layout.svelte`, change every role comparison from
`user?.roleId` to `user?.roleName`:

```svelte
if (user?.roleName === 'Super Admin' || user?.roleName === 'no-role') {
```

and

```svelte
} else if (user?.roleName === 'Technician') {
```

Also update the small role badge further down the file (it currently displays
`{user?.roleId}`, which shows a raw UUID to the user) to display `{user?.roleName}`.

---

## Step 3 — Remove the hardcoded API URL

`flowserv-web/src/hooks.server.ts` line 7 has:

```ts
const response = await fetch('http://localhost:3001/v1/auth/me', {
```

This contradicts the rule in `CLAUDE.md`: *"Use environment variables (`.env`) for
ALL configuration"*, and it will break the moment the app is opened from another
device on the LAN — which is the current deployment plan.

Add to `flowserv-web/.env`:

```
API_URL=http://localhost:3001
```

and read it in `hooks.server.ts` via SvelteKit's `$env/dynamic/private`:

```ts
import { env } from '$env/dynamic/private';
const apiUrl = env.API_URL ?? 'http://localhost:3001';
```

Check whether `flowserv-web/src/lib/api/client.ts` has the same hardcoded URL. If it
does, fix it the same way (it is client-side, so it needs `PUBLIC_API_URL` and
`$env/dynamic/public` instead).

---

## How to verify (evidence required)

1. Restart both the API and the web app (JWT shape changed, so **log out and log
   back in** — an old token will not have `roleName`).
2. Log in as the seeded Super Admin user.
3. **Evidence:** a screenshot or description of the sidebar showing the full menu —
   Customers, Flow Templates, Tickets, Inventory & Stock, Purchasing, Point of Sales,
   Finance, Settings — and the role badge reading `Super Admin` rather than a UUID.

Before this fix, that same user sees only "Dashboard".

---

## Watch out for

**Old tokens.** Anyone already logged in has a JWT without `roleName`, so they will
fall through to the empty menu until they log out and back in. This is expected. If
you want to avoid it, the token expiry is 7 days — or just clear the
`flowserv_token` cookie.

---

## Do NOT do

- **Do not** build the RBAC permission middleware here. That is Phase 4.5, a much
  bigger job. This task only fixes menu visibility.
- **Do not** treat the sidebar as security. It hides menu items; it does not protect
  endpoints. Anyone can still call any API directly — that is a known gap
  (RECOVERY-PLAN GAP-04) and it is not in scope for this task.
- **Do not** redesign the sidebar or the layout.

---

## When done

Mark in `PHASES.md`: `3.5A.6` as `[x]`.

Commit: `fix(auth): send role name in JWT and fix sidebar role check`
