# flow-engine

Owns the transition decision for a service ticket: given the current node, a
requested target node, and the caller's role, is this move allowed?

- `engine.ts` — `evaluateTransition` (pure, no DB — the piece the tests
  exercise) plus the `FlowEngine` class that fetches facts and executes a
  validated transition inside one DB transaction.
- `types.ts` — `TransitionFacts` / `TransitionResult` / `TransitionErrorCode`.
- No `events.ts`: this module emits one event (`TICKET_STAGE_CHANGED`) using
  the shared, cross-cutting `services/event-bus.ts` — that bus is not
  flow-engine-specific (finance, POS, and purchasing all use it too), so it
  stays where every other emitter can find it instead of being pulled in here.

**Emits:** `TICKET_STAGE_CHANGED` (after a successful transition commits).
**Listens for:** nothing — it is a pure decision + writer, not a subscriber.
**Consumed by:** `routes/tickets.ts` (the only importer of `FlowEngine`).
