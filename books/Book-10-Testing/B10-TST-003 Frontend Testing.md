---
document_id: B10-TST-003
title: Frontend Testing
version: 1.0.0
last_updated: 2026-07-04
author: Universal Service ERP Team
---

# Frontend Testing Strategy

## Purpose
Defines how to ensure the User Interface remains intuitive, functional, and bug-free across browser updates.

---

# 1. Component Testing

Recommended Framework: **React Testing Library** + **Vitest**.
* Tests isolated React/Next.js components without booting up the entire application.
* **Target:** Dynamic Widgets. 
  * *Test Case:* Render the Intake Form, pass a mock prop `category="Printer"`, and assert that the `Ink Level` dropdown is visible on the screen.

# 2. End-to-End (E2E) Testing

Recommended Framework: **Playwright** or **Cypress**.
* E2E tests launch a real Chromium browser, navigate to the application URL, and simulate human clicks and typing.

## Critical User Journeys (CUJ)
The following workflows MUST have an E2E test script to prevent critical business halts:
1. **The Cashier Intake Flow:** 
   - Script logs in as Cashier.
   - Navigates to Intake.
   - Types customer details.
   - Selects "Smartphone".
   - Submits form.
   - Asserts a Success Toast appears and the Service Order is visible in the list.
2. **The Technician Flow:**
   - Script logs in as Technician.
   - Drags a ticket from "To Do" to "In Progress".
   - Asserts the API was called and the timer started.
3. **The Checkout Flow:**
   - Script navigates to an Unpaid Invoice.
   - Clicks "Pay Full Amount" using Cash.
   - Asserts the Invoice status changes to Paid.

## E2E Mocking
To prevent E2E tests from generating garbage data in the real database, the tests should run against a Staging Database, or the Frontend should be configured to use mock API responses (via tools like MSW - Mock Service Worker) during the test run.
