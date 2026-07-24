# Stage 1 — Discovery

**Project:** Tailor Master — Virtual Try-On & Custom Measurement Clothing E-Commerce PWA
**Stage:** 1 of 14 (Discovery)
**Status:** Awaiting approval
**Prepared by:** Solution Architecture

> **Core principle (never violated in any stage):**
> "How a garment _looks_ on the customer" and "how it _fits_ in reality" are two separate problems.
>
> - **Style Preview** (AI Try-On) → visual only, never a fit guarantee
> - **Fit Recommendation** → ready-size suggestion with a confidence score
> - **Made-to-Measure Validation** → real body + garment + production measurements, tailor-approved

---

## 1. Platform Understanding

We are building **four interconnected systems**, not one generic store:

1. **E-Commerce Core** — catalog, cart, checkout, payments, orders, admin.
2. **Virtual Try-On** — provider-agnostic "See Your Style" image preview (mock provider first).
3. **Measurement, Sizing & Customization** — body profiles, measurement capture, rules-based configurator, dynamic pricing.
4. **Order → Manufacturing Workflow** — measurement lock, production stages, workshop dashboard, QC, documents.

The business sells **made-to-measure and customizable garments** (kurta/qameez, shalwar/trouser, abaya, shirt, suit, uniform). The differentiator is that a customer can:

- customize a garment (fabric, collar, cuff, sleeve, embroidery, etc.),
- provide measurements (manual / existing-garment / questionnaire / body scan / tailor-verified),
- preview their style with AI,
- and place an order that flows into a real tailoring workshop with locked, immutable specs.

**Target platform:** Mobile-first responsive PWA — Desktop / Tablet / Mobile, English + Urdu (RTL) with Arabic-ready architecture, light + dark themes, accessible, fast on low-end mobiles.

---

## 2. Recommended MVP Boundary

To reduce risk and reach a commercial pilot in a realistic timeframe, the MVP is scoped as follows.

### IN — MVP

- Mobile-first e-commerce (catalog, PDP, cart, checkout, orders, notifications).
- Auth + Customer accounts + **multiple body profiles**.
- **Rule-based configurator** (fabric, color, collar, cuff, sleeve length/width, length, fit preference) — schema-driven.
- **Dynamic pricing engine** with immutable price snapshot per order.
- Measurement capture: **Manual body**, **Existing garment**, **Questionnaire-based recommendation** — with validation, outlier detection, dual-entry for critical measurements, confidence score.
- Body vs Garment vs Final Production measurement separation + the Final Garment formula.
- **Tailor review queue** + measurement locking before production.
- **Virtual Try-On with a MOCK provider** (full workflow, consent, quality check, background job, secure delete) — no paid vendor connected yet.
- Order → Production workflow + **Workshop dashboard** + auto-generated documents (Measurement Sheet, Tech Pack, BOM, Cutting/Stitching notes, QC checklist, Packing slip) with PDF/CSV export + QR/barcode.
- Admin dashboard (catalog, fabrics, rules, pricing, orders, production, roles, audit logs).
- Security & privacy: consent, encryption, signed URLs, RBAC, audit logs, Delete-My-Data / Delete-Uploaded-Image, rate limiting, file validation.
- Analytics events (configurator, measurement drop-off, try-on, conversion, fit returns, remake rate).

### OUT — later phases (explicitly deferred)

- Live AR try-on (device/asset dependent).
- Full 3D avatar + cloth physics simulation.
- Mobile body-scan **paid vendor** (adapter designed now, real vendor connected later).
- Automated digital pattern / marker-making / CNC cutting / MES integration.
- Multi-country tax/legal automation.

**Rationale (Urdu):** پہلے مرحلے میں AI Style Preview کو _"اپنا انداز دیکھیں"_ کے طور پر رکھیں، حقیقی فٹ کی ضمانت کے طور پر نہیں۔ Live AR، مکمل 3D avatar، خودکار پیٹرن اور کٹنگ بعد کے مرحلوں میں — کم خطرہ، بہتر لاگت۔

---

## 3. Key Business Questions (blocking / important)

These affect data model and rules. Grouped by priority.

### A. Blocking (needed before Stage 2 finalizes)

1. **Garment categories for launch?** Suggested MVP set: Kurta/Qameez, Shalwar/Trouser, Abaya, Formal Shirt. Confirm or edit.
2. **Business model per category:** Ready-size only / Made-to-measure only / Both? (Assumption: **Both**.)
3. **Primary market & currency:** Pakistan / GCC / other? Currency (PKR / SAR / USD)? Units default (inches or cm)?
4. **Payment provider(s):** Which gateway (e.g. Stripe / local gateway / COD)? This decides the payment adapter.
5. **Do you already have a physical workshop/tailor team** that will use the Workshop Dashboard, or is that also to be defined?

### B. Important (needed before Stage 8–9)

6. Measurement dictionary — do you have an existing tailor measurement list/standard we must match?
7. Ease-allowance / fit rules per garment — do you have your master tailor's rules, or should we start with sensible defaults for review?
8. Return / Remake policy — who bears cost for (a) wrong production, (b) wrong customer measurement, (c) change of mind?
9. Production SLA / lead times per garment and for "urgent" orders.

### C. Later (Stage 10+)

10. Try-On vendor preference & budget (PICTOFiT / others) and model-training terms.
11. Body-scan vendor (3DLOOK / Bold Metrics / others).
12. Legal jurisdiction for privacy (GDPR / local) — **legal content to be reviewed by a qualified lawyer** (we will mark, not guarantee).

---

## 4. Initial Module Map

```
Tailor Master (Modular Monolith — NestJS)
│
├── identity/           Auth, users, roles, permissions, sessions
├── customer/           Accounts, addresses, privacy controls
├── body-profile/       Multiple profiles, measurements, confidence, verification
├── catalog/            Products, categories, fabrics, colors, variants, assets
├── configurator/       Schema-driven options, rules engine, versioned schemas
├── pricing/            Dynamic pricing, snapshots
├── measurement/        Capture methods, validation, formula, review queue, locking
├── tryon/              Provider-agnostic adapter (mock first), jobs, consent, assets
├── cart/               Cart with full customization + measurement snapshot
├── checkout/           Address, shipping, tax, payment, policy acceptance
├── order/              Orders, immutable order snapshot, status machine
├── production/         Workflow stages, workshop dashboard, operator assignment
├── documents/          Tech pack, BOM, measurement sheet, QC, packing slip (PDF/CSV)
├── returns/            Returns & remakes (graded by cause)
├── notifications/      Email/push/in-app, background jobs
├── admin/              Management UIs + rule editor for non-technical staff
├── analytics/          Event tracking, KPIs, AI cost per order
├── security/           Consent, audit logs, data retention, deletion requests
└── shared/             Config, i18n (en/ur/ar), storage, queue, RBAC guards
```

**Roles → module ownership (summary):**

| Role                    | Primary areas                                      |
| ----------------------- | -------------------------------------------------- |
| Guest                   | Browse catalog, style preview (consent-gated)      |
| Customer                | Own profiles, orders, try-on, privacy              |
| Customer Support        | Read orders/customers, assist, limited edits       |
| Tailor                  | Measurement review queue, approvals                |
| Measurement Reviewer    | Validate & lock measurements                       |
| Workshop Operator       | Production stages, notes, attachments              |
| Quality Control Officer | QC checklist, final garment measurement            |
| Production Manager      | Queue, priority, assignment, delay alerts          |
| Catalog Manager         | Products, fabrics, variants, config schemas        |
| Finance                 | Payments, refunds, pricing config, reports         |
| Administrator           | Most admin modules, roles (scoped)                 |
| Super Administrator     | Everything incl. security & data-deletion approval |

Full permission matrix will be delivered in Stage 5 (Technical Architecture) with the DB design.

---

## 5. Main Technical Risks

| #   | Risk                                                  | Impact              | Mitigation                                                                                                                               |
| --- | ----------------------------------------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | **AI preview looks good but fit is wrong**            | Returns, trust loss | Hard separation of Style Preview vs Fit vs MTM; disclaimers; confidence score; tailor lock before cutting                                |
| R2  | **Manual measurement errors**                         | Remakes, cost       | Guided video/images, in/cm toggle, outlier detection, dual-entry for critical values, existing-garment option, tailor verification       |
| R3  | **AI alters logo/embroidery/print**                   | Brand damage        | Standard product images always shown; reference assets; automated quality check; fallback to 2D preview on low confidence                |
| R4  | **Vendor lock-in (try-on / scan)**                    | Cost, flexibility   | Provider-agnostic adapter (`createTryOnJob`, `getTryOnStatus`, …); mock provider first; no hard-coded vendor                             |
| R5  | **Sensitive body images/measurements leak**           | Legal, privacy      | Treat as sensitive; consent, encryption at rest/in transit, signed short-lived URLs, RBAC, audit, retention, secure delete, malware scan |
| R6  | **Performance on low-end mobile**                     | Drop-off            | Mobile-first, lazy loading, image optimization, CDN, background AI jobs, caching, pagination, DB indexes                                 |
| R7  | **Pricing changes affecting old orders**              | Disputes            | Immutable pricing snapshot per order                                                                                                     |
| R8  | **Config/pricing rules too complex for staff**        | Ops bottleneck      | Admin Rule Editor for non-technical staff; versioned schemas                                                                             |
| R9  | **Manufacturing delays**                              | SLA breach          | Capacity calendar, fabric check before cutting, per-option lead time, workshop alerts, clear SLA                                         |
| R10 | **Legal/regulatory (kids' body data, jurisdictions)** | Compliance          | Mark all legal content for qualified-lawyer review; do not invent legal guarantees                                                       |

---

## 6. Suggested Implementation Sequence

Follows the mandated 14-stage sequence. High-level:

1. **Discovery** ← current
2. Information Architecture (sitemap, journeys, data flow)
3. UX Wireframes (mobile + desktop) — _first clickable mockups you approve before code_
4. Visual Design System (colors, type, components, RTL, themes)
5. Technical Architecture (DB, API, jobs, storage, security, adapters)
6. Project Setup (repo, env, DB foundation, auth, CI/CD, README)
7. E-Commerce Core
8. Customization Engine (configurator + rules + pricing)
9. Measurement & Sizing (body profiles, validation, review queues)
10. Virtual Try-On Adapter (**mock first**, no paid vendor until approved)
11. Order & Production (workflow, workshop, documents, QC)
12. Admin & Reporting
13. Security, QA & Performance
14. Deployment

Each stage stops for your approval before the next begins.

---

## 7. Stage 1 Deliverables (this document)

- [x] Platform / business understanding
- [x] Assumptions (see §8)
- [x] Key business questions (§3)
- [x] User roles (§4 + full matrix in Stage 5)
- [x] Product categories (proposed — needs confirmation)
- [x] Measurement strategy (§9)
- [x] Customization matrix (§10)
- [x] Production workflow (§11)
- [x] Vendor options (§12)
- [x] Risks (§5)
- [x] MVP boundary (§2)

---

## 8. Assumptions

If any of these are wrong, tell me in your approval reply.

1. **Both** ready-size and made-to-measure are offered.
2. Launch categories: Kurta/Qameez, Shalwar/Trouser, Abaya, Formal Shirt.
3. Primary market: Pakistan/GCC; default unit toggle in/cm; currency configurable (assume PKR at first).
4. Languages at launch: **English + Urdu (RTL)**; Arabic architecture-ready but not fully translated in MVP.
5. Payments: one gateway + optional COD (exact provider TBD — Q4).
6. A workshop/tailor team exists (or will) to operate the Workshop Dashboard.
7. Try-On and Body-Scan start as **mock/placeholder**; no paid vendor or API keys in MVP.
8. Legal/consent copy is placeholder, clearly marked "**Review by qualified lawyer required**."
9. Tech stack = the mandated default (Next.js/React/TS/Tailwind + NestJS + PostgreSQL/Prisma + Redis + S3-compatible + Docker), Modular Monolith to start.
10. Hosting on one cloud (AWS/Azure/GCP) — final choice in Stage 5/14.

---

## 9. Measurement Strategy

**Five capture methods** (MVP does 1–3 + 5; 4 is adapter-ready):

1. Manual body measurement (tape)
2. Existing garment measurement (measure a well-fitting garment) — often easiest for customers
3. Questionnaire-based size recommendation (height, weight, build, fit preference, past brands/returns)
4. Mobile body scan (vendor API — adapter now, connect later)
5. Tailor verification (for expensive/complex garments)
6. In-store measurement (staff-entered)

**Three separate measurement records — never merged:**

- **Body measurements** (the person)
- **Garment measurements** (the finished garment target)
- **Final production measurements** (what the workshop cuts to)

**Final Garment Formula:**

```
Body Measurement
+ Ease Allowance
+ Fit Preference (Slim / Regular / Relaxed)
+ Fabric Stretch Rule (stretch / non-stretch)
+ Shrinkage Allowance
+ Production Tolerance
= Final Garment Measurement
```

**Safeguards:** visual guides + short instruction videos, in/cm + conversion, validation, outlier detection, dual-entry confirmation for critical measurements, confidence score, tailor review queue, and **measurement locking before production**.

---

## 10. Customization Matrix (schema-driven configurator)

Options (per garment, conditional): garment length, shoulder, chest, waist, hip, sleeve length, sleeve width, collar, cuff, neck style, pocket, hem, placket, lining, fabric, color, embroidery, logo, monogram, fit preference, and lower (trouser/shalwar/pajama/skirt) measurements.

The engine supports: conditional options, dependency rules, incompatible combinations, min/max values, production restrictions, additional pricing, additional lead time, tailor-approval triggers, and **versioned schemas**. A non-technical **Admin Rule Editor** manages these.

**Example rules:** a collar available only with certain designs; a cuff forbidden on thick fabric; changing collar adds price; full embroidery adds lead time; unusual measurement requires tailor approval; slim fit unavailable on some fabrics; selecting option A auto-disables option B.

---

## 11. Production Workflow

```
Draft → Measurement Review → Customer Approval → Payment Complete
→ Measurement Locked → Pattern Preparation → Fabric Allocation
→ Cutting → Stitching → Quality Control → Packing → Dispatch → Delivered
```

Every order stores an **immutable snapshot**: product, variant, fabric, color, customization, body measurements, garment measurements, final production measurements, fit preference, pattern version, pricing, approvals, try-on reference, production notes. Changing a body profile later must **not** change past orders.

**Workshop dashboard:** production queue, priority, due dates, measurement review, pattern prep, fabric allocation, cutting, stitching, QC, packing, dispatch, delay alerts, operator assignment, notes, attachments, QR/barcode, status history, audit log.

**Auto-documents:** Measurement Sheet, Tech Pack, BOM, Fabric Consumption, Cutting notes, Stitching notes, QC checklist, Packing slip — exportable to PDF/Print/CSV/Excel, with API/webhook/ERP-ready hooks.

---

## 12. Vendor Options (shortlist — none connected in MVP)

| Capability          | Candidates                                | MVP stance                         |
| ------------------- | ----------------------------------------- | ---------------------------------- |
| AI image try-on     | PICTOFiT (Reactive Reality), others       | **Mock adapter**                   |
| Live AR             | Snap Lens Studio                          | Deferred                           |
| 3D / cloth sim      | CLO (CLO-SET Fitting API beta), Browzwear | Deferred                           |
| Body scan           | 3DLOOK, Bold Metrics                      | Adapter-ready, connect later       |
| Size recommendation | True Fit, Fit Analytics, Bold Metrics     | Questionnaire in MVP; vendor later |
| Payments            | TBD (Q4)                                  | Adapter                            |

Google Shopping / Walmart-Zeekit are **directional references**, not assumed public SDKs.

---

## Completion Report — Stage 1

**Completed items**

- Platform understanding, MVP boundary, business questions, module map, roles, risks, implementation sequence, measurement strategy, customization matrix, production workflow, vendor shortlist, assumptions.
- This document saved to `docs/stage-1-discovery.md`.

**Pending items**

- Your answers to §3 questions (esp. blocking A1–A5).
- Confirmation/edit of assumptions (§8).
- Approval to proceed to Stage 2 (Information Architecture).

**Risks (top 3 to watch now)**

- R1 AI-preview-vs-fit confusion, R5 sensitive data handling, R4 vendor lock-in — all mitigated by design decisions above.

**Decisions required (from you)**

1. Confirm launch categories & business model (A1, A2).
2. Market, currency, default units (A3).
3. Payment provider direction (A4).
4. Workshop team status (A5).
5. Approve assumptions §8 (or correct them).

**Exact next step**
On your approval, begin **Stage 2 — Information Architecture**: sitemap, customer + role user journeys, navigation, module map, and data-flow diagrams (with a first low-fidelity structure preview). No application code until Stage 6.

---

Developed by Syed Rizwan Ahmed
