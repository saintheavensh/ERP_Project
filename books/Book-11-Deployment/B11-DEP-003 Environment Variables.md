---
document_id: B11-DEP-003
title: Environment Variables
version: 1.0.0
last_updated: 2026-07-04
author: Universal Service ERP Team
---

# Environment Variables

## Purpose
Defines the rules for handling sensitive configuration keys (Secrets).

---

# 1. The Golden Rule
**Never commit `.env` files to the Git repository.**

# 2. Required Secrets
The application requires at least the following Environment Variables to run:

* `DATABASE_URL`: Connection string to the PostgreSQL database.
* `JWT_SECRET`: A long, random cryptographic string used to sign and verify user login tokens. If this is leaked, an attacker can forge any login.
* `CORS_ORIGIN`: Defines which Frontend URL is allowed to talk to the Backend API (preventing unauthorized websites from making API calls).

# 3. Secret Management
* **Local Development:** Developers use a `.env.local` file (which is ignored by Git).
* **Production:** Secrets are entered manually into the Vercel/Cloudflare dashboard by the Project Owner. Developers do not need to know the Production `DATABASE_URL`.
