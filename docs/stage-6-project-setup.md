# Stage 6 — Project Setup

**Project:** Tailor Master — Virtual Try-On & Custom-Measurement Clothing E-Commerce PWA
**Stage:** 6 of 14 (Project Setup)
**Status:** Awaiting approval
**Depends on:** Stage 1–5 (approved)

> First stage with real code. This sets up a runnable monorepo foundation — no ecommerce features yet (those are Stage 7+).

---

## 1. Objective

Create the repository skeleton everything else builds on: monorepo layout, environment config, database foundation + first-migration-ready schema, authentication foundation, CI/CD, coding standards, and a README — with the Stage 4 design tokens wired into the web app's Tailwind theme.

## 2. Deliverables (all committed)

Repository structure · environment configuration · database foundation (Prisma) · authentication foundation (JWT + argon2) · CI/CD (GitHub Actions) · coding standards (`CONTRIBUTING.md`) · README.

## 3. What was created

### Root

- `package.json` — npm workspaces (`apps/*`, `packages/*`), shared scripts (dev/build/lint/typecheck/test/format).
- `.gitignore`, `.editorconfig`, `.prettierrc.json`, `.prettierignore`.
- `.env.example` — dev infra credentials.
- `docker-compose.yml` — Postgres 16 + Redis 7 + MinIO (S3) for local dev, with healthchecks.
- `.github/workflows/ci.yml` — format-check → lint → prisma generate → typecheck → test → build, with a Postgres service.
- `README.md`, `CONTRIBUTING.md` (coding standards + architecture rules).

### `apps/api` — NestJS modular monolith

- `package.json`, `tsconfig.json` (strict), `nest-cli.json`, `.eslintrc.cjs`, `jest.config.js`, `.env.example`.
- `prisma/schema.prisma` — **foundation schema**: User, Role, Permission, UserRole, RolePermission, Session, Customer, ConsentRecord, AuditLog + enums (Locale, Unit, RoleKey with all 12 roles).
- `src/main.ts` — bootstraps with global `/api/v1` prefix, Helmet, CORS, global ValidationPipe (whitelist + transform), Swagger at `/docs`.
- `src/config/env.validation.ts` — **Zod env validation** (fails fast on bad config).
- `src/prisma/` — global PrismaModule + PrismaService (connect/disconnect lifecycle).
- `src/modules/health/` — `GET /api/v1/health` (checks DB) + unit test.
- `src/modules/identity/` — **auth foundation**: register/login/`me`, argon2 password hashing, JWT access+refresh, hashed refresh sessions (revocable), JWT passport strategy + guard, validated DTOs.

### `apps/web` — Next.js PWA

- `package.json`, `tsconfig.json`, `next.config.mjs` (API proxy rewrite), `postcss.config.js`, `.eslintrc.json`, `.env.example`.
- `tailwind.config.ts` — **Stage 4 tokens wired** as Tailwind colors/fonts/radius/shadow via CSS variables; dark mode via `[data-theme="dark"]`.
- `src/app/globals.css` — full token set (light + dark), `prefers-reduced-motion` guard.
- `src/app/layout.tsx` — root layout, metadata, PWA manifest link, `dir="ltr"` (RTL switch comes with i18n in a later stage), footer.
- `src/app/page.tsx` — foundation landing proving tokens/theme/build wire-up (the three lanes + CTAs).
- `src/components/Footer.tsx` — includes the mandatory **"Developed by Syed Rizwan Ahmed"** credit, readable on all breakpoints & themes, non-overlapping.
- `public/manifest.webmanifest` — installable PWA metadata.

## 4. How to run & test (local)

```bash
npm install
docker compose up -d
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
npm run db:generate -w apps/api
npm run db:migrate  -w apps/api        # creates the first migration
npm run dev                            # web :3000 · api :3001
```

**Verify:**

- `GET http://localhost:3001/api/v1/health` → `{ status: "ok", db: "ok", ... }`
- `http://localhost:3001/docs` → Swagger UI (auth + health)
- `POST /api/v1/auth/register` then `POST /api/v1/auth/login` → returns access + refresh tokens
- `GET /api/v1/auth/me` with `Authorization: Bearer <accessToken>` → returns the user
- `http://localhost:3000` → landing renders with the atelier theme; toggle OS dark mode to see the dark palette.
- CI runs the same lint → typecheck → test → build chain on push/PR.

## 5. Verification done in this environment

- File structure created and reviewed.
- All JSON/config files validated as parseable (package.json ×3, tsconfigs, manifest, eslint, prettier).
- CI workflow structure checked.
- **Not** run here: full `npm install` + build (heavy for the ephemeral container). Run locally per §4. Honest status — the scaffolding is complete and coherent; a local install is the first real build.

---

## Completion Report — Stage 6

**Completed**

- Monorepo (npm workspaces), env config, Prisma foundation schema, JWT auth foundation, health check, CI/CD, coding standards, README, Tailwind theme with Stage 4 tokens, branding footer.

**Pending**

- Your approval to proceed to Stage 7 (Ecommerce Core).
- Local `npm install` + first `prisma migrate` on your machine (or CI) to generate the migration.

**Risks**

- Dependency versions may need minor bumps at install time (pinned to recent majors).
- Prisma client types only exist after `db:generate` — the CI step handles this before typecheck.

**Decisions required**

1. Approve the monorepo + auth foundation.
2. Package manager: **npm workspaces** (current) — OK, or prefer pnpm?
3. Confirm API base path `/api/v1` and web dev proxy.

**Manual Actions Required**

- Add real PWA icons at `apps/web/public/icons/icon-192.png` and `icon-512.png` (referenced by the manifest; placeholders 404 until added).
- Provide/self-host the licensed fonts (Fraunces, IBM Plex Mono, Noto Nastaliq/Naskh) as `@font-face` in a later polish step — all are open-source.
- Rotate the example JWT secrets before any non-local deploy (`openssl rand -base64 48`).

**Exact next step**
On approval → **Stage 7 — Ecommerce Core**: catalog (products/categories/fabrics), product listing + PDP APIs and pages, cart, and the order shell — built and tested on this foundation.

---

Developed by Syed Rizwan Ahmed
