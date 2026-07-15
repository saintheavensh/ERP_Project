---
document_id: B12-ENG-002
title: Pull Request Guidelines
version: 1.0.0
last_updated: 2026-07-04
author: Universal Service ERP Team
---

# Pull Request (PR) Guidelines

## Purpose
Defines the mandatory Code Review process. Code reviews are the single most effective way to catch bugs, security flaws, and architectural deviations before they reach production.

---

# 1. PR Requirements

Before a Pull Request can be merged into `staging` or `main`, it MUST meet the following criteria:

* **Passing CI Pipeline:** All Automated Tests (Book-10) and Linters must pass green.
* **No Architectural Violations:** The code must respect the rules in Book-05 (Business) and Book-06 (Database). *Example: If a PR contains a raw SQL `DELETE` statement, it must be rejected immediately (violates Immutability Triad).*
* **Minimum Approvals:** At least one Senior Developer must review and click "Approve".

# 2. Reviewer Responsibilities

The reviewer is just as responsible for a bug as the author. When reviewing, check for:
1. **Security:** Did they properly use Zod for validation? Did they check JWT roles?
2. **Performance:** Are they querying a table without an index?
3. **Readability:** Is the code overly complex or undocumented?

# 3. Merging
Once approved, use "Squash and Merge" to keep the Git history clean and readable.
