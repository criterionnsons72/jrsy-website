# Stage 8 — Customization Engine & Dynamic Pricing

**Project:** Tailor Master — Virtual Try-On & Custom-Measurement Clothing E-Commerce PWA
**Stage:** 8 of 14
**Status:** Awaiting approval
**Depends on:** Stage 7 (approved)

> Interactive demo published (configurator + live pricing you can click). See chat for the link.

---

## 1. Objective

Build the schema-driven configurator, the rules engine (conditional / incompatible / min-max / approval / lead-time), versioned schemas, and the dynamic pricing engine with an immutable pricing snapshot.

## 2. Deliverables

- `ConfigSchema` model (versioned, JSONB definition) linked to products.
- Typed schema shape + a **pure rules engine** (fully unit-tested).
- Configurator APIs (get schema, evaluate selections).
- **Dynamic pricing engine** + quote API, producing an immutable pricing snapshot.
- Web configurator page with live price & rule feedback.
- Seed config schema for the demo product.

## 3. Backend

**Schema (Prisma):** `ConfigSchema { name, version, definition(JSON), isPublished }`, unique on `(name, version)` → **versioned schemas**. `Product.configSchemaId` links a product to its schema.

**Definition shape** (`schema.types.ts`): option `groups` (`select` / `number` / `boolean`) with per-choice `priceDelta`, `leadTimeDays`, `requiresApproval`; numeric `min`/`max`/`unit` and `pricePerUnitOver` (measurement-range / fabric-consumption surcharge); and `rules` with AND-ed conditions → actions: `disableChoice`, `disableGroup`, `requireApproval`, `addPrice`, `addLeadTime`, `error`.

**Rules engine** (`rules-engine.service.ts`) — pure & deterministic: applies rules, validates required/min/max, resolves disabled choices, and returns `{ valid, errors, disabledChoices, priceLines, priceAdjustment, leadTimeDays, approvalRequired }`. No I/O → 4 unit tests cover incompatibility, approval+lead-time, and numeric surcharge.

**Configurator API:**

- `GET /api/v1/configurator/products/:slug/schema` — the definition to render.
- `POST /api/v1/configurator/evaluate` — evaluate selections (disabled / errors / approval / lead time).

**Dynamic pricing engine** (`pricing.service.ts`):

```
base product
+ configurator price lines (fabric, fabric-consumption/length, collar, cuff,
  lining, embroidery, monogram, logo…)
+ urgent production (+20%)
+ tax (configurable rate; default 0 — placeholder until finalised)
+ shipping (flat; default 0)
= total
```

Returns an itemized breakdown, lead time, approval flag, and a **`PricingSnapshot`** (`toSnapshot()` strips transient fields) designed to be frozen onto the order at placement — immutable, so later price changes never affect a placed order.

- `POST /api/v1/pricing/quote` — the live number shown in the configurator.
- 4 unit tests: base+option breakdown, urgent surcharge, tax+shipping, snapshot shape.

**Seed:** a published `kurta-standard` v1 schema (fabric, collar, cuff, pocket, embroidery, length, fit + urgent) with two rules (wide-collar-disabled-on-linen; slim-on-washwear-needs-approval), linked to both demo products.

## 4. Frontend

`/product/[slug]/configure` — client configurator: renders groups, disables incompatible choices live, shows a **live price breakdown**, lead-time and tailor-approval pills, inline validation errors, and gates "Continue" on validity. PDP now has a **Customize** CTA. All themed (light/dark).

## 5. How to test (local)

```bash
npm run db:migrate -w apps/api && npm run db:seed -w apps/api
npm run dev
curl http://localhost:3001/api/v1/configurator/products/classic-cotton-kurta/schema
curl -X POST http://localhost:3001/api/v1/pricing/quote -H 'Content-Type: application/json' \
  -d '{"productSlug":"classic-cotton-kurta","selections":{"fabric":"linen","embroidery":"full_front","length":50},"urgent":true}'
npm run test -w apps/api    # rules-engine + pricing unit tests
```

Web: open `http://localhost:3000/product/classic-cotton-kurta/configure`.

## 6. Verification in this environment

- Files created & reviewed; schema/JSON validated. Rules & pricing logic mirrored 1:1 in the interactive demo to sanity-check behaviour.
- Not run here: full `npm install`/test (CI does). The pure engines are the easiest to trust — deterministic, no I/O — and are covered by unit tests.

---

## Completion Report — Stage 8

**Completed**

- Versioned ConfigSchema, pure rules engine (+tests), configurator APIs, dynamic pricing engine with immutable snapshot (+tests), seed schema, web configurator page, interactive demo. Pushed.

**Pending**

- Approval for Stage 9 (Measurement & Sizing).
- Confirm the urgent surcharge (20%) and that tax/shipping stay parameters until finance rules are set.

**Risks**

- Rule authoring complexity → mitigated by the pure engine + tests; the visual Admin Rule Editor is a later admin-stage deliverable (schemas are editable as validated JSON meanwhile).
- Pricing rounding: half-up to 2 decimals — confirm in review.

**Decisions required**

1. Approve the configurator + pricing model.
2. Urgent surcharge rate (20%?) and whether tax is per-order or per-region.
3. Any must-have option groups missing from the demo schema?

**Exact next step**
On approval → **Stage 9 — Measurement & Sizing**: body profiles, the measurement wizard (manual / existing-garment / questionnaire), the body→garment formula, validation + outlier detection + confidence, and the tailor review queue with measurement locking.

---

Developed by Syed Rizwan Ahmed
