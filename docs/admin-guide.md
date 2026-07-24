# Tailor Master — Admin Guide

For staff running the platform. Access is role-based; you only see what your role allows.

## Roles (who does what)

| Role                          | Can do                                                         |
| ----------------------------- | -------------------------------------------------------------- |
| Catalog Manager               | Products, categories, fabrics, config schemas & rules, pricing |
| Tailor / Measurement Reviewer | Review measurement queue, approve → lock before production     |
| Workshop Operator             | Advance production stages, notes, attachments, scan QR         |
| Quality Control Officer       | QC checklist, measure finished garment, pass/fail              |
| Production Manager            | Queue priorities, operator assignment, delay alerts            |
| Finance                       | Payments, coupons, pricing, reports                            |
| Customer Support              | Read customers/orders, assist                                  |
| Administrator                 | Most management + roles                                        |
| Super Administrator           | Everything incl. data-deletion approval                        |

## Common tasks

### Add a product

`Admin → Catalog → Products` (or `POST /api/v1/admin/products`). Set title, slug, category, base price, and attach a **config schema** for made-to-measure options.

### Edit customization options / rules

Config schemas are **versioned**. Publish a new version rather than editing a live one, so existing orders keep their schema. (Visual Rule Editor is a follow-up; schemas are editable as validated JSON meanwhile.)

### Measurement review (Tailor)

`Workshop → Measurement reviews`. Open a pending item, check outliers/confidence, then **Approve** (locks the measurement, marks the profile verified) or **Reject** with a note.

### Run production (Workshop)

`Workshop → Queue`. Rows are ordered by priority then due date; delayed rows are flagged. Advance a stage with the action button. At **Quality Control**, Pass → Packing, Fail → back to Stitching (remake). Generate documents (Tech Pack, BOM, QC checklist, Packing slip) from the order.

### Reports

`Admin → Dashboard`. KPIs (revenue, in-production, pending reviews, AI cost/order), conversion funnel, orders by stage, fit-return & remake rates.

### Privacy requests

Data-deletion requests require **Super Administrator** approval. Deleting an image nulls its storage refs and marks the job deleted.

## Notes

- The **order snapshot is immutable** — a placed order never changes if a profile or price is edited later.
- **AI try-on is a Style Preview**, never a fit guarantee. Fit is validated by measurements + tailor review.
- Legal/consent copy is placeholder — **have a qualified lawyer review it** before launch.
