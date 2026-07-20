# Task 07 — Merge to Main and Make the Docs Honest

**Depends on:** tasks 01–06 complete
**Risk:** Low
**PHASES.md tasks:** 3.5D.1 – 3.5D.4
**Branch:** `phase-3.5/stabilization` → `main`

---

## Background

Two pieces of cleanup close the phase.

**Branch state.** `main` has not moved since Phase 1. Everything since — all of Phase
2, 3, and 4 — lives on `phase-4/purchasing`, plus now `phase-3.5/stabilization`. The
rule "never commit to `main`" is currently protecting nothing, because `main` holds
almost no work. Task 1F.5 and 2C.3 were both merge steps that never happened.

**Documentation.** `specification/` describes ~170 features. Roughly 25 exist. Nothing
in those documents says which is which, so the feature catalog reads as though all
~100 MVP features are current scope. That is how the phase plan drifted in the first
place.

---

## Step 1 — Merge

Before merging, confirm the phase is genuinely finished:

```bash
cd flowserv-api && npm test          # must pass
```

Start both apps and walk one full path by hand: log in → see the full sidebar →
create a ticket → transition it to Diagnosis → try an invalid jump and see it refused
→ make a POS sale → void it → check stock returned to its original level.

Then:

```bash
git checkout main
git merge phase-3.5/stabilization
```

If `main` is far enough behind that this conflicts badly, merge
`phase-4/purchasing` into `main` first, then `phase-3.5/stabilization` on top.

Verify the app still runs from a clean checkout of `main`, then branch fresh for the
next phase:

```bash
git checkout -b phase-4/purchasing-completion
```

---

## Step 2 — Update PHASES.md honestly

Go through every task touched by tasks 01–06 and mark it:

- `[x]` **only** where evidence was produced
- `[/]` where the code is written but the evidence was not (for example row locking,
  if concurrency was never actually tested)

**Do not mark anything `[x]` to make the file look tidy.** Seven tasks in the previous
version of this file were marked complete for work that did not exist. That is the
specific failure this whole phase exists to correct — repeating it here would waste
the effort.

Tasks that should now be genuinely complete, beyond the 3.5 items:

- `2B.2` transition validation — now enforced
- `2B.4` event emission — now actually fires
- `2B.5` unit tests — now exist
- `3B.2` ticket transition — now uses the flow engine properly
- `4A.3` AP routes — now has a payment endpoint
- `1F.5` and `2C.3` — the orphaned merge steps, resolved by step 1

Update the **Current Phase** header at the top to Phase 4.

---

## Step 3 — Status headers on the specification

Add a status line near the top of each `specification/features/*.md`. This is cheap
and stops the catalog from reading as current scope. Format:

```markdown
> **Implementation status (2026-07-20):** Partial
> **Built:** supplier CRUD, brand mapping, purchase orders, goods receipt, costing
> **Not built:** performance tracking, credit terms, supplier dashboard
```

Use `RECOVERY-PLAN.md` Part 1 as the source — it lists what exists per module. Where
a whole document describes something unbuilt (warranty, technician, dashboards), one
line is enough:

```markdown
> **Implementation status (2026-07-20):** Not started — planned for Phase 8.
```

**Do not rewrite the specification content.** It is aspirational, not wrong. Only add
the status header.

---

## Step 4 — Clean up

Once `PHASES.md` is accurate:

```bash
git rm RECOVERY-PLAN.md
git rm -r plan/
```

Both were scaffolding for this phase. Keeping them around means future sessions read
a stale audit and act on findings that were already fixed — which is exactly the
class of problem this phase existed to solve.

Their lasting value is already preserved in `PHASES.md`: the Definition of Done, the
Architecture Debt section, and the corrected Quick Reference table.

---

## How to verify (evidence required)

1. `git log --oneline main -5` shows the stabilization work on `main`
2. `npm test` passes from a clean checkout of `main`
3. The app starts and the manual walkthrough from step 1 succeeds
4. Spot-check five random `[x]` items in `PHASES.md` and confirm each is real —
   if any is not, fix it now

**Evidence:** the git log, the test output, and a note of which five you spot-checked.

---

## Do NOT do

- **Do not** start Phase 4 work in this task. Merge and document only.
- **Do not** delete `RECOVERY-PLAN.md` or `plan/` before `PHASES.md` is accurate —
  they are the source for the corrections.
- **Do not** force-push or rewrite history on `main`.

---

## When done

Mark in `PHASES.md`: `3.5D.1`–`3.5D.4` as `[x]`, and Phase 3.5 as complete.

Commit: `docs: phase 3.5 complete — stabilization verified and merged`
