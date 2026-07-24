# Stage 13 — Security, QA & Performance

**Project:** Tailor Master — Virtual Try-On & Custom-Measurement Clothing E-Commerce PWA
**Stage:** 13 of 14
**Status:** Awaiting approval
**Depends on:** Stage 1–12 (approved)

> Interactive QA summary published. See chat for the link.

---

## 1. Objective

Consolidate testing across all dimensions and apply hardening before deployment.

## 2. Hardening applied this stage

- **Global rate limiting** (`@nestjs/throttler`): 100 req/min per IP; **auth `register`/`login` 5/min** (brute-force blunting).
- **Global exception filter**: consistent error envelope, **no stack traces to clients**, 5xx logged server-side.
- **e2e tests** (supertest): register → `/auth/me`, validation rejection, unauthenticated block, public health.
- **Accessibility**: skip-to-content link + always-visible `:focus-visible` outline; `prefers-reduced-motion` respected.
- **SECURITY.md** (posture + required-before-prod list) and **`scripts/backup.sh`** (pg_dump + restore notes).

## 3. Test coverage

**Automated (~35 unit + e2e), all in CI (`lint → typecheck → test → build`):**

| Area                        | Tests                                                            |
| --------------------------- | ---------------------------------------------------------------- |
| Rules engine (configurator) | incompatibility, approval+lead-time, numeric min/max & surcharge |
| Pricing engine              | base+options, urgent surcharge, tax+shipping, immutable snapshot |
| Measurement formula         | ease/fit/stretch/shrinkage, garment vs final                     |
| Measurement validation      | ranges, ratio outliers, dual-entry, confidence, source penalty   |
| Try-on quality check        | portrait/full-body pass; small/landscape/missing fail            |
| Order-flow state machine    | linear path, skip rejection, QC pass/fail, terminal states       |
| Health                      | DB up / DB down                                                  |
| Order guards                | empty-cart reject, non-customer block                            |
| Auth (e2e)                  | register→me, validation, 401 without token, public health        |

The pure domain engines (pricing, formula, validation, rules, state-machine) are deterministic and I/O-free — the highest-risk logic is the best covered.

## 4. Review checklist (dimension by dimension)

- **Functional** — core journeys implemented & unit/e2e covered; manual pass recommended on the running app.
- **Integration** — modules talk via services only; auth e2e exercises the real HTTP stack.
- **Role testing** — `RolesGuard` on every privileged route; 12 roles; verify each in staging.
- **Security review** — see `SECURITY.md`; RBAC, argon2, rate limit, helmet, validation, Prisma (SQLi-safe), audit logs, consent, signed-URL design, non-leaky errors. Pen-test + lawyer review still required.
- **Accessibility** — skip link, focus outlines, reduced-motion, semantic HTML, alt text on product images; run axe/Lighthouse a11y in staging.
- **Responsive** — mobile-first Tailwind; verify at 360/768/1280 in staging.
- **RTL** — tokens + logical properties + Nastaliq/Naskh fonts prepared (Stage 4); wire the `dir`/locale switch when i18n content lands.
- **Performance** — CDN, lazy images, pagination, DB indexes on hot columns, background jobs (design), caching (Redis). Run Lighthouse + load test in staging.
- **Error handling** — global filter + typed, actionable messages.
- **Backup** — `scripts/backup.sh` + managed PITR (Stage 5); validate a restore drill.

## 5. Known gaps (honest)

- Real object-storage upload, malware scan, and BullMQ workers land with infra (flagged in code).
- Full install/build/tests run in **CI**, not in this ephemeral authoring environment.
- Legal/consent copy is placeholder — **lawyer review required**.
- Load/pen tests to be run against staging.

---

## Completion Report — Stage 13

**Completed**

- Rate limiting, global exception filter, e2e tests, a11y (skip link/focus), SECURITY.md, backup script, and this QA report. Pushed.

**Pending**

- Approval for Stage 14 (Deployment).
- Staging run of Lighthouse / axe / load / pen tests (needs a deployed environment).

**Risks**

- Some hardening (malware scan, workers, presigned uploads) is infra-dependent — sequenced into deployment.

**Decisions required**

1. Approve the QA posture + hardening.
2. Approve running load/pen/a11y suites against staging in Stage 14.

**Exact next step**
On approval → **Stage 14 — Deployment**: production configuration, environment checklist, database migrations, monitoring, backup, rollback plan, admin guide, and user guide.

---

Developed by Syed Rizwan Ahmed
