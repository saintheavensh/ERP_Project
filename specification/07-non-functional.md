# Non-Functional Requirements

## Multi-Tenancy & Data Isolation

- Every request MUST carry tenant identity via authentication token (JWT claim), **never** from client-sent parameters.
- Every database query MUST filter by `tenant_id` at application level (ORM middleware), **and** reinforced with Row-Level Security at database level (defense in depth).
- No table/endpoint returns cross-tenant data, except for Platform Super Admin.

## Security

- Passwords are hashed (bcrypt/argon2), never stored or logged in plain text.
- All API endpoints MUST go through permission checks at backend level — **do not rely solely on UI hiding buttons**; UI hiding is not a security boundary.
- **Cross-module audit log (mandatory)**: `audit_logs` table records every significant action — who (actor), what action, on which entity, when, from which IP, and before/after details when relevant. Minimum scope: role/permission changes, void transactions, manual stock adjustments, approve refunds, ticket stage transitions, Flow Template changes, tenant settings changes. Implementation should be a middleware/interceptor, not manually written in each function.
- In-transit encryption (TLS) is mandatory; at-rest encryption for financial/personal data is recommended.

## Data Compliance (Indonesia Context)

- Target users are Indonesia-based. Follow **UU No. 27 Tahun 2022 (Personal Data Protection Law)** — especially regarding consent for storing customer data (name, contact, service history) and customer's right to request data deletion.
- If possible, define data center location (data residency) per enterprise client compliance needs.

## Scalability (Illustrative Targets)

| Metric | MVP Target | Enterprise Target |
|--------|-----------|------------------|
| Concurrent users per tenant | 50 | 500+ |
| Service tickets per day per tenant | 200 | 5,000+ |
| API response time (p95) | < 500ms | < 300ms |
| Uptime | 99.5% | 99.9% |

*These are starting points for capacity planning, not contractual SLAs — adjust with real traffic data.*

## Observability

- Structured logging (JSON) with `request_id` and `tenant_id` in every log entry.
- Monitor key metrics: API latency, error rate, queue depth, stock discrepancy rate.
- Alerting for critical conditions: failed/delayed event processing, unexpected permission check bypasses.

## Backup & Disaster Recovery

- Daily database backup minimum, with retention per audit needs (recommended: 30 days).
- Test backup restoration periodically.
