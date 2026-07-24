# Stage 12 — Admin & Reporting

**Project:** Tailor Master — Virtual Try-On & Custom-Measurement Clothing E-Commerce PWA
**Stage:** 12 of 14
**Status:** Awaiting approval
**Depends on:** Stage 1–11 (approved)

> Interactive admin & analytics dashboard published (KPIs, conversion funnel, orders by stage, fit-return & remake rates). See chat for the link.

---

## 1. Objective

Management modules and the analytics/reporting layer.

## 2. Deliverables

- Analytics event tracking + KPI report (funnels + domain metrics).
- Admin overview, all-orders view, audit-log viewer.
- Catalog management (create category / fabric / product).
- Coupon management (list / create / deactivate).
- Role-gated APIs + admin dashboard page.

## 3. Backend

**Schema:** `AnalyticsEvent` (type, userId?, sessionId?, props JSON, at) and `Coupon` (code, kind, value, isActive, expiresAt).

**Analytics** (`analytics.service.ts`):

- `track(event)` — ingest funnel/usage events (product_view, configurator_start/complete, measurement_start/complete, tryon_request/success/failure, add_to_cart, order_placed…).
- `report()` — combines **event funnels** with **domain truth**: configurator completion rate, measurement drop-off, try-on→cart, cart→order; orders by status; try-on total cost + **AI cost per delivered order**; **remake rate** (QC fails / tasks). All rates guard divide-by-zero.
- APIs: `POST /analytics/events` (public ingest) · `GET /analytics/report` (role-gated).

**Admin** (`admin.service.ts`):

- `overview()` — customers, active products, orders-by-status, revenue, pending measurement reviews, active try-on jobs, orders in production.
- `orders()` — all orders (filterable, capped), `auditLogs()`.
- Catalog: `createCategory`, `createFabric`, `createProduct`.
- Coupons: `listCoupons`, `createCoupon`, `deactivateCoupon`.
- APIs under `/admin/*`, each **role-gated** (admin/super_admin, plus finance for coupons, catalog_manager for catalog, support for read).

## 4. Frontend

`/admin` — KPI tiles (revenue, in-production, pending reviews, AI cost/order), a **conversion funnel** chart, and a recent-orders table (role-gated, tabular-nums, themed). Interactive demo shows the full dashboard incl. orders-by-stage and fit-return/remake rates.

## 5. How to test (local)

```bash
npm run db:migrate -w apps/api
# ingest a couple of events:
curl -X POST http://localhost:3001/api/v1/analytics/events -H 'Content-Type: application/json' -d '{"type":"product_view"}'
curl -X POST http://localhost:3001/api/v1/analytics/events -H 'Content-Type: application/json' -d '{"type":"configurator_start"}'
# with an admin-role token:
curl http://localhost:3001/api/v1/admin/overview -H "Authorization: Bearer <t>"
curl http://localhost:3001/api/v1/analytics/report -H "Authorization: Bearer <t>"
```

## 6. Verification in this environment

- Files created & reviewed; schema/JSON validated. Report logic mirrored in the demo. Full install/test runs in CI.

---

## Completion Report — Stage 12

**Completed**

- Analytics events + KPI report, admin overview/orders/audit, catalog + coupon management, role-gated APIs, admin dashboard page, interactive demo. Pushed.

**Pending**

- Approval for Stage 13 (Security, QA & Performance).
- Confirm which KPIs matter most for your launch dashboard.

**Risks**

- Event-based funnels need the client to emit events (wired incrementally per screen); domain metrics (orders, cost, remake) are exact from the DB.

**Decisions required**

1. Approve the admin + analytics scope.
2. Priority KPIs for the launch dashboard.
3. Coupon rules (stacking, min-order) — needed later at checkout.

**Exact next step**
On approval → **Stage 13 — Security, QA & Performance**: functional/integration/role tests, security & accessibility review, responsive & RTL testing, performance, error handling, and backup validation — consolidated into a QA report + hardening.

---

Developed by Syed Rizwan Ahmed
