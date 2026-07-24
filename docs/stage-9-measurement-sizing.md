# Stage 9 — Measurement & Sizing

**Project:** Tailor Master — Virtual Try-On & Custom-Measurement Clothing E-Commerce PWA
**Stage:** 9 of 14
**Status:** Awaiting approval
**Depends on:** Stage 1–8 (approved)

> Interactive measurement wizard published (live outlier detection, dual-entry, confidence, body→garment formula). See chat for the link.

---

## 1. Objective
Body profiles, measurement capture + validation, the body→garment→final formula, fit preferences, and the tailor review queue with measurement locking before production.

## 2. Deliverables
- `BodyProfile`, `Measurement`, `MeasurementReview` models + enums.
- **Pure formula engine** (Body + Ease + Fit + Stretch + Shrinkage + Tolerance) — unit-tested.
- **Pure validation engine** (ranges, ratio outliers, dual-entry, confidence) — unit-tested.
- Body-profile CRUD, measurement capture, submit-for-review APIs.
- Tailor review queue (role-gated) with approve→lock.
- RBAC roles guard + `@Roles()` decorator.
- Web profiles/measurement page.

## 3. Backend

**Schema:** `BodyProfile` (multiple per customer, label, height/weight, fitPreference, verifiedByTailor). `Measurement` (kind = **body | garment | final** — kept distinct, source, `values` JSONB in cm, `outlierFlags`, `confidence`, `lockedAt`). `MeasurementReview` (status pending/approved/rejected, reviewerId, notes). Enums: FitPreference, MeasurementKind, MeasurementSource, ReviewStatus.

**Formula engine** (`measurement-formula.service.ts`) — pure:
```
Body + Ease + Fit preference + Fabric stretch + Shrinkage + Production tolerance = Final
```
Per-key ease allowances; slim/regular/relaxed adjust girth ease; stretch fabric needs ~40% less ease; shrinkage % + tolerance applied to the final. Returns **garment** and **final** separately. 4 unit tests.

**Validation engine** (`measurement-validation.service.ts`) — pure: plausibility ranges per key, ratio/outlier detection (waist-vs-chest, hip-vs-waist), **dual-entry** confirmation for critical measurements (chest/waist/hip, ±1.5cm), and a **confidence score** (penalised by outliers, missing confirmations, and source). 5 unit tests.

**APIs:**
- `POST /api/v1/body-profiles` · `GET` · `GET /:id` — profiles (auth: customer).
- `POST /api/v1/body-profiles/:id/measurements` — validates; rejects on dual-entry mismatch; stores flags + confidence.
- `POST /api/v1/measurements/:id/submit-review` — enqueue for tailor review.
- `GET /api/v1/measurement-reviews` · `PATCH /api/v1/measurement-reviews/:id` — **role-gated** (tailor / measurement_reviewer / admin). Approve → sets `lockedAt` + `verifiedByTailor` in a transaction.

**RBAC:** new `@Roles()` decorator + `RolesGuard` (loads role keys from DB; runs after JwtAuthGuard).

## 4. Frontend
`/account/profiles` — list & create profiles; inline measurement capture for critical values with **dual-entry**, live confidence + outlier feedback from the API, verified/locked badges.

## 5. How to test (local)
```bash
npm run db:migrate -w apps/api && npm run db:seed -w apps/api
npm run test -w apps/api      # formula (4) + validation (5) unit tests
npm run dev
# register/login → Bearer token, then:
curl -X POST http://localhost:3001/api/v1/body-profiles -H "Authorization: Bearer <t>" \
  -H 'Content-Type: application/json' -d '{"label":"Mine","fitPreference":"regular"}'
curl -X POST http://localhost:3001/api/v1/body-profiles/<id>/measurements -H "Authorization: Bearer <t>" \
  -H 'Content-Type: application/json' \
  -d '{"kind":"body","source":"manual","values":{"chest":100,"waist":88,"hip":102},"confirmValues":{"chest":100,"waist":88,"hip":102}}'
```

## 6. Verification in this environment
- Files created & reviewed; schema/JSON validated; formula & validation logic mirrored 1:1 in the interactive demo. Pure engines covered by 9 unit tests total. Full install/test runs in CI.

---

## Completion Report — Stage 9

**Completed**
- Body profiles, body/garment/final separation, pure formula + validation engines (+9 tests), capture/review APIs, tailor review queue with locking, RBAC guard, web page, interactive demo. Pushed.

**Pending**
- Approval for Stage 10 (Virtual Try-On adapter — mock provider first).
- Confirm ease/shrinkage defaults with your master tailor (currently sensible defaults).

**Risks**
- Ease/shrinkage numbers are defaults — flagged for tailor sign-off; they live in one pure service, easy to tune.
- Unit conversion happens at the edge (values stored in cm) — confirmed in the UI.

**Decisions required**
1. Approve the measurement model + review-and-lock flow.
2. Provide (or approve defaults for) ease allowances & shrinkage per garment/fabric.
3. Which measurements are "critical" (need dual-entry)? Currently chest/waist/hip.

**Exact next step**
On approval → **Stage 10 — Virtual Try-On Adapter**: provider-agnostic adapter with a **mock provider first**, consent, image quality check, background job + status, secure delete, and the Style-Preview result with fit disclaimer. No paid vendor until approved.

---

Developed by Syed Rizwan Ahmed
