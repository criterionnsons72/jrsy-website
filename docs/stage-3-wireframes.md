# Stage 3 — UX Wireframes

**Project:** Tailor Master — Virtual Try-On & Custom-Measurement Clothing E-Commerce PWA
**Stage:** 3 of 14 (UX Wireframes)
**Status:** Awaiting approval
**Depends on:** Stage 1 & 2 (approved)

> Delivered as an interactive, clickable wireframe kit (all 9 screens, mobile/desktop + light/dark toggles). See chat for the live link. These are **low-fidelity** — structure & flow only. Final colours, type and polish come in Stage 4.

---

## 1. Objective

Lay out the actual screens so the flow can be felt and corrected cheaply, before visual design or code. Every screen enforces the Stage 1 separation of **Style Preview / Fit / Made-to-Measure**.

## 2. Deliverables (9 screens, mobile + desktop)

Product Page · Configurator · Measurement Wizard · Virtual Try-On · Cart · Checkout · Customer Dashboard · Admin Dashboard · Workshop Dashboard.

## 3. Screen notes

### 3.1 Product Page (PDP)

- Real product gallery **always visible**; thumbnail strip on desktop.
- Explicit choice: **Ready size** vs **Made-to-measure**.
- Primary CTA **Customize**; secondary **Try your style (AI preview)** — consent-gated, labelled "look only, not a fit guarantee".
- Size-guide / "how measurement works" entry.

### 3.2 Configurator (step wizard)

- 4 steps: Design → Fabric/Color → Parts → Fit. Progress bar + Save-and-continue-later.
- **Rules fire live:** incompatible options disabled (e.g. "Wide collar not allowed on thick fabric"), some add price / lead time, unusual choices flag **tailor approval**.
- **Live price** sidebar (desktop) / sticky bar (mobile) with line-by-line breakdown + lead-time pill.

### 3.3 Measurement Wizard

- Method picker: Manual body · Existing garment · Questionnaire · Body scan (**soon**, adapter-ready).
- Per-measurement guide video + diagram; **in/cm toggle**.
- **Outlier detection**, **dual-entry** for critical measurements, **confidence score**.
- "Send to tailor review" → lock only after approval.

### 3.4 Virtual Try-On

- Provider-agnostic, **mock first**. Explicit **consent** checkbox, image-quality check.
- Background **job status** (Queued → Processing → Ready, retry on failure).
- Result labelled **Style Preview** + fit disclaimer; **Delete original / Delete result** controls.

### 3.5 Cart

- Line preserves: customization, **body profile used**, measurement snapshot, fit preference, **try-on reference**, full price breakdown, **lead time**.

### 3.6 Checkout

- Address · Shipping · Payment · Tax · Order review, plus two custom-order gates: **measurement approval** and **custom-order policy acceptance** (legal copy placeholder — lawyer review flagged) → Place order.

### 3.7 Customer Dashboard

- Active orders with **production tracking** bar; delivered orders with **Reorder this fit**.
- Body profiles with confidence + verified state; **Privacy** (delete images / delete my data).

### 3.8 Admin Dashboard

- KPI tiles first (open orders, awaiting review, delayed, fit-return rate), then orders table.
- Grouped sidebar: **Sell / Make / Manage**.

### 3.9 Workshop Dashboard

- Prioritised **production queue**: stage, operator, due date, QR, **delay alerts**.
- Row → order snapshot, documents (Tech Pack/BOM/QC), status history, audit log, attachments.

## 4. Cross-cutting UX (all screens)

Mobile-first with bottom nav · **RTL-ready** (mirrors for Urdu/Arabic) · light + dark · in/cm + language + theme as global switches · accessibility (focus states, semantic structure) · Save-and-continue-later on long flows.

---

## Completion Report — Stage 3

**Completed**

- Wireframes for all 9 required screens, mobile + desktop, with light/dark. Interactive kit published; this document saved to `docs/stage-3-wireframes.md`.
- Stage 1 principle enforced visually (Preview / Fit / MTM colour lanes; preview never unlocks production).

**Pending**

- Your approval to proceed to Stage 4 (Visual Design System).
- Any layout corrections (add/remove/reorder blocks on any screen).

**Risks**

- Configurator complexity on small screens — mitigated by sticky price bar + step wizard.
- Try-On consent/delete must be unmissable — carried into visual design.

**Decisions required**

1. Approve the 9 screen layouts (or list changes).
2. Confirm the PDP's explicit Ready-size vs MTM split at the top.
3. Confirm the configurator's live-price placement (sidebar desktop / sticky bar mobile).

**Exact next step**
On approval → **Stage 4 — Visual Design System**: colours, typography, spacing, components, forms, tables, cards, modals, RTL behaviour, light & dark themes — applied to these wireframes.

---

Developed by Syed Rizwan Ahmed
