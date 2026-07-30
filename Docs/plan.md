# Build Plan — Supply Chain Copilot MVP

FieldDetailTimeline1–2 days (confirmed demo scope)InputsPRD.md, techstack.md, AppFlow.md, Design.md, schema.mdDateJuly 30, 2026

## 0\. Before Starting — Open Items (Resolved)

All five items are pinned down as of build start:

1.  **LLM:** Gemini 2.5 Flash-Lite
2.  **Database:** Neon (Postgres) — Supabase ruled out, free-tier 2-project limit already used by other projects
3.  **Auth:** Better Auth
4.  **Supplier scorecard weights:** 40/30/20/10 (default)
5.  **Inventory CRITICAL threshold multiplier:** 0.5× reorderThreshold (default)

No blockers remain going into Phase 1.

## Phase 1 — Foundation (Day 1, Morning)

**Goal:** project scaffolded, database live, schema migrated, seed data loaded.

1.  Init Next.js 15 project (TypeScript, Tailwind, App Router)
2.  Install and configure shadcn/ui, Recharts, Prisma
3.  Provision Postgres (Neon) instance; set DATABASE_URL
4.  Add schema.prisma from schema.md; run initial migration
5.  Implement derived-field logic as pure functions:
    - classifyStockStatus(quantityOnHand, reorderThreshold)
    - computeSupplierScore(inputs)

6.  Write seed script (per schema.md §5): 15–25 SKUs, 5–8 suppliers, 5–10 historical POs, spread across status buckets, one seed Manager user
7.  Run seed script against dev DB; spot-check status/score distribution looks right for a demo

**Exit criteria:** npm run dev shows an empty shell app backed by a real, seeded database.

## Phase 2 — Auth & App Shell (Day 1, Midday)

**Goal:** login works, sidebar nav and layout match Design.md.

1.  Implement auth (Better Auth); hash passwords, session handling
2.  Build the app shell: sidebar nav (Dashboard / Inventory / Suppliers / Purchase Orders / Copilot), per AppFlow §1
3.  Apply Design.md tokens: color variables, typography (Space Grotesk / Inter / JetBrains Mono), dark surfaces
4.  Build the reusable **status tag** component (§5 in Design.md) — used everywhere from here on
5.  Build the reusable card component with left-edge status rail
6.  Server-side route protection (role check on every API route, not just UI-hidden)

**Exit criteria:** logging in lands on an empty Dashboard inside the correct shell and visual system.

## Phase 3 — Core CRUD Screens (Day 1, Afternoon)

**Goal:** Inventory, Suppliers, and PO list/detail screens work against real (seeded) data — no AI yet.

1.  **Inventory**
    - List view with status filter, using seeded data
    - Detail view: editable fields, status tag, "Draft PO with AI" button (non-functional placeholder for now)

2.  **Suppliers**
    - List view sorted worst-score-first
    - Detail view: contact info, contract terms, computed score displayed (no AI narrative yet)

3.  **Purchase Orders**
    - List view grouped by status (Draft / Approved / Issued)
    - Detail/review view: line items, source-data reference per line, Approve action wired to real status transition + approvedById/approvedAt

4.  **Dashboard**
    - KPI cards wired to real aggregate queries: stock health counts, open PO count, average supplier OTIF
    - Alert feed: Low/Critical SKUs, most severe first, linking to Inventory Detail

**Exit criteria:** a manager can browse and edit real data end-to-end with zero AI involvement — this is the fallback demo if AI integration runs short on time.

## Phase 4 — AI Copilot Integration (Day 1 Evening / Day 2 Morning)

**Goal:** the three AI use cases from PRD §7 work, with guardrails and citations.

1.  Wire the chosen LLM provider (server-side only, API key never exposed client-side)
2.  Build the floating chat widget (Design.md §7) — trigger, expand/collapse, message list
3.  Build the dedicated /copilot full-page view, sharing state with the widget
4.  Implement chat query handling, scoped to the seeded dataset:
    - Retrieve relevant records (inventory/supplier/PO) based on the question
    - Numeric answers must include a citation chip linking to the source record
    - Ambiguous/out-of-scope questions trigger a clarifying question, not a guess

5.  Implement **supplier scorecard narration**: AI receives the already-computed score + inputs, generates plain-language narrative only — never recomputes the number
6.  Implement **AI-assisted PO drafting**:
    - Input: a SKU (from chat or the "Draft PO with AI" button)
    - AI recommends a supplier using the scorecard (highest score, or business rule agreed with Procurement)
    - AI drafts: supplier, quantity, estimated cost → creates a PurchaseOrder in DRAFT status with PurchaseOrderLine(s)
    - Response links directly to the PO Detail/Review screen

7.  Implement audit logging: every AI-initiated write (PO_DRAFTED, SCORECARD_GENERATED) and every chat query (CHAT_QUERY) writes an AuditLogEntry (console/DB log — no UI needed)
8.  Wire the "Approve" action on PO Detail to also log PO_APPROVED

**Exit criteria:** the full journey in AppFlow §3.2 (alert → chat → draft → review → approve → issued) works end-to-end with a real LLM call.

## Phase 5 — Polish & Demo Prep (Day 2, Afternoon)

**Goal:** the demo is smooth, fast, and resilient to live failure.

1.  Pass over Design.md details: status tag redundant coding, focus rings, hover states, spacing consistency
2.  Add loading states for Copilot responses >2s (per NFR: <5s target, loading state beyond that)
3.  Add basic error handling for LLM failures (timeout, rate limit) — a scripted fallback response is acceptable for a demo, but it must not silently break the UI
4.  Verify all three acceptance-criteria tables from PRD §9 by hand — this doubles as the demo rehearsal
5.  Rehearse the exact demo script:
    - Login → Dashboard (show alert) → Copilot draft PO → review/edit → approve → confirm audit entry
    - Suppliers detail with AI narration as a secondary beat

6.  Re-check seed data distribution one more time (does the demo actually show a Critical item and an at-risk supplier clearly?)
7.  Prepare a short "what we decided and why" note (LLM, DB, auth, scorecard weights, CRITICAL threshold — per §0) for the audience — turns the resolved decisions into a natural close for the demo

**Exit criteria:** the primary journey can be run live, twice in a row, without a hiccup.

## Summary Timeline

PhaseTimingFocus1 — FoundationDay 1 AMScaffold, DB, schema, seed2 — Auth & ShellDay 1 MiddayLogin, nav, design tokens, status tag3 — Core CRUDDay 1 PMInventory, Suppliers, POs, Dashboard (no AI)4 — AI CopilotDay 1 Eve / Day 2 AMChat, scorecard narration, PO drafting, audit log5 — Polish & RehearseDay 2 PMError handling, acceptance-criteria pass, demo run-through

Phase 3's exit criteria doubling as a fallback matters: if Phase 4 runs over, the team still has a working, real-data demo of Inventory/Suppliers/POs to show — the AI layer is additive, not a single point of failure for the whole demo.
