# Stage 11 — Order & Production

**Project:** Tailor Master — Virtual Try-On & Custom-Measurement Clothing E-Commerce PWA
**Stage:** 11 of 14
**Status:** Awaiting approval
**Depends on:** Stage 1–10 (approved)

> Interactive workshop dashboard published (queue, stage progression, QC, documents). See chat for the link.

---

## 1. Objective
The manufacturing workflow (Draft → … → Delivered), the workshop dashboard, production documents, and quality control.

## 2. Deliverables
- Order/production **state machine** (pure, tested).
- Production service: advance, workshop queue with delay flags, operator assignment, priority/due, notes, QC pass/fail with remake loop.
- Documents service: Tech Pack, Measurement Sheet, BOM, Fabric Consumption, Cutting/Stitching notes, QC checklist, Packing slip.
- Role-gated production APIs.
- Web workshop dashboard + interactive demo.

## 3. Backend

**Schema:** `ProductionTask` (one per order: `code` = QR/barcode, `stage`, `operatorId`, `priority`, `dueAt`, `notes`, `attachments`, append-only `statusHistory`, `qcPassed`, `qcNotes`, `finalMeasurements`). `Document` (`type`, `content` JSONB, optional `assetRef` for the rendered PDF). Enum `DocumentType`.

**State machine** (`order-flow.ts`) — pure & data-only, mirrors the documented flow:
```
draft → measurement_review → customer_approval → payment_complete →
measurement_locked → pattern_preparation → fabric_allocation → cutting →
stitching → quality_control → (packing | back to stitching) → dispatch → delivered
```
`canTransition` rejects skips; QC can pass forward or fail back to stitching (remake); terminal states have no exits. 5 unit tests.

**Production service:**
- `advance(order, to, actor)` — validates the transition, updates status, **creates the workshop task on entering production**, appends `statusHistory`, writes an **audit log**, all in a transaction.
- `queue()` — priority-desc / due-asc, with a computed **`delayed`** flag.
- `assignOperator`, `setPriority(+dueAt)`, `addNote`.
- `qcDecision(pass, finalMeasurements, notes)` — records finished-garment measurements; **pass → packing**, **fail → stitching (remake)**.

**Documents service:** `generate(order, type)` builds structured content from the immutable order snapshot + task (upsert per type); `list` / `get`. Content is JSON now; a worker renders PDF/CSV into `assetRef` (marked in code).

**APIs (role-gated: workshop_operator / production_manager / qc_officer / tailor / admin):**
`GET /production/queue` · `PATCH /production/orders/:id/advance` · `/assign` · `/priority` · `/note` · `POST /production/orders/:id/qc` · `POST|GET /production/orders/:id/documents[/:type]`.

## 4. Frontend
`/workshop` — production queue with delay flags, stage labels, advance buttons, and QC pass/fail (role-gated). Interactive demo shows the queue, stepper, documents, and QC loop.

## 5. How to test (local)
```bash
npm run db:migrate -w apps/api
npm run test -w apps/api      # order-flow state-machine tests
# with a workshop-role token, after an order exists & is locked:
curl -X PATCH http://localhost:3001/api/v1/production/orders/<id>/advance \
  -H "Authorization: Bearer <t>" -H 'Content-Type: application/json' -d '{"to":"pattern_preparation"}'
curl http://localhost:3001/api/v1/production/queue -H "Authorization: Bearer <t>"
curl -X POST http://localhost:3001/api/v1/production/orders/<id>/documents/tech_pack -H "Authorization: Bearer <t>"
```

## 6. Verification in this environment
- Files created & reviewed; schema/JSON validated; the state machine is mirrored 1:1 in the demo and covered by unit tests. Full install/test runs in CI.

---

## Completion Report — Stage 11

**Completed**
- Pure state machine (+5 tests), production service (advance/queue/assign/priority/notes/QC+remake), documents (8 types), role-gated APIs, workshop page, interactive demo. Pushed.

**Pending**
- Approval for Stage 12 (Admin & Reporting).
- Confirm QC checklist items and fabric-consumption estimate method (currently a simple placeholder).

**Risks**
- PDF/CSV rendering is a worker step (content is generated now) — flagged, not silently skipped.
- Fabric-consumption estimate is a placeholder until pattern data exists.

**Decisions required**
1. Approve the production workflow + QC remake loop.
2. Confirm the QC checklist items.
3. Who may advance which stage? (currently workshop/production/QC/tailor/admin roles share the endpoint.)

**Exact next step**
On approval → **Stage 12 — Admin & Reporting**: management modules (catalog, fabrics, rules, orders, production, customers, coupons, roles) and the analytics dashboard (configurator/measurement/try-on funnels, fit-return & remake rates, AI cost per order).

---

Developed by Syed Rizwan Ahmed
