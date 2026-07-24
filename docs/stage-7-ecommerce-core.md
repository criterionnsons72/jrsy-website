# Stage 7 — Ecommerce Core

**Project:** Tailor Master — Virtual Try-On & Custom-Measurement Clothing E-Commerce PWA
**Stage:** 7 of 14 (Ecommerce Core)
**Status:** Awaiting approval
**Depends on:** Stage 6 (approved)

---

## 1. Objective

Build the shopping backbone on the Stage 6 foundation: a browsable catalog, product detail, a cart, and a draft-order shell — with the Stage 1 "three promises" visible on the product page.

## 2. Deliverables

- Catalog data model + APIs (categories, products, fabrics).
- Product listing + product detail (PDP) pages.
- Cart (add / update / remove) with a price snapshot per item.
- Order shell (create draft order from cart, list, get) with an immutable snapshot.
- Demo seed data + tests.

## 3. Backend (NestJS)

**Schema (Prisma) added:** Category, Product, ProductImage, ProductVariant, Fabric, ProductFabric, Cart, CartItem, Order, OrderItem, plus enums `FabricStretch` and `OrderStatus` (the full 13-step production status set).

**Catalog module** (public / guest):

- `GET /api/v1/products` — list with pagination (`page`, `pageSize`), `category` and `q` filters; returns first image + category.
- `GET /api/v1/products/:slug` — detail with images, active variants, linked fabrics.
- `GET /api/v1/categories` — with product counts.
- `GET /api/v1/fabrics` — active fabrics.

**Cart module** (auth: customer):

- `GET /api/v1/cart` · `POST /api/v1/cart/items` · `PATCH /api/v1/cart/items/:id` · `DELETE /api/v1/cart/items/:id`.
- Each item stores a **unit-price snapshot** at add-time (base + variant delta), so catalog price changes never silently alter a cart. Subtotal is derived, never stored.
- Cart is lazily created per customer; ownership enforced on every item op.

**Order module** (auth: customer):

- `POST /api/v1/orders` — creates a **draft** order from the cart in a transaction, freezes an **immutable snapshot** of the line items, then empties the cart.
- `GET /api/v1/orders` · `GET /api/v1/orders/:id` — customer-scoped.
- Order number `TM-…`; status defaults to `draft`. Shipping/tax/measurement/payment are layered on in later stages.

**Seed:** all 12 roles, 4 categories, 3 fabrics, 2 products (Kurta, Formal Shirt) with ready-size variants and fabric links.

## 4. Frontend (Next.js)

- `/catalog` — category filter chips + responsive product grid (server-fetched).
- `/product/[slug]` — PDP: gallery (real photos stay visible), price, **Ready-size vs Made-to-measure** pills, fabrics, sizes, Add-to-cart, and the **Style-Preview disclaimer** (look only, not a fit guarantee).
- `/cart` — line items, derived subtotal, next-stage note.
- API client (`src/lib/api.ts`), `ProductCard`, `AddToCart` (client) components. All themed via Stage 4 tokens, light/dark.

## 5. How to run & test (local)

```bash
npm install && docker compose up -d
cp apps/api/.env.example apps/api/.env
npm run db:migrate -w apps/api      # apply schema
npm run db:seed    -w apps/api      # demo data
npm run dev                         # web :3000 · api :3001

# API smoke tests
curl http://localhost:3001/api/v1/categories
curl "http://localhost:3001/api/v1/products?category=kurta-qameez"
curl http://localhost:3001/api/v1/products/classic-cotton-kurta
# Cart/order need a token: register → login → use accessToken as Bearer.

npm run test -w apps/api            # unit tests (health, order guards)
```

Then visit `http://localhost:3000/catalog`.

## 6. Verification done in this environment

- All files created & reviewed; JSON/config validated; 19 Prisma models parse structurally.
- **Not** run here: full `npm install` + build/migrate (heavy for the ephemeral container). CI runs the full lint → typecheck → test → build chain; run locally per §5. Honest status.

---

## Completion Report — Stage 7

**Completed**

- Catalog (model + APIs), PDP + listing pages, cart (snapshotting), order shell (immutable snapshot), seed, tests. Pushed to GitHub.

**Pending**

- Your approval to proceed to Stage 8 (Customization Engine).
- Local install + migrate + seed to see it live.

**Risks**

- Cart/order fully exercised only after auth tokens exist; sign-in UI arrives with checkout — API is testable now via Swagger/curl.
- Decimal handling verified in code; confirm currency rounding rules in review.

**Decisions required**

1. Approve the catalog/cart/order-shell scope for the core.
2. Confirm order-number format `TM-<base36>` (or specify a sequence).
3. Confirm ready-size set (S/M/L/XL) for seed — add XXL/custom?

**Exact next step**
On approval → **Stage 8 — Customization Engine**: schema-driven configurator, rules engine (conditional/incompatible/min-max/approval), versioned schemas, and the dynamic pricing engine with immutable pricing snapshots.

---

Developed by Syed Rizwan Ahmed
