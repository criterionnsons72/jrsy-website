# Stage 2 — Information Architecture

**Project:** Tailor Master — Virtual Try-On & Custom-Measurement Clothing E-Commerce PWA
**Stage:** 2 of 14 (Information Architecture)
**Status:** Awaiting approval
**Depends on:** Stage 1 (approved, default assumptions)

> Visual companion (interactive): the IA is also delivered as a clickable visual mockup (sitemap, journeys, navigation, data flow). See chat for the live link.

---

## 1. Objective

Define **how the platform is organised** before any pixels or code: the sitemap, the real journeys people take, the navigation model, and how an order's data flows through modules — all built on the Stage 1 principle that **Style Preview**, **Fit Recommendation**, and **Made-to-Measure Validation** are separate promises.

## 2. Deliverables

- Sitemap (3 access zones)
- Customer user journeys
- Staff role journeys
- Navigation model (customer mobile + staff console, RTL-ready)
- Module map (from Stage 1) + data flow of the immutable order snapshot

## 3. Assumptions carried from Stage 1

Categories: Kurta/Qameez, Shalwar/Trouser, Abaya, Formal Shirt · Both ready-size + MTM · PK/GCC, PKR, in+cm · Payment via adapter · Workshop team exists · Try-On = mock first · Legal copy = placeholder (lawyer review flagged).

---

## 4. Sitemap

### Zone A — Guest (public)

```
Home
 ├─ Featured · Categories · How it works
Catalog  (search · filter · sort)
 └─ Category → Product listing
Product Detail Page (PDP)
 ├─ Gallery · Options preview · Size guide
 └─ Style Preview entry            [consent-gated]
How Measurement Works
 └─ Visual guides · short videos · in/cm
Policies
 └─ Returns/Remakes · Privacy       [lawyer review required]
Auth — Login / Register / Reset
```

### Zone B — Customer (authenticated)

```
Dashboard  (orders · profiles · reorder)
Body Profiles                        [multiple per account]
 └─ List · Create · Edit · Confidence score · Verified?
Product Configurator (wizard)
 └─ Design → Fabric/Color → Parts → Fit preference
Measurement Wizard
 └─ Manual body · Existing garment · Questionnaire
Virtual Try-On
 └─ Jobs · Consent · Result · Delete assets
Cart → Checkout
 └─ Address · Shipping · Tax · Payment · Policy acceptance
Orders
 └─ Detail · Production tracking · Immutable snapshot
Returns & Remakes
Notifications
Privacy Controls                     [Delete my data · Delete image]
Account settings · Addresses
```

### Zone C — Staff / Admin (role-gated console)

```
Admin Dashboard (KPIs)
Catalog        → Products · Fabrics · Colors · Variants · Assets
Configurator Schemas → Rule Editor [no-code] · Versions
Pricing        → Rules · Snapshots
Orders & Payments
Production / Workshop → Queue · Stages · Operators · Delay alerts
Measurement Review Queue             [Tailor / Reviewer]
Quality Control
Documents      → Measurement Sheet · Tech Pack · BOM · QC · Packing
Customers & Body Profiles
Try-On / Body-Scan jobs
Coupons · Notifications · Reports
Roles & Permissions · Audit Logs
Privacy / Data-Deletion Requests
```

---

## 5. Customer journeys

### 5.1 Core — Made-to-Measure order (the spine)

```
01 Browse & open PDP
02 Configure garment (fabric · collar · cuff · sleeve · length)
03 Choose measurement method        [FIT lane]
04 Fit preference (slim/regular/relaxed)  [FIT lane]
05 Style Preview (optional)          [PREVIEW lane · consent · disclaimer]
06 Review price + measurement summary (live price)
07 Cart → Checkout (address · pay · policy)
08 Tailor review — validate & approve   [MTM lane]
09 Measurement LOCK — immutable snapshot [MTM lane]
10 Production (pattern → cut → stitch → QC)
11 Dispatch → Delivered → (reorder later)
```

**Rule:** the AI Preview (step 05) is optional and visual. It **never** unlocks production; only tailor validation + lock (08–09) does.

### 5.2 Ready-size purchase (fastest, no workshop lock)

`PDP → Size questionnaire (FIT) → Recommendation + confidence → Cart → Order`

### 5.3 Virtual Try-On (mock provider first)

`Upload/capture → Consent → Quality check → Background job → Notify → Style Preview → Add to cart / Delete assets`

### 5.4 Reorder a successful fit (loyalty loop)

`Orders → Pick past fit → Confirm profile → Checkout`

### 5.5 Return / Remake (graded by cause)

`Order → Request → Cause (production error / customer measurement / preference) → Approve → Remake or Refund`

---

## 6. Staff role journeys (primary loop each)

| Role                          | Loop                                                                 |
| ----------------------------- | -------------------------------------------------------------------- |
| Tailor / Measurement Reviewer | Review queue → Open order → Check outliers → Approve/Reject → Lock   |
| Workshop Operator             | My tasks → Scan QR → Update stage → Notes/photos → Next              |
| Quality Control Officer       | QC queue → Checklist → Re-measure finished garment → Pass/Fail       |
| Production Manager            | Queue overview → Set priority → Assign operator → Watch delay alerts |
| Catalog Manager               | Products/Fabrics/Schemas/Rules management                            |
| Finance                       | Payments · Refunds · Pricing config · Reports                        |
| Customer Support              | Read orders/customers · assist · limited edits                       |
| Administrator / Super Admin   | Broad management; Super Admin also security & data-deletion approval |

---

## 7. Navigation model

**Customer (mobile-first):** bottom nav — `Home · Catalog · Search · Cart · Account`. Configurator uses a step wizard with a progress bar and Save-and-Continue-Later. Desktop promotes the same items to a top bar.

**Staff console:** grouped left sidebar —

- **Sell:** Orders · Catalog/Fabrics · Pricing & Rules
- **Make:** Measurement Review · Workshop Queue · QC/Documents
- **Manage:** Customers/Try-On jobs · Reports/Analytics · Roles/Audit/Privacy

**RTL-ready:** for Urdu/Arabic the bottom bar mirrors and the sidebar flips to the right edge; all icons and progress indicators mirror. Language + unit (in/cm) + theme are global switches in the header.

---

## 8. Module & data flow — the immutable order snapshot

```
Configurator → Measurement → Pricing → ORDER(freeze snapshot) → Production(reads snapshot only)
   options+       body→garment    base+fabric+     immutable          never mutated by
   rules+ver      via formula     custom+tax                          later profile edits
```

**Final Garment formula (from Stage 1):**
`Body + Ease + Fit preference + Fabric stretch + Shrinkage + Production tolerance = Final Garment`

**Snapshot contents (frozen at order):** product · variant · fabric · color · customization · body measurements · garment measurements · final production measurements · fit preference · pattern version · pricing breakdown · approvals · try-on reference · production notes.

Changing a body profile later **never** alters a past order.

---

## Completion Report — Stage 2

**Completed**

- Sitemap (Guest / Customer / Staff), customer journeys (5), role journeys (8 roles), navigation model (mobile + console, RTL-ready), module & data-flow with snapshot definition.
- Interactive visual IA mockup published; this document saved to `docs/stage-2-information-architecture.md`.

**Pending**

- Your approval to proceed to Stage 3 (UX Wireframes).
- Any structural corrections (e.g. add/remove a top-level section, rename zones).

**Risks**

- Scope creep in the staff console — mitigated by MVP gating (only MVP modules built first).
- Journey 5.3 (Try-On) depends on consent + secure-delete correctness — carried as a design constraint into wireframes.

**Decisions required**

1. Approve the sitemap's 3-zone split and top-level pages.
2. Confirm the bottom-nav 5 items (Home/Catalog/Search/Cart/Account) for the customer app.
3. Confirm the staff console grouping (Sell / Make / Manage).

**Exact next step**
On approval → **Stage 3 — UX Wireframes**: mobile + desktop wireframes for Product page, Configurator, Measurement wizard, Virtual Try-On, Cart, Checkout, Customer dashboard, Admin dashboard, Workshop dashboard — delivered as a clickable mockup.

---

Developed by Syed Rizwan Ahmed
