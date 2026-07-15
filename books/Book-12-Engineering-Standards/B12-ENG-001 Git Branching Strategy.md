---
document_id: B12-ENG-001
title: Git Branching Strategy
version: 1.0.0
last_updated: 2026-07-04
author: Universal Service ERP Team
---

# Git Branching Strategy

## Purpose
Defines how multiple developers work on the same codebase simultaneously without causing conflicts or breaking the live application.

---

# 1. The Main Branches

The repository utilizes two permanent branches:
1. `main` (Production): This code is currently running in the live application. It must be 100% stable. **Direct commits to `main` are strictly forbidden.**
2. `staging` (Testing): This code runs on the internal testing server. This is where QA teams simulate the Cashier/Technician flows before releasing to the public.

# 2. Feature Branches

When a developer starts working on a new feature (e.g., adding a new Dynamic Widget), they must create a temporary branch off `staging`.

## Naming Convention
* `feature/dynamic-widgets` (For new features)
* `bugfix/fifo-calculation` (For fixing issues)
* `hotfix/login-crash` (Emergency fix branched directly off `main`)

# 3. The Workflow
1. Developer branches off `staging`.
2. Developer writes code and commits locally.
3. Developer pushes the branch to GitHub.
4. Developer opens a Pull Request (PR) targeting `staging`.
