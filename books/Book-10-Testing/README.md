# Book 10 - Testing Strategy

This directory defines the automated Quality Assurance (QA) strategy for the Universal Service ERP. Because this application processes financial transactions and inventory movements, software bugs can directly result in monetary loss.

## The Testing Pyramid
1. **Unit Tests (Large Volume):** Fast, isolated tests for core business logic (e.g., FIFO calculations, Commission rules).
2. **Integration Tests (Medium Volume):** Tests to ensure the Backend API talks to the Database correctly (e.g., creating a Service Order triggers the right row insertions).
3. **End-to-End Tests (Small Volume):** Automated browser scripts that simulate a real cashier processing a repair from start to finish.

## Specification Documents

* **[B10-TST-001 Testing Principles](B10-TST-001%20Testing%20Principles.md):** Defines code coverage requirements and CI/CD blocking rules.
* **[B10-TST-002 Backend Testing](B10-TST-002%20Backend%20Testing.md):** Defines strategies for testing Hono endpoints, Zod validations, and PostgreSQL transactions.
* **[B10-TST-003 Frontend Testing](B10-TST-003%20Frontend%20Testing.md):** Defines UI component testing and Playwright E2E simulation.
