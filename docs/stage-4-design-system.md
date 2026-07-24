# Stage 4 — Visual Design System

**Project:** Tailor Master — Virtual Try-On & Custom-Measurement Clothing E-Commerce PWA
**Stage:** 4 of 14 (Visual Design System)
**Status:** Awaiting approval
**Depends on:** Stage 1–3 (approved)

> Delivered as an interactive design-system page (all tokens + rendered components, light/dark + RTL demo). See chat for the live link. Design tokens are also exported below as CSS custom properties for direct reuse in Stage 6 (Tailwind theme).

---

## 1. Objective & concept

Give the platform one coherent, distinctive visual language — an **atelier system: ink, brass & pattern paper**. Indigo ink = trust + navigation + primary action; brass = craft + price; warm neutrals = pattern paper. Three **functional lane colours** keep Preview / Fit / Made-to-Measure permanently distinct.

## 2. Deliverables

Color · Typography · Spacing/radius/elevation · Buttons & badges · Forms · Tables · Cards · Modals · Alerts · Stepper · RTL behaviour · Light & dark themes.

## 3. Color tokens

| Token              | Light                             | Dark                              | Role                          |
| ------------------ | --------------------------------- | --------------------------------- | ----------------------------- |
| brand              | `#2B3A67`                         | `#8FA1D8`                         | Identity, primary action, nav |
| brand-strong       | `#1E2A4E`                         | `#A9B7E4`                         | Hover / pressed               |
| brand-tint         | `#E9ECF5`                         | `#232B45`                         | Soft fills, selected          |
| brass              | `#A67C2E`                         | `#CBA65E`                         | Craft, price, accents         |
| brass-tint         | `#F3EAD6`                         | `#322913`                         | Highlight surfaces            |
| paper              | `#F7F4EE`                         | `#171611`                         | Page background               |
| surface            | `#FFFFFF`                         | `#211F19`                         | Cards                         |
| ink                | `#23211C`                         | `#ECE8DE`                         | Body text                     |
| muted              | `#6B6558`                         | `#A29A8B`                         | Secondary text                |
| line-strong        | `#D3CBBB`                         | `#433F34`                         | Borders                       |
| preview            | `#6D4FB0`                         | `#AD93E6`                         | Style Preview (AI)            |
| fit                | `#1F6E7E`                         | `#5FB2C2`                         | Fit recommendation            |
| mtm                | `#8A2F52`                         | `#D888A3`                         | Made-to-measure               |
| good / warn / crit | `#2C7A50` / `#8A5E12` / `#A02B37` | `#6BBE88` / `#CFA24C` / `#DE8891` | Semantic                      |

Brand accent is spent on one job; lane colours are functional (never decorative); semantic stays separate from both.

## 4. Typography

- **Display / headings:** Fraunces (characterful serif, weight 600). Fallback Georgia.
- **Body:** humanist sans (system-ui stack in dev; e.g. self-hosted grotesque in prod). Not Inter-by-default.
- **Data / labels / price:** IBM Plex Mono, tabular-nums.
- **Urdu:** Noto Nastaliq Urdu · **Arabic:** Noto Naskh/Sans Arabic.
- All faces **self-hosted via `@font-face`** in production — no font CDN (CSP-safe). Rendered with system fallbacks in the preview.
- Type scale: Display 44 · H2 30 · H3 22 · Body-L 16 · Body-S 13.5 · Mono 12 · Label 11 (caps, .14em).

## 5. Spacing, radius, elevation

- **8px base** scale: 4 · 8 · 14 · 20 · 32 · 52. Layout uses flex/grid `gap`, never stacked margins.
- **Radius:** 6 (controls) · 10 (cards) · 16 (panels/modals) · 999 (pills).
- **Elevation:** subtle card shadow + a larger modal shadow.

## 6. Components (all rendered in the kit)

Buttons (primary/brass/ghost/quiet/danger/disabled) · badges & lane pills · stepper · form fields (input, select, in/cm unit switch, error + outlier state, checkbox, toggle) · tables (tabular-num, state pills) · product & profile cards · modal (measurement-lock confirm) · alerts (info/warn/preview). Focus states always visible for keyboard use; `prefers-reduced-motion` respected.

## 7. RTL behaviour

Whole layout mirrors for Urdu/Arabic — text aligns right, steppers/icons flip, nav moves to the opposite edge, using logical properties (`margin-inline-start`, `dir="rtl"`). Same tokens, same components; only direction changes.

## 8. Light & dark

Token-level theming: base palette on `:root`, redefined under `@media (prefers-color-scheme: dark)` and overridden by `:root[data-theme="dark|light"]` so the viewer's toggle wins. Both themes tuned for contrast — not a naive invert.

---

## Completion Report — Stage 4

**Completed**

- Full token set (color/type/space/radius/elevation) for light & dark, rendered component library, RTL demo. Design-system page published; this document saved to `docs/stage-4-design-system.md`; tokens exported to `docs/design-tokens.css`.

**Pending**

- Your approval to proceed to Stage 5 (Technical Architecture).
- Sign-off on the brand direction (ink + brass) and the Fraunces/mono type pairing.

**Risks**

- Production fonts must be licensed & self-hosted (Fraunces/IBM Plex are open-source; Nastaliq via Noto — all OK). Flagged so no CDN dependency sneaks in.

**Decisions required**

1. Approve the atelier palette (Indigo Ink + Brass) — or nudge the accent.
2. Approve the type pairing (Fraunces display + humanist sans + Plex Mono).
3. Confirm the three lane colours (violet/teal/plum) are acceptable and colour-blind-distinct enough (they also always carry a text label).

**Exact next step**
On approval → **Stage 5 — Technical Architecture**: system diagram, modules, database design (Prisma schema sketch), API design, background jobs, storage, security, deployment, and integration adapters.

---

Developed by Syed Rizwan Ahmed
