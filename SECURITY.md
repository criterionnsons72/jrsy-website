# Security Policy

> Legal/compliance content in this project is **placeholder and marked for review by a qualified lawyer**. This document describes technical posture, not legal guarantees.

## Sensitive data
Body images and body measurements are treated as **sensitive**:
- Explicit **consent** is required before any image processing (`ConsentRecord`).
- Stored **encrypted** (in transit + at rest); assets served only via **signed, short-lived URLs**.
- **Delete My Data / Delete Uploaded Image** supported; deletion nulls asset refs and marks status `deleted`.
- **Data minimisation** and a retention policy; auto-delete option on try-on assets.

## Access control
- JWT access + refresh tokens; refresh tokens stored **hashed** and revocable (sessions).
- **RBAC** via `@Roles()` + `RolesGuard` on every privileged route (12 roles).
- Passwords hashed with **argon2**.

## Application hardening
- **Helmet** security headers; **CORS** restricted to configured origins.
- Global **rate limiting** (100/min per IP); **auth routes 5/min**.
- Global **input validation** (class-validator DTOs; Zod for env) — unknown fields rejected.
- **Prisma** parameterises all queries (SQL-injection safe).
- Consistent, **non-leaky error envelope** (no stack traces to clients); 5xx logged server-side.
- Append-only **audit logs** on privileged actions.
- Secrets via env / secrets manager — never committed (`.gitignore` enforced).

## Still required before production (tracked)
- Real object-storage upload with presigned URLs + server-side malware scan.
- BullMQ workers for background jobs (try-on, documents, deletion, analytics rollups).
- CSRF tokens for any cookie-based flows (current API is bearer-token).
- Dependency & container image scanning in CI (image scan step present).
- Penetration test + qualified-lawyer review of all legal/consent copy.

## Reporting a vulnerability
Email the maintainer privately. Do not open public issues for security reports.
