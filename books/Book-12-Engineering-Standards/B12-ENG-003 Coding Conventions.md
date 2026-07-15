---
document_id: B12-ENG-003
title: Coding Conventions
version: 1.0.0
last_updated: 2026-07-04
author: Universal Service ERP Team
---

# Coding Conventions

## Purpose
Ensures that regardless of who wrote the code, it looks like it was written by a single person.

---

# 1. Naming Conventions

* **Database Columns & API JSON Responses:** Must use `snake_case` (e.g., `full_name`, `created_at`). This was established in `Book-06` to maintain consistency across SQL and JSON.
* **JavaScript/TypeScript Variables & Functions:** Must use `camelCase` (e.g., `calculateTotal`, `userId`).
* **React Components & TypeScript Interfaces:** Must use `PascalCase` (e.g., `ButtonComponent`, `UserProfileData`).

# 2. Code Formatting (Automation)

Developers should not waste time arguing over spaces vs tabs.
* **Prettier:** The project must include a `.prettierrc` file. All code must be auto-formatted on save.
* **ESLint:** The project must include ESLint rules to catch bad practices (like unused variables or missing React dependencies). The CI pipeline will fail if ESLint detects errors.

# 3. Conventional Commits

Git commit messages must follow the Conventional Commits specification to allow auto-generation of Changelogs.
* `feat: added printer category to widgets`
* `fix: corrected FIFO cost deduction logic`
* `docs: updated api endpoints in readme`
* `chore: updated npm dependencies`
