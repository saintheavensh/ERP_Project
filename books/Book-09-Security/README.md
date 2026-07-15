# Book 09 - Security Architecture

This directory contains the specifications for securing the Universal Service ERP.
Security is not an afterthought; it is woven into the API and Database layers.

## Core Security Pillars
1. **Zero Trust Architecture:** The backend never trusts the frontend. All inputs are validated strictly via Zod.
2. **Branch Data Isolation:** A cashier in Branch A cannot access data from Branch B.
3. **Role-Based Access Control (RBAC):** Every API endpoint explicitly verifies the user's role before executing business logic.
4. **Historical Immutability:** Data is never physically deleted, preventing malicious tracks-covering.

## Specification Documents

* **[B09-SEC-001 Security Principles](B09-SEC-001%20Security%20Principles.md):** Defines Zero Trust and Least Privilege.
* **[B09-SEC-002 Authentication & JWT](B09-SEC-002%20Authentication%20&%20JWT.md):** Defines how users log in and how sessions are managed securely.
* **[B09-SEC-003 Role Based Access Control](B09-SEC-003%20Role%20Based%20Access%20Control.md):** Defines the permission matrix for the API.
* **[B09-SEC-004 Branch Data Isolation](B09-SEC-004%20Branch%20Data%20Isolation.md):** Defines the multitenancy-like structure for multi-branch operations.
* **[B09-SEC-005 Data Protection](B09-SEC-005%20Data%20Protection.md):** Defines password hashing and PII protection rules.
