# Stage 10 — Virtual Try-On Adapter

**Project:** Tailor Master — Virtual Try-On & Custom-Measurement Clothing E-Commerce PWA
**Stage:** 10 of 14
**Status:** Awaiting approval
**Depends on:** Stage 1–9 (approved)

> Interactive try-on workflow published (consent → quality → job → result → delete). See chat for the link. **No paid vendor is connected — a mock provider ships first**, exactly as required.

---

## 1. Objective

A provider-agnostic Virtual Try-On (and Body Scan) module with a **mock provider first**, the full consent → quality → background-job → result → secure-delete workflow, and a Style-Preview result that is never presented as a fit guarantee.

## 2. Deliverables

- Provider-agnostic adapter interfaces + mock implementations.
- Try-on workflow service (consent, quality gate, background job, retries, failure states, secure delete, cost tracking).
- Body-scan (mock) for size recommendation.
- APIs + role-gated vendor analytics.
- Web try-on page + interactive demo.

## 3. Backend

**Adapter interfaces** (`provider.interface.ts`) — the only thing domain code depends on:
`TryOnProvider { createTryOnJob, getTryOnStatus, getTryOnResult, deleteTryOnAssets }` and
`BodyScanProvider { startBodyScan, getBodyMeasurements }`. **No vendor SDK is imported anywhere in the core.** Providers are bound by config (`TRYON_PROVIDER` / `BODYSCAN_PROVIDER`) via a factory in the module — today only `mock` resolves; a real vendor is added later with zero domain-code changes.

**Mock providers** — simulate a vendor with no external call, GPU, or real cost; return a deterministic placeholder result + a nominal `costCents` for analytics.

**Schema:** `TryOnJob` (status queued→processing→ready→failed→deleted, `inputAssetKey`/`resultAssetKey`, `consentId`, `attempts`, `error`, `costCents`, `deletedAt`) and `BodyScanJob` (result JSON + confidence). Assets are stored as **object-storage keys**, served only via signed short-lived URLs (comment in code marks the real path).

**Workflow** (`tryon.service.ts`):

1. Require explicit **consent** (`ConsentRecord`, purpose `tryon_image`) — else 403.
2. **Quality check** (pure, tested) — framing/resolution; fails fast with reasons, no job created.
3. Create job (`queued`), then **background processing** (`void processJob`) — a BullMQ worker in production, in-process for the mock.
4. Provider adapter runs; result stored → `ready`. On error: **retry up to 3**, then `failed` with the message.
5. **Secure delete** (`DELETE …/assets`) — provider cleanup + null asset refs + status `deleted` + `deletedAt`.
6. **Fit disclaimer** returned with every job.

**APIs:** `POST /tryon/consent` · `POST /tryon/jobs` · `GET /tryon/jobs` · `GET /tryon/jobs/:id` · `DELETE /tryon/jobs/:id/assets` · `POST /tryon/body-scan` · `GET /tryon/analytics` (role-gated: admin/finance — jobs-by-status + total cost).

**Test:** quality-check service — 5 unit tests (portrait/full-body pass; missing meta, too-small, landscape, no-full-body fail).

## 4. Frontend

- `/account/tryon` — consent, create preview (with a full-body toggle to trigger the quality check), job status, result (original + preview side by side), disclaimer, secure delete. Real API calls (simulated asset key until storage upload is wired).
- Interactive demo mirrors the whole workflow.

## 5. How to test (local)

```bash
npm run db:migrate -w apps/api
npm run test -w apps/api          # quality-check unit tests
npm run dev
# with a Bearer token:
curl -X POST http://localhost:3001/api/v1/tryon/consent -H "Authorization: Bearer <t>" \
  -H 'Content-Type: application/json' -d '{"purpose":"tryon_image"}'
curl -X POST http://localhost:3001/api/v1/tryon/jobs -H "Authorization: Bearer <t>" \
  -H 'Content-Type: application/json' \
  -d '{"inputAssetKey":"demo/1.jpg","imageMeta":{"width":720,"height":1280,"hasFullBody":true}}'
curl http://localhost:3001/api/v1/tryon/jobs/<id> -H "Authorization: Bearer <t>"
```

## 6. Verification in this environment

- Files created & reviewed; schema/JSON validated; workflow mirrored 1:1 in the demo. Quality gate covered by unit tests. Full install/test runs in CI.

---

## Completion Report — Stage 10

**Completed**

- Provider-agnostic adapter (+mock), consent/quality/job/retry/secure-delete workflow, body-scan mock, analytics, web page, interactive demo, quality-check tests. Pushed.

**Pending**

- Approval for Stage 11 (Order & Production).
- A decision on which real vendor (if any) to connect later — the adapter is ready when you are.

**Risks**

- Real asset upload (presigned S3) + BullMQ worker are wired in the storage/infra step; the mock keeps the workflow honest and testable meanwhile (flagged in code).
- Model-training terms of any future vendor must be reviewed — no vendor connected yet.

**Decisions required**

1. Approve the try-on workflow + mock-first approach.
2. Approve the fit-disclaimer wording.
3. Later: preferred try-on / body-scan vendor + budget (adapter is ready).

**Exact next step**
On approval → **Stage 11 — Order & Production**: the manufacturing workflow (Draft → … → Delivered) with measurement lock, workshop dashboard, operator assignment, production documents (Tech Pack / BOM / QC / packing), and quality control.

---

Developed by Syed Rizwan Ahmed
