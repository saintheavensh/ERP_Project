---
document_id: B11-DEP-002
title: CI/CD Pipelines
version: 1.0.0
last_updated: 2026-07-04
author: Universal Service ERP Team
---

# CI/CD Pipelines

## Purpose
Continuous Integration and Continuous Deployment (CI/CD) ensures that developers cannot manually upload broken code to the live servers.

---

# 1. Continuous Integration (CI)

Implemented via **GitHub Actions**.
Whenever a developer pushes code to the repository or opens a Pull Request (PR), the CI server automatically:
1. Installs dependencies (`npm install`).
2. Runs the Linter and Formatter (`npm run lint`).
3. Runs the Automated Tests defined in `Book-10` (`npm run test`).
4. Compiles the application to catch TypeScript errors.

**Rule:** If any step fails, the GitHub PR is blocked and cannot be merged.

# 2. Continuous Deployment (CD)

Once the code is approved and merged into the `main` branch, the CD pipeline takes over:
1. **Frontend:** Vercel automatically detects the merge and builds the new UI.
2. **Backend:** GitHub Actions triggers a deploy to Cloudflare Workers.
3. **Database:** Supabase Migrations run automatically to apply any schema changes before the new Backend comes online.

**Rule:** No developer is allowed to manually `ftp` or SSH into a server to change code. All deployments MUST go through Git.
