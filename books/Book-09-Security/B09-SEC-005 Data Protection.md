---
document_id: B09-SEC-005
title: Data Protection
version: 1.0.0
last_updated: 2026-07-04
author: Universal Service ERP Team
---

# Data Protection

## Purpose
Defines how highly sensitive data (Passwords, Personally Identifiable Information) is protected at rest and in transit.

---

# 1. Password Storage

**Plaintext passwords are strictly forbidden.**
* All user passwords (and Manager PINs) must be hashed using a strong, salted algorithm (e.g., `bcrypt` with a cost factor of at least 10, or `argon2`) before being saved to the database.
* The API should never return password hashes in `GET /api/users` responses.

# 2. Personally Identifiable Information (PII)

Customer data (Names, Phone Numbers, Emails) and Device identifiers (IMEI) are considered PII.
* While encrypting these at rest (in the database) might be overkill for a standard ERP (unless required by local law), the API must protect this data in transit by enforcing **HTTPS/TLS 1.2+** across all environments (including staging).

# 3. Input Sanitization (XSS & SQLi)

* **SQL Injection:** Utilizing an ORM (like Prisma, Drizzle) or the Supabase Client automatically parameterizes queries, eliminating standard SQL injection vectors. Raw SQL queries are prohibited without explicit peer review.
* **Cross-Site Scripting (XSS):** Zod validation helps ensure data conforms to expected types. However, if a user inputs malicious HTML into a `device_condition_notes` field, the Frontend (React) automatically escapes this by default. Developers must never use `dangerouslySetInnerHTML` in the Frontend when rendering user-generated notes.
