---
document_id: B09-SEC-002
title: Authentication & JWT
version: 1.0.0
last_updated: 2026-07-04
author: Universal Service ERP Team
---

# Authentication & JWT

## Purpose
Defines how users prove their identity to the system and how that identity is securely transmitted with every request.

---

# 1. JSON Web Token (JWT) Strategy

The system uses stateless JWTs for authentication to ensure the Backend API (built on Hono) remains extremely fast and horizontally scalable.

## Payload Structure
The JWT payload must be kept minimal to reduce request overhead. It should only contain non-sensitive identifiers necessary for access control.
```json
{
  "sub": "user-uuid-123",
  "role": "cashier",
  "branch_id": "branch-uuid-456",
  "exp": 1700000000
}
```
*Note: `branch_id` is critical. Embedding it in the JWT prevents a cashier from easily manipulating API requests to view another branch's data.*

---

# 2. Token Storage & Transmission

To protect against Cross-Site Scripting (XSS) attacks, the JWT must be handled securely by the Frontend.

## The Standard Rule
* **HttpOnly Cookies:** It is highly recommended that the Backend sets the JWT inside an `HttpOnly`, `Secure`, `SameSite=Strict` cookie upon login. This makes it impossible for malicious JavaScript running in the browser to steal the token.
* **Fallback (Authorization Header):** If Cookies are not viable due to cross-domain API setups, the Frontend must send the token via the `Authorization: Bearer <token>` header, but must store it securely in memory, NOT in standard `localStorage`.

---

# 3. Session Expiration

* Standard employee tokens should have a short lifespan (e.g., 12 - 24 hours) to force a re-login at the start of a new shift, ensuring that fired employees lose access quickly.
