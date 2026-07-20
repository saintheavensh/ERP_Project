# Task 03 — Enforce Flow Engine Validation

**Depends on:** task 01 (needs `evaluateTransition` and a working `npm test`)
**Risk:** **Medium — this changes behaviour that users will notice**
**PHASES.md tasks:** 3.5A.1, 3.5A.2, 3.5C.3, and unblocks 2B.2 / 2B.4 / 3B.2
**Branch:** `phase-3.5/stabilization`

---

## Background

This is the most serious defect in the system.

`flowserv-api/src/routes/tickets.ts` around line 206:

```ts
const allowed = await FlowEngine.validateTransition(ticket.currentNodeId, targetNodeId, roleId);

if (!allowed) {
  return errorResponse(c, 'FORBIDDEN', 'Transition not allowed or you lack permission', [], 403);
}
```

`validateTransition` returns an **object** (`{ valid, reason }`). In JavaScript an
object is always "truthy", so `!allowed` is **never true**. The check never fires.

**Every transition is currently permitted** — invalid stage jumps, transitions the
flow template forbids, and any permission rules. The Flow Engine is the feature that
makes FlowServ different from an ordinary ERP, and right now it does nothing.

There is a second, related hole: `targetNodeId` comes straight from the request body
and is never checked against the ticket's own flow template or the caller's tenant.
Combined with the above, a user can move a ticket to **any node UUID in the
database**, including one belonging to a different tenant.

Third: `FlowEngine.executeTransition` is dead code. The route re-implements the
transition inline, so the `TICKET_STAGE_CHANGED` event never fires.

---

## ⚠️ Read this before you start — what will change for users

Turning the check on changes real behaviour. Two things were verified on 2026-07-20:

**1. Permissions will NOT lock anyone out.** The `permissions` and `rolePermissions`
tables are **never seeded** — they are empty — and every node created by
`db/seed-flows.ts` has a null `requiredPermissionId`. So the permission branch of
`evaluateTransition` is skipped entirely. Nobody gets blocked by permissions today.

**2. Invalid stage jumps WILL start failing — and that is the point.** The seeded
"Standard Repair" template only allows these moves:

```
Intake            → Diagnosis
Diagnosis         → Waiting Approval
Diagnosis         → Repair
Waiting Approval  → Repair
Waiting Approval  → Completion
Repair            → Completion
```

Anything else now returns **409**. In particular there is **no way back** — no
`Repair → Diagnosis` rework path — and `Completion` has no outgoing transitions at
all (correct: it is the end).

If the ticket detail UI currently offers every node as a button, some of those
buttons will start failing after this change. **That is correct behaviour**, not a
regression. But check the UI and, if it lists all nodes blindly, make it show only
nodes reachable from the current one. `GET /v1/flows/:id` already returns the
transitions needed to work this out.

If the shop genuinely needs a rework path, add the transition to `seed-flows.ts` —
do not weaken the check.

---

## Goal

1. Actually enforce the transition rules.
2. Return the correct status codes: **409** for a forbidden transition, **403** for a
   permission failure.
3. Scope the target node to the ticket's own flow template and tenant.
4. Make the stage-changed event actually fire.

---

## Files to change

| File | Action |
|---|---|
| `flowserv-api/src/routes/tickets.ts` | fix the check, pass the new arguments |
| `flowserv-api/src/services/flow-engine.ts` | wire `executeTransition`, or retire it |
| `flowserv-api/src/services/__tests__/flow-engine.test.ts` | extend |

---

## Step 1 — Fix the check

In the transition handler in `routes/tickets.ts`:

```ts
const result = await FlowEngine.validateTransition(
  tenantId,
  ticket.flowTemplateId,   // <-- new: scopes the target node
  ticket.currentNodeId,
  targetNodeId,
  roleId
);

if (!result.valid) {
  // 403 = you are not allowed; 409 = the flow does not permit this move at all
  const status = result.code === 'PERMISSION_DENIED' ? 403 : 409;
  return errorResponse(c, result.code, result.reason, [], status);
}
```

Note what improves here beyond the bug fix:

- `result.valid`, not `result` — the actual fix
- `result.code` and `result.reason` are returned, so the user learns *why*
- **409** for an invalid transition, matching `coding-guidelines.md` §3.3
  ("state conflict"). Returning 403 for everything, as it does now, was wrong even
  when the check worked.

---

## Step 2 — Make the event fire

`FlowEngine.executeTransition` currently exists but is never called; the route does
the database work itself. Pick one:

**Option A (preferred).** Move the ticket update + history insert into
`executeTransition`, and have the route call it. This matches
`coding-guidelines.md` §6 — the route stays thin, the logic is testable.

**Option B.** Delete `executeTransition` and emit the event directly from the route's
transaction.

Either way, after a successful transition this must run:

```ts
emitEvent(AppEvent.TICKET_STAGE_CHANGED, {
  ticketId, fromNodeId, toNodeId, userId, timestamp: new Date().toISOString(),
});
```

Do **not** leave a function that looks like it works but is never called — that is
what caused this whole task.

> There are currently no listeners for this event anywhere. Emitting it is still
> correct: Phase 4.5 adds ledger posting that will subscribe to it.

---

## Step 3 — Extend the tests

Add to `flow-engine.test.ts`:

1. A transition against the real seeded shape: `Intake → Diagnosis` is allowed
2. `Intake → Completion` is rejected with `TRANSITION_NOT_ALLOWED`
3. A target node from a different `flowTemplateId` is rejected with
   `NODE_WRONG_TEMPLATE`

These are pure-function tests against `evaluateTransition` — no database needed.

---

## How to verify (evidence required)

Needs the API running and a ticket in the `Intake` stage.

**Test 1 — a valid move still works:**
```bash
curl -X POST http://localhost:3001/v1/tickets/<TICKET_ID>/transition \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"targetNodeId":"<DIAGNOSIS_NODE_ID>"}'
```
Expect **200**.

**Test 2 — an invalid jump is now blocked:**
```bash
curl -X POST http://localhost:3001/v1/tickets/<TICKET_ID>/transition \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"targetNodeId":"<COMPLETION_NODE_ID>"}'
```
Expect **409** with code `TRANSITION_NOT_ALLOWED`.
**Before this fix, this returns 200 and the ticket skips the entire repair process.**

**Test 3 — `npm test` passes**, including the new cases.

**Evidence:** all three outputs. Test 2 is the one that proves the bug is fixed.

---

## Do NOT do

- **Do not** weaken the rules to make the existing UI work. If a button now fails,
  either the UI is wrong (fix it to offer only reachable nodes) or the flow template
  is missing a transition (add it to the seed). Never delete the check.
- **Do not** build RBAC permission middleware here. Node-level permissions are all
  null today; general endpoint RBAC is Phase 4.5.
- **Do not** seed the `permissions` / `rolePermissions` tables in this task. That is
  Phase 4.5B and it needs the full permission catalog from
  `specification/03-rbac-roles.md`.
- **Do not** also fix ticket auto-close here — that is task 05.

---

## When done

Mark in `PHASES.md`: `3.5A.1`, `3.5A.2`, `3.5C.3` as `[x]`. Also revisit `2B.2`,
`2B.4`, and `3B.2` — they should now be genuinely complete.

Commit: `fix(flow-engine): enforce transition validation and scope target node`
