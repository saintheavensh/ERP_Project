# Task 01 — Testing Foundation

**Depends on:** nothing — start here
**Risk:** Low (adds new code, changes almost no behaviour)
**PHASES.md tasks:** 3.5C.1, 3.5C.2
**Branch:** `phase-3.5/stabilization`

---

## Background

There are **zero test files** in this repository. `npm test` in `flowserv-api/`
still prints `Error: no test specified` and exits 1. Vitest is installed as a
dependency but has never been configured or used.

`specification/coding-guidelines.md` §9 requires tests for the flow engine, FIFO
batch logic, the finance ledger, and RBAC — the four places where a bug silently
costs real money.

The reason none exist is structural: all business logic lives inside HTTP route
handlers and database calls, so there is nothing that can be called directly from a
test. This task fixes that for the flow engine specifically, which is what task 03
needs.

---

## Goal

1. Make `npm test` work.
2. Split `FlowEngine.validateTransition` into two pieces: a **pure decision function**
   that can be tested with no database, and a thin database wrapper around it.

No behaviour changes for the running application. This task only reshapes code and
adds the ability to test it.

---

## Files to change

| File | Action |
|---|---|
| `flowserv-api/vitest.config.ts` | create |
| `flowserv-api/package.json` | edit the `test` script |
| `flowserv-api/src/services/flow-engine.ts` | refactor into pure + wrapper |
| `flowserv-api/src/services/__tests__/flow-engine.test.ts` | create |

---

## Step 1 — Vitest config

Create `flowserv-api/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
```

In `flowserv-api/package.json`, replace the placeholder test script:

```json
"test": "vitest run",
"test:watch": "vitest"
```

---

## Step 2 — Split the flow engine

Currently `validateTransition` fetches from the database and decides, all in one
function. That makes it impossible to test without a live database.

Split it so the **decision** is a plain function taking plain arguments.

In `flowserv-api/src/services/flow-engine.ts`, add:

```ts
/**
 * All the facts the decision needs, already fetched.
 * Keeping this separate from the DB lets us test every rule with no database.
 */
export type TransitionFacts = {
  transitionExists: boolean;
  ticketFlowTemplateId: string;
  targetNode: {
    id: string;
    flowTemplateId: string;
    requiredPermissionId: string | null;
  } | null;
  rolePermissionIds: string[];
};

export type TransitionResult =
  | { valid: true }
  | { valid: false; code: TransitionErrorCode; reason: string };

export type TransitionErrorCode =
  | 'NODE_NOT_FOUND'
  | 'NODE_WRONG_TEMPLATE'
  | 'TRANSITION_NOT_ALLOWED'
  | 'PERMISSION_DENIED';

/**
 * Pure decision — no database, no HTTP. This is the piece we test.
 */
export function evaluateTransition(facts: TransitionFacts): TransitionResult {
  if (!facts.targetNode) {
    return {
      valid: false,
      code: 'NODE_NOT_FOUND',
      reason: 'Target node not found.',
    };
  }

  // A ticket may only move between nodes of its OWN flow template.
  // Without this check any node UUID in the database is reachable,
  // including another tenant's.
  if (facts.targetNode.flowTemplateId !== facts.ticketFlowTemplateId) {
    return {
      valid: false,
      code: 'NODE_WRONG_TEMPLATE',
      reason: 'Target node belongs to a different flow template.',
    };
  }

  if (!facts.transitionExists) {
    return {
      valid: false,
      code: 'TRANSITION_NOT_ALLOWED',
      reason: 'This transition is not allowed by the flow template.',
    };
  }

  if (facts.targetNode.requiredPermissionId) {
    if (!facts.rolePermissionIds.includes(facts.targetNode.requiredPermissionId)) {
      return {
        valid: false,
        code: 'PERMISSION_DENIED',
        reason: 'Your role lacks the permission required for this stage.',
      };
    }
  }

  return { valid: true };
}
```

Then rewrite `FlowEngine.validateTransition` so it **only fetches data and calls
`evaluateTransition`**. It must now also accept the ticket's `flowTemplateId` and
the `tenantId`, and every query must filter by `tenantId`.

Roughly:

```ts
static async validateTransition(
  tenantId: string,
  ticketFlowTemplateId: string,
  currentNodeId: string,
  targetNodeId: string,
  roleId: string
): Promise<TransitionResult> {
  // fetch transition rows, target node, and the role's permission ids
  // (all scoped by tenantId)
  // then:
  return evaluateTransition({ ... });
}
```

**Note on scoping:** `flowNodes` has no `tenantId` column of its own — it belongs to
a `flowTemplate`, which does. Scope by joining to `flowTemplates` and filtering on
`flowTemplates.tenantId`. Check the actual schema in
`flowserv-api/src/db/schema/flow.ts` before writing the query; do not guess.

Leave `FlowEngine.executeTransition` alone for now — task 03 deals with it.

---

## Step 3 — Write the tests

Create `flowserv-api/src/services/__tests__/flow-engine.test.ts`. Cover at minimum:

1. Valid transition, node needs no permission → `{ valid: true }`
2. Valid transition, node needs a permission the role **has** → `{ valid: true }`
3. Valid transition, node needs a permission the role **lacks** → `PERMISSION_DENIED`
4. Transition not in the template → `TRANSITION_NOT_ALLOWED`
5. Target node is null → `NODE_NOT_FOUND`
6. Target node belongs to a different template → `NODE_WRONG_TEMPLATE`

Use the pattern in `specification/coding-guidelines.md` §9 (Arrange / Act / Assert).
These are plain function calls — no database, no mocking needed.

---

## How to verify (evidence required)

Run in `flowserv-api/`:

```bash
npm test
```

**Evidence:** the passing output, showing 6 or more passing tests.

Then confirm nothing broke: start the API (`npm run dev`) and load a ticket detail
page in the web app. Transitions still behave exactly as before — this task does
not change behaviour, only structure.

---

## Do NOT do

- **Do not** refactor any other module into `service.ts`. Only the flow engine.
- **Do not** change how transitions behave. The `if (!allowed)` bug in
  `routes/tickets.ts` stays broken until task 03 — fixing it here would mean
  shipping a behaviour change with no test coverage for the route yet.
- **Do not** add integration tests that need a live database. Pure functions only.
- **Do not** rename or move `services/flow-engine.ts` yet.

---

## When done

Mark in `PHASES.md`: `3.5C.1` and `3.5C.2` as `[x]`.

Commit: `test: add vitest setup and flow engine decision tests`
