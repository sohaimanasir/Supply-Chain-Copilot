# Tech Stack — Supply Chain Copilot MVP

| Field | Detail |
|---|---|
| Source | Supply_Chain_Copilot_BRD_v3.docx (§11), PRD.md (§11) |
| Scope | 1–2 day demo build (Inventory, Suppliers, Purchase Orders) |
| Date | July 30, 2026 |

---

## 1. Summary

The stack favors components that are fast to stand up in 1–2 days, consistent with the existing project stack (RealtyPulse, SafeGuard), and **scale-friendly without requiring scale-infrastructure to be built now**. Nothing here should need a rewrite when the app moves past the demo — but caching, replicas, and rate-limiting are explicitly deferred (see §7).

---

## 2. Frontend

| Component | Choice | Notes |
|---|---|---|
| Framework | Next.js 15 (App Router) | Consistent with existing stack |
| UI library | React 19 | |
| Language | TypeScript | |
| Styling | Tailwind CSS | |
| Component library | shadcn/ui | Pre-built accessible components; fast to assemble a dashboard/chat UI in the time available |
| Charts | Recharts | Sufficient for KPI cards; no need for a heavier viz library |

---

## 3. Backend & Data

| Component | Choice | Notes |
|---|---|---|
| Database | PostgreSQL, via Supabase or Prisma-managed Postgres | **Open item:** confirm whether Supabase is intended as the production DB or a prototyping choice only (BRD flagged "Supabase (demo)" as ambiguous) |
| ORM | Prisma | Standard choice for the stack; gives type-safe queries and quick schema iteration |
| API layer | Next.js API routes (stateless) | No separate backend service needed for demo scope |
| Data seeding | One-time load from CSV/Excel into Postgres | No in-app import UI for the demo — load happens once at setup |

---

## 4. Authentication

| Component | Choice | Notes |
|---|---|---|
| Auth provider | Better Auth (default) or Supabase Auth | **Open item:** confirm which — Supabase Auth may be preferred for consistency with the DB choice and other projects |
| Password handling | Hashed, never stored in plaintext | |
| Access control | Server-side role check on every API route | Demo only needs one role, but enforce server-side (not just UI-hidden) so the pattern is correct from day one |

---

## 5. AI / LLM

| Component | Choice | Notes |
|---|---|---|
| Provider | Google Gemini or DeepSeek | Direction confirmed in BRD; **exact model string must be pinned immediately before build starts** — both providers version/deprecate model names frequently |
| Usage pattern | Server-side calls only, scoped to seeded dataset | Chat should never see data outside what's loaded for the demo |
| Guardrails | Deterministic logic decides thresholds/scores; AI only summarizes/narrates/drafts | See PRD §7 — this is a hard requirement, not a nice-to-have |
| Citation requirement | Every numeric chat answer must reference a source record | Enforced in prompt/response handling, not just UI copy |

---

## 6. Workflow Orchestration

| Component | Choice | Notes |
|---|---|---|
| Orchestration tool | None for MVP | n8n explicitly dropped from demo scope (BRD §11, §12); revisit in Phase 2 only if scheduled jobs or multi-step automations are needed |

---

## 7. Hosting, Scaling & Observability

| Component | Choice | Notes |
|---|---|---|
| Hosting | Vercel (or equivalent horizontally-scaling platform) | Stateless API routes deploy cleanly here |
| Scaling posture | Choose components that scale later without a rewrite; do **not** build scale infrastructure into the 2-day demo | Caching layer, read replicas, rate limiting, load balancing are a distinct Phase 2/3 workstream |
| Logging/monitoring | Centralized app logs; error monitoring (Sentry or equivalent) | Recommended even for the demo, low effort to add |
| Audit logging | Console/DB log of AI-initiated writes | No dedicated audit-log UI needed for demo — the log itself is the deliverable, not a viewer |

**Note on the 1M+ user target:** this scale target is stated in the BRD but conflicts with a 1–2 day CSV-based demo build. The stack above is chosen so it *can* scale later (Postgres, stateless routes, horizontal hosting) without needing to *be* scaled now. Whether 1M+ means internal staff at one company or future multi-tenant/customer-facing use is still an open question that should be resolved before any scale-specific engineering work begins.

---

## 8. Explicitly Not Used in MVP

- ERP connectors (SAP / Oracle / Dynamics)
- WMS integration
- Supplier API / EDI connections
- Email/Teams/Slack notification services
- BI platform connectors (Power BI, Tableau, Looker)
- ML forecasting frameworks (rule/threshold-based logic only)
- Caching layer, read replicas, rate limiter, load balancer

---

## 9. Open Items Before Build

1. Pin exact Gemini/DeepSeek model string and API version
2. Confirm Supabase as production DB vs. prototyping-only
3. Confirm Better Auth vs. Supabase Auth
4. Clarify 1M+ user target (internal vs. multi-tenant) — no architectural impact for the demo itself, but affects how seriously to future-proof beyond "doesn't require a rewrite"
