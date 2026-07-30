# Product Requirements Document (PRD)
## Supply Chain Copilot — MVP (Demo Build)

| Field | Detail |
|---|---|
| Source document | Supply_Chain_Copilot_BRD_v3.docx |
| Document status | Draft — for engineering handoff |
| Build timeline | 1–2 days (confirmed demo scope, BRD §4.4–4.5) |
| Date | July 30, 2026 |

---

## 1. Overview

Supply Chain Copilot is an AI-powered conversational and analytics platform that helps supply chain, procurement, and operations teams monitor inventory, suppliers, and purchase orders through natural-language chat and a KPI dashboard.

The MVP is a **single-enterprise demo build** using seeded CSV/Excel data (no live ERP integration), designed to prove the core value: closing the gap between "something is wrong in the supply chain" and "the right person knows and can act," using AI summarization, scorecards, and draft-document generation — always with a human approving before anything is issued.

**This PRD scopes the demo build described in BRD §4.5**, not the full 8-module/5-role Phase 1 MVP in §4.1. The two differ in RBAC breadth and module count; that tradeoff is intentional given the 1–2 day timeline and is called out in section 3 below.

---

## 2. Goals & Success Metrics

| Goal | Metric | Target |
|---|---|---|
| Reduce time-to-detect low stock | Low-stock items surfaced without manual lookup | 100% of seeded items correctly flagged |
| Reduce manual reporting effort | Supplier scorecards generated without spreadsheet work | AI narrates 100% of scorecards from formula output |
| Prove AI-assisted PO drafting | AI-drafted POs that require zero manual re-typing of line items | Draft generated in <5s, human-editable |
| Prove trustworthy AI answers | Numeric chat answers with a source citation | 100% of numeric answers cite a record |
| Demonstrate the guardrail model | AI-initiated actions logged | 100% of AI writes logged (console/DB acceptable for demo) |

Long-term KPI targets (stockout reduction, OTIF, hours saved) are defined in BRD §2 but are **not measurable in a 1–2 day demo** — they apply to the post-demo, real-data phase.

---

## 3. Scope

### 3.1 In Scope (MVP / Demo)

- **One role** for the walkthrough: Supply Chain / Procurement Manager (combined)
- **Three modules**: Inventory, Suppliers, Purchase Orders
- **Data load**: one-time seed from CSV/Excel into Postgres/Supabase (no in-app import UI)
- **AI Copilot chat**, scoped to the seeded dataset, with source citations on numeric answers
- **Dashboard**: KPI cards + one chat view
- **AI use cases**:
  - Low-stock detection (deterministic rule, AI summarizes only)
  - Supplier scorecard narration (deterministic formula, AI narrates only)
  - AI-assisted PO drafting (AI drafts only, human approves)
- **Audit logging** of AI-initiated actions (console/DB log is sufficient — no dedicated UI)

### 3.2 Explicitly Out of Scope for MVP

- Multi-role RBAC (5 personas) — full matrix is Phase 1+ (BRD §9)
- Warehouse Overview, Shipment Tracking modules — "nice to have if time allows," not core
- PDF/Excel export UI, audit-log UI
- Live ERP / WMS / supplier API / EDI integration
- Email/Teams/Slack notifications (in-app alerts only)
- BI connectors (Power BI, Tableau, Looker)
- ML-based forecasting (rule/threshold-based only in MVP)
- Any infrastructure for the stated 1M+ user scale target (caching, read replicas, rate limiting, load balancing) — architecture should not *block* future scale, but scale infra itself is a separate Phase 2/3 workstream (BRD §8.1)

### 3.3 Open Items Requiring a Decision Before Build

These are flagged in the BRD as unresolved and should be confirmed before or very early in the build:

1. **Exact AI model/provider string** — Gemini or DeepSeek, specific release version (BRD §11)
2. **1M+ user target** — internal staff at one company, or future customer-facing/multi-tenant? Affects whether the single-tenant data model holds (BRD §8.1)
3. **PO approval tier** — confirmed default is single-tier (Procurement Manager approves directly); flag if a dollar-threshold escalation to Ops Director is actually required (BRD §6.1, §9)
4. **Supplier scoring weights** — proposed 40/30/20/10 (on-time / accuracy / quality / responsiveness) is a starting point, not finalized (BRD §6)
5. Which 2–3 AI use cases matter most to whoever is watching the demo, since that should drive polish priority within the 1–2 days

---

## 4. Users

Single combined persona for the demo:

**Supply Chain / Procurement Manager**
- Monitors stock levels, flags shortages, plans replenishment
- Manages suppliers, generates and approves purchase orders
- Full read/write on Inventory, Suppliers, Purchase Orders

*(Full 5-persona matrix — Warehouse Manager, Operations Director, Executive — is documented in BRD §3 and §9 for post-demo phases.)*

---

## 5. User Stories

1. As the Manager, I want low-stock items flagged automatically on the dashboard, so I don't have to check inventory manually every day.
2. As the Manager, I want the AI Copilot to narrate supplier scorecards in plain language, so I can judge which suppliers need attention without reading raw scores.
3. As the Manager, I want to ask the AI Copilot natural-language questions about inventory and suppliers, so I get answers without building a report myself.
4. As the Manager, I want the AI to draft a purchase order for a low-stock item, so I spend less time creating a repetitive document from scratch.
5. As the Manager, I want to review and edit an AI-drafted PO before it's issued, so I stay in control of what actually gets ordered.
6. As the Manager, I want every AI-drafted PO and chat answer to show its source data, so I can trust the numbers before I act on them.

---

## 6. Functional Requirements

### 6.1 Authentication
- Secure login (single role for demo; no need to build/test full RBAC matrix)
- Passwords hashed, never stored in plaintext

### 6.2 Dashboard
- KPI cards: stock health, open POs, supplier OTIF
- One chat view for the AI Copilot

### 6.3 Inventory
- CRUD for SKU: name, code, quantity_on_hand, reorder_threshold, unit_cost
- Automatic status classification: Healthy / Low / Critical, based on threshold rule (deterministic, not AI-decided)

### 6.4 Suppliers
- Supplier profile: contact info, contract terms
- Deterministic scorecard formula (see §7 below); AI narrates the result but never computes or alters the score
- AI-generated scorecard narrative

### 6.5 Purchase Orders
- AI-assisted PO draft generation from the Copilot: supplier, quantity, estimated cost, status = **Draft**
- AI recommends supplier using the scorecard formula
- Draft is always editable by the Manager before approval
- Single-tier approval: Manager approves directly, PO is issued
- AI never auto-submits a PO

### 6.6 AI Copilot Chat
- Scoped to the seeded dataset only
- Numeric answers must cite the underlying record
- Ambiguous or out-of-scope questions should prompt for clarification rather than guess
- No invented data (dates, carriers, costs, etc.)

### 6.7 Audit Logging
- Every AI-initiated write (PO draft, scorecard generation) logged with user, timestamp, and input/output summary
- Console or DB log is sufficient for the demo — no dedicated UI required

---

## 7. AI Guardrails (Critical — applies to every AI feature)

| AI Use Case | Guardrail |
|---|---|
| Low-stock detection | Deterministic threshold check; AI only summarizes |
| Supplier scorecard | Deterministic formula computes the score; AI only narrates |
| PO drafting | AI drafts only, never submits; requires explicit human approval; must show source line-item data |
| Chat answers | Any numeric claim must cite a source record; no fabrication |

Proposed (unconfirmed) scorecard formula: **On-Time Delivery 40% / Order Accuracy 30% / Quality-Returns 20% / Responsiveness 10%**. Confirm with Procurement before build.

---

## 8. Process Flow — AI-Assisted PO Drafting (highest-priority demo flow)

```
Inventory item drops to/below reorder_threshold
        ↓
System auto-classifies SKU as Low / Critical
        ↓
In-app alert surfaces on dashboard
        ↓
Manager opens AI Copilot, asks to create a PO
        ↓
AI recommends a supplier using the scorecard formula
        ↓
AI drafts PO: supplier, quantity, estimated cost, status = Draft
        ↓
Manager reviews and edits line items
        ↓
Manager approves (single-tier, no auto-submit)
        ↓
PO is issued; action written to audit log
```

---

## 9. Acceptance Criteria (Given/When/Then)

| Scenario | Acceptance Criteria |
|---|---|
| Inventory status classification | Given a SKU's quantity_on_hand ≤ reorder_threshold, when the dashboard/inventory view loads, then the item shows as Low or Critical without manual tagging. |
| Inventory Copilot query | Given items flagged Low/Critical, when the manager asks the Copilot about stock status, then the response lists affected SKUs by name and cites the source record. |
| Supplier scorecard | Given a supplier has data for all four scoring inputs, when the scorecard is generated, then the score is computed by the deterministic formula and the AI narrates it without altering the number. |
| PO drafting | Given a SKU is Low/Critical, when the manager asks the Copilot to create a PO, then the AI generates a draft (supplier, quantity, estimated cost, status = Draft) and does not submit it automatically. |
| PO human review | Given an AI-drafted PO exists, when the Manager opens it, then every line item is editable before approval. |
| PO audit logging | Given a PO is approved, when approval completes, then it's written to the audit log with user, timestamp, and the AI-generated content approved. |

---

## 10. Data Model (High-Level)

- **User**: id, name, email, role, auth credentials
- **SKU / InventoryItem**: id, name, code, quantity_on_hand, reorder_threshold, unit_cost, status
- **Supplier**: id, name, contact info, contract terms, computed score
- **PurchaseOrder**: id, supplier_id, line items, status, created_by, approved_by, ai_generated flag
- **AuditLogEntry**: id, user_id, action_type, ai_involved flag, input_summary, output_summary, timestamp

*(Shipment entity exists in the full BRD data model but is out of scope for the demo build.)*

---

## 11. Tech Stack (Proposed)

| Layer | Choice | Note |
|---|---|---|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind + shadcn/ui | Consistent with existing stack |
| Backend/DB | PostgreSQL via Supabase or Prisma-managed Postgres | Confirm if Supabase is prod DB or prototyping-only |
| ORM | Prisma | |
| Auth | Better Auth (or Supabase Auth for consistency) | Confirm before build |
| AI/LLM | Google Gemini or DeepSeek | **Pin exact model string before build starts** |
| Workflow orchestration | None (n8n dropped for demo scope) | Revisit Phase 2 |
| Charts | Recharts | |

Scale-friendly but not scale-built: choose components (Postgres/Supabase, stateless Next.js API routes, Vercel-style hosting) that scale later without a rewrite, but do not build caching/read-replicas/rate-limiting into the 2-day demo.

---

## 12. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | Dashboard load <2s; Copilot response <5s (loading state for longer queries) |
| Security | TLS 1.2+ in transit, encryption at rest; role checks enforced server-side, not just UI-hidden |
| Auditability | Every AI-initiated write logged with user, timestamp, input/output |
| Availability | Not a demo-blocking concern; production target 99.5% post-demo |

---

## 13. Out of Scope / Deferred to Phase 2+

- Full 5-role RBAC, Warehouse & Shipment modules, PDF/Excel export UI, audit-log UI
- Live ERP/WMS/supplier API integration
- Email/Teams/Slack notifications
- ML-based forecasting
- Scale infrastructure for 1M+ users (pending clarification on what that number actually means)
- Full architecture diagrams, ERD, wireframes, screen mockups (better produced after demo feedback)

---

## 14. Open Risks

| # | Risk / Question | Status |
|---|---|---|
| 1 | Exact AI model/provider version | Must pin before build |
| 2 | 1M+ users — internal staff or future multi-tenant? | Unresolved; affects architecture |
| 3 | Supplier scoring weights | Proposed, not finalized |
| 4 | PO approval — self-approve confirmed as default | Confirm no threshold escalation needed |
| 5 | Which AI use cases to polish most | Needs demo-audience input |
