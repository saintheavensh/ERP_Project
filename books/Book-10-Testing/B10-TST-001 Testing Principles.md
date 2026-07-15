---
document_id: B10-TST-001
title: Testing Principles
version: 1.0.0
last_updated: 2026-07-04
author: Universal Service ERP Team
---

# Testing Principles

## Purpose
Establishes the non-negotiable rules for software quality.

---

# 1. Zero Regression Tolerance

A "Regression" occurs when a developer adds a new feature but accidentally breaks an existing, working feature.
* To prevent this, every critical business workflow must have an automated test.
* Before any code is deployed to Production, the Continuous Integration (CI) pipeline must run all tests. If even one test fails, the deployment is **ABORTED**.

# 2. Code Coverage Targets

Code Coverage is a metric showing what percentage of the application's source code is executed during automated tests.

* **Core Financial Logic (Book-05):** `100% Coverage Required`. Algorithms that calculate FIFO COGS, Technician Commissions, and Invoice Totals must be fully tested against all edge cases (e.g., negative numbers, zero values).
* **API Controllers (Book-07):** `> 80% Coverage Required`. Every endpoint must have at least one "Happy Path" test (success) and one "Sad Path" test (validation failure).
* **UI Components (Book-08):** `> 60% Coverage Required`. UI changes frequently, so testing every button color is a waste of time. Focus UI tests only on critical interactions (e.g., ensuring the 'Checkout' button is disabled if the cart is empty).

# 3. Test Independence

* Tests must never depend on each other. Test B must not fail just because Test A ran before it.
* Every test must set up its own mock data and clean it up afterward (Database Teardown).
