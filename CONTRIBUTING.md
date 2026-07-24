# Contributing & Coding Standards

## Branching

- `main` — protected, always deployable.
- Feature branches: `feat/<area>-<short>`, fixes: `fix/<area>-<short>`.
- One logical change per PR; keep PRs small and reviewable.

## Commits

- Conventional-ish: `type(scope): summary` (e.g. `feat(measurement): add outlier detection`).
- Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `ci`, `perf`.

## Code style

- **TypeScript everywhere**, `strict` mode on.
- ESLint + Prettier enforced in CI. Run `npm run format` before committing.
- Prefer named exports; avoid default exports except Next.js pages/layouts.
- No `any` without a `// reason:` comment.

## Architecture rules (the modular monolith)

- Each API module owns its own tables and exposes a **service interface**.
- **Cross-module access goes through services — never another module's tables or repositories.** This is the seam that lets us extract microservices later.
- External providers (try-on, body-scan, payment) are reached **only** through adapter interfaces. No vendor SDK imported in domain code.
- The **Order snapshot is immutable** — never write to a placed order's snapshot.

## Validation & errors

- Validate all input at the boundary (Zod / Nest DTOs). Never trust client data.
- Return typed, actionable errors. No leaking internals.

## Security (always)

- Body images & measurements are **sensitive**: consent-gated, encrypted, signed short-lived URLs, RBAC, audited.
- Never commit secrets. Use `.env` locally and a secrets manager in prod.

## Testing

- Unit tests for services & pure logic (pricing, measurement formula, rules).
- Integration tests for API routes. E2E for critical journeys.
- A bug fix ships with a regression test.

## Accessibility & i18n

- Mobile-first, keyboard-navigable, visible focus states, `prefers-reduced-motion` respected.
- English + Urdu (RTL) supported; Arabic-ready. Use logical CSS properties (`margin-inline`, `dir`).

## Branding

- The footer credit **"Developed by Syed Rizwan Ahmed"** must remain readable on all breakpoints and both themes.
