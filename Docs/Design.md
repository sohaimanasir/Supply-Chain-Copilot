# Design System — Supply Chain Copilot MVP

| Field | Detail |
|---|---|
| Direction | Modern & bold — high contrast, brand-forward |
| Layout | Sidebar nav + main content |
| Chat | Persistent floating widget + dedicated full-page Copilot |
| Date | July 30, 2026 |

---

## 1. Concept

This is a control-room tool, not a marketing site. The people using it are staring at it during a shift, scanning for what's wrong. The design should feel like an **operations command deck**: dark, high-contrast, built for fast scanning under real conditions — closer to a logistics dashboard or air-traffic display than a typical SaaS admin panel.

The signature element: every status-bearing object (SKU, supplier, PO) carries a **stenciled status tag** — a small monospace label in a solid color chip (`LOW`, `CRIT`, `DRAFT`, `ISSUED`) styled after shipping-manifest stamps and cargo placards. It's the one recurring visual motif that ties inventory, suppliers, and purchase orders together as "things with a state that matters right now."

---

## 2. Color

Dark base with a single confident brand accent, plus a fixed, non-negotiable status vocabulary (status colors are functional, not decorative — they must stay consistent everywhere).

| Token | Hex | Use |
|---|---|---|
| `ink-900` | `#0A0E14` | App background |
| `ink-800` | `#121821` | Sidebar / surface background |
| `ink-700` | `#1B232E` | Card background |
| `line-700` | `#2A3542` | Borders, dividers |
| `text-primary` | `#EDF1F5` | Primary text |
| `text-muted` | `#8996A5` | Secondary text, captions |
| `brand-cobalt` | `#3D5AFE` | Primary brand accent — nav highlight, primary buttons, links, focus rings |
| `signal-amber` | `#FFB020` | Status: Low stock, Draft PO |
| `signal-red` | `#FF4D5E` | Status: Critical stock, urgent alert |
| `signal-mint` | `#2FE6B8` | Status: Healthy, Approved/Issued, success |

Rules:
- Status colors (`amber`/`red`/`mint`) are **reserved exclusively** for status meaning — never used decoratively elsewhere in the UI, so they stay trustworthy at a glance.
- `brand-cobalt` is the only accent used for interactive/brand elements (buttons, active nav, links) — keeps it distinct from status colors.
- Background stays dark throughout; no light-mode surfaces in the MVP.

---

## 3. Typography

| Role | Typeface | Notes |
|---|---|---|
| Display / headings | **Space Grotesk** | Bold, geometric, slightly technical — used for page titles, KPI numbers |
| Body | **Inter** | High legibility at small sizes for dense data tables |
| Data / codes | **JetBrains Mono** | SKU codes, PO IDs, quantities, timestamps, status tags — reinforces the "manifest/placard" motif from real logistics documents |

Type scale (base 16px):

| Token | Size | Weight | Use |
|---|---|---|---|
| `display-lg` | 32px | 700 | Page titles |
| `display-md` | 24px | 700 | KPI card numbers |
| `body-lg` | 16px | 500 | Primary body text |
| `body-sm` | 14px | 400 | Secondary text, table rows |
| `mono-sm` | 13px | 500 | Status tags, codes, IDs (JetBrains Mono, uppercase, letter-spacing 0.04em) |

---

## 4. Layout

```
┌───────────┬──────────────────────────────────────────┐
│           │  Page title                    [Manager] │
│  Sidebar  ├──────────────────────────────────────────┤
│  (240px)  │                                            │
│  fixed    │   Main content                             │
│  dark     │   (cards / tables / detail panes)          │
│           │                                            │
│           │                                    ┌─────┐│
│           │                                    │ Chat ││ ← floating widget
│           │                                    │  ⬤   ││
└───────────┴──────────────────────────────────────────┘
```

- Sidebar: fixed 240px, `ink-800` background, collapses to icon-only under 1024px.
- Main content: `ink-900` background, cards on `ink-700`, generous padding (24px) so scanning dense tables doesn't feel cramped despite the dark palette.
- Cards use a **left-edge status rail** (4px solid bar in amber/red/mint) instead of colored backgrounds — keeps cards legible while still color-coding state at a glance.
- Grid: 12-column, 24px gutter, max content width 1440px.

---

## 5. The Status Tag (signature component)

```
┌──────────┐
│ CRIT     │  ← ink-900 text on signal-red, mono-sm, uppercase,
└──────────┘     2px radius (not fully rounded — reads as a stamp, not a pill)
```

Used consistently for:
- Inventory status (`HEALTHY` / `LOW` / `CRIT`)
- PO status (`DRAFT` / `APPROVED` / `ISSUED`)
- Supplier score bands (optional: `STRONG` / `WATCH` / `AT RISK`)

Always paired with the left-edge card rail in the same color — redundant coding (color + text) so the state is never conveyed by color alone.

---

## 6. Components

| Component | Notes |
|---|---|
| Primary button | `brand-cobalt` fill, `ink-900` text, 6px radius, used for "Approve," "Draft PO with AI" |
| Secondary button | Transparent, `line-700` border, `text-primary` text — used for "Edit," "Cancel" |
| Card | `ink-700` background, `line-700` 1px border, left status rail where applicable |
| Table row | `ink-900` background, `line-700` divider, hover state lightens to `ink-800` |
| KPI card | Large `display-md` number in `text-primary`, small `body-sm` label in `text-muted`, optional trend indicator in status color |
| Citation chip | Small `mono-sm` pill, `brand-cobalt` outline, links to the source record — appears inline after any AI numeric claim |
| Chat message (AI) | `ink-700` bubble, left-aligned, citation chips inline where relevant |
| Chat message (user) | `brand-cobalt`-tinted bubble (10% opacity fill, full-opacity border), right-aligned |

---

## 7. Chat Surfaces

### Floating widget
- Circular trigger, bottom-right, `brand-cobalt` fill with a chat icon.
- Expands into a 380px-wide panel anchored bottom-right, doesn't cover the sidebar.
- Header includes an "Expand to full page" control → navigates to `/copilot`, carrying the transcript.

### Dedicated `/copilot` page
- Full-height chat, message list left-aligned to a 720px column (keeps line length readable), input pinned to bottom.
- Same message and citation-chip styling as the widget, just more room to breathe — used for the PO-drafting walkthrough where the manager reviews a fuller draft.

---

## 8. Motion

Kept minimal and functional, not decorative — this is an operational tool, not a landing page:
- Alert badges: a single subtle pulse on `signal-red` items only, to draw the eye without being distracting on a screen someone is scanning all day.
- Widget expand/collapse: 150ms ease-out.
- No page-load animation sequences, no scroll-triggered reveals — the content should be usable instantly.

---

## 9. Accessibility Baseline

- All status information doubled with text, never color alone (§5).
- Minimum contrast ratio 4.5:1 for body text on `ink-900`/`ink-700` (verify `text-muted` at final values).
- Visible focus ring using `brand-cobalt` on all interactive elements.
- Widget and full-page chat both fully keyboard-navigable (tab to open, arrow/enter to send).

---

## 10. What's Deliberately Not Here

- No light mode — out of scope for a 1–2 day demo; dark-only is a design choice, not a placeholder.
- No illustration/iconography system beyond a small functional icon set (status, nav, chat) — this isn't a marketing surface.
- No animation beyond §8 — matches the "control room, not showcase" concept.
