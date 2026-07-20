# H12 — RBAC: Report-Only First, Then Enforce

> The original task **4.5B**. Highest lockout risk in the track.
> Size: L · Risk: 🔴 R3

## Goal

Every mutating endpoint checks a permission, without ever locking you out of your own
application.

## Why

`middleware/rbac.ts` does not exist. `requirePermission()` appears throughout
`coding-guidelines.md` and is used nowhere. **Any authenticated user can call any
endpoint** — a Cashier's token can void invoices, edit margins, delete suppliers, and read
every ticket.

The audit shows how untested this path is:

```
permissions table:                        0 rows
flow_nodes with a required_permission_id: 0 of 5
```

So `evaluateTransition`'s `PERMISSION_DENIED` branch has **never executed against real
data**. It is covered by unit tests and nothing else.

Retrofitting authorization across 19 route files is much cheaper than across 40, and
cheaper still if done during the module migration ([H16](./H16-module-migration.md)) since
it touches the same files.

## 🔴 The lockout trap

Applying `requirePermission` broadly against an **empty** permission catalog denies
everything — including the admin UI you would use to fix the catalog. You lock yourself out
and the only way back is direct SQL.

**Three-stage rollout. Do not compress it.**

### Stage 1 — Seed the catalog, enforce nothing

Build `permissions` and `role_permissions` from `specification/03-rbac-roles.md`. Make the
seed idempotent (find-or-create), matching the pattern `db/seed.ts` already uses.

Verify the seeded matrix by querying it. **Nothing is enforced yet.**

### Stage 2 — Report-only mode

```ts
// middleware/rbac.ts
const RBAC_MODE = process.env.RBAC_MODE ?? 'report'; // 'report' | 'enforce'

export const requirePermission = (code: string) => async (c: Context, next: Next) => {
  const { userId, roleName } = getAuthContext(c);
  const allowed = await hasPermission(c, code);

  if (!allowed) {
    // Report-only: log what WOULD be denied, then allow. This is how we discover
    // permissions the catalog is missing before they can lock anyone out.
    console.warn(`[RBAC] would deny: user=${userId} role=${roleName} perm=${code} ${c.req.method} ${c.req.path}`);
    if (RBAC_MODE === 'enforce') {
      return errorResponse(c, 'PERMISSION_DENIED', `Missing permission: ${code}`, undefined, 403);
    }
  }
  await next();
};
```

Apply it to every mutating endpoint **while still in report mode**. Then use the app
normally — walk every real click-path — and read the warnings. Every line is a permission
the catalog is missing or a role grant that is wrong. Fix until the log is silent.

This is the whole safety mechanism. It costs one working session and removes the risk
entirely.

### Stage 3 — Enforce

Set `RBAC_MODE=enforce`. Keep these two escape hatches:

```ts
// Super Admin bypasses all permission checks. Without this, a catalog mistake
// leaves nobody able to repair the catalog.
if (roleName === 'Super Admin') return next();
```

Plus a documented break-glass: `RBAC_MODE=report` in `.env` restores non-enforcing
behaviour without a code change. Write this in `.env.example` **and** in `CLAUDE.md`, so it
is findable at the moment it is needed rather than after an hour of panic.

## Steps

1. `middleware/rbac.ts` with `hasPermission` + `requirePermission` and the mode flag
2. `db/seed-permissions.ts` — idempotent catalog from `specification/03-rbac-roles.md`
3. Apply `requirePermission` to every mutating endpoint (report mode)
4. Walk every click-path; drive the warning log to empty
5. Flip to enforce; verify each role against the matrix
6. Populate `flow_nodes.requiredPermissionId` — this finally activates the flow engine's
   permission branch that has only ever run in tests
7. Frontend: hide actions the role cannot perform (cosmetic — the server is the boundary)

## Verification

- [ ] Catalog seeded; re-running the seed creates nothing new
- [ ] Report mode produces an **empty** warning log after every click-path is walked
- [ ] In enforce mode: a Cashier voiding an invoice gets **403** naming the missing permission
- [ ] A Technician can transition a ticket; a Cashier cannot
- [ ] Super Admin bypass works even with an empty `role_permissions`
- [ ] `RBAC_MODE=report` restores access without a code change (break-glass tested — actually
      test it, do not assume)
- [ ] **Tenant isolation:** tenant A's token cannot read tenant B's ticket (404, not 403 —
      do not confirm existence)
- [ ] `npm test` with 403 and cross-tenant tests (task 4.5B.4)

## Watch out

- **Do not skip Stage 2.** It is the entire mitigation. Going straight to enforce against a
  catalog nobody has exercised is how this goes wrong.
- Seed permissions **before** applying middleware, even in report mode — otherwise the log
  is pure noise and tells you nothing.
- Cross-tenant reads should return **404**, not 403. A 403 confirms the resource exists,
  which leaks information across tenants.
- The frontend permission hiding is convenience only. Never treat it as the security
  boundary; every check must hold server-side.
