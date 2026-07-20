# FlowServ — Implementation Plan (Phase 3.5 Stabilization)

**Created:** 2026-07-20
**Phase:** 3.5 — Stabilization
**Branch:** `phase-3.5/stabilization`
**Source of findings:** `RECOVERY-PLAN.md` (root)

---

## How to use this folder

Each file in `plan/tasks/` is **one self-contained job**. To have it built, start a
session and mention the file:

```
Do @plan/tasks/task-01-testing-foundation.md
```

Each task file contains everything needed on its own — the background, the exact
files to change, the code, how to check it worked, and what *not* to touch. You do
not need to explain the context yourself, and you do not need to have this
conversation open.

**Do them in order.** Later tasks depend on earlier ones. Each task says what it
depends on at the top.

---

## The order, and why

| # | Task | Risk | Why here |
|---|------|------|----------|
| 01 | [Testing foundation](tasks/task-01-testing-foundation.md) | Low | Nothing can be *proven* fixed until tests can run. Also creates the first clean service layer. |
| 02 | [Sidebar role fix](tasks/task-02-sidebar-role-fix.md) | Low | Small, visible, independent. Something improves before risky changes land. |
| 03 | [Flow engine enforcement](tasks/task-03-flow-engine-enforcement.md) | **Medium** | The most severe bug. Needs task 01's tests to land safely. |
| 04 | [Purchasing receive fixes](tasks/task-04-purchasing-receive-fixes.md) | Medium | Three bugs in one function — fix together, not separately. |
| 05 | [Data integrity](tasks/task-05-data-integrity.md) | Medium | Row locking, error codes, ticket closure, void guard. |
| 06 | [AP payment endpoint](tasks/task-06-ap-payment-endpoint.md) | Low | The only new feature. Closes Phase 4A.3. |
| 07 | [Merge and docs](tasks/task-07-merge-and-docs.md) | Low | Get `main` current again; make the checkboxes honest. |

Tasks 01–03 are the important ones. If you only get through those, the system is
meaningfully safer than it is today.

---

## The one rule that matters

**A task is only done when there is evidence.** A passing test, or a recorded API
request and response, or a click-path you actually walked. Every task file ends
with a "How to verify" section that tells you exactly what evidence to produce.

This rule exists because the previous plan had seven tasks marked complete that were
never built. They were all marked by someone who had just written the code and had
not run it.

If the evidence can't be produced (for example, the database isn't running), mark
the task `[/]` in `PHASES.md`, not `[x]`, and note what's missing.

---

## Scope guard — read before starting any task

The backend does not follow the module structure in
`specification/coding-guidelines.md` §2. There is no service layer; business logic
lives inside HTTP route handlers.

**Do not fix this globally.** A whole-codebase restructure, with no tests to catch
mistakes, is the fastest way to break a working application.

Instead: when a task tells you to touch a module, extract that module's `service.ts`
*then*, with a test. Leave every other module alone. Over several phases most of the
codebase converts, and every step stays verifiable.

Each task file has a **"Do NOT do"** section. Respect it. Scope creep is what
produced the current state.

---

## Progress

- [x] 01 — Testing foundation (task file deleted — see commit bf3adc6)
- [x] 02 — Sidebar role fix (task file deleted)
- [ ] 03 — Flow engine enforcement
- [ ] 04 — Purchasing receive fixes
- [ ] 05 — Data integrity
- [ ] 06 — AP payment endpoint
- [ ] 07 — Merge and docs

When all seven are checked: delete `RECOVERY-PLAN.md`, delete this `plan/` folder,
and move `PHASES.md` on to Phase 4.
