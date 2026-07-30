# App Flow — Supply Chain Copilot MVP

| Field | Detail |
|---|---|
| Source | PRD.md, Supply_Chain_Copilot_BRD_v3.docx |
| Scope | 1–2 day demo build — single role, 3 modules |
| Layout | Sidebar nav + main content, with a persistent chat widget AND a dedicated Copilot page (see §5) |
| Date | July 30, 2026 |

---

## 1. Navigation Structure

Sidebar (always visible, collapsible on smaller viewports):

```
┌─────────────────┐
│ Logo             │
├─────────────────┤
│ ● Dashboard       │
│ ● Inventory       │
│ ● Suppliers       │
│ ● Purchase Orders │
│ ● Copilot         │  ← dedicated full-page chat
├─────────────────┤
│ [User: Manager]   │
│ Log out           │
└─────────────────┘
```

A floating Copilot widget (bottom-right) is present on every screen **except** the dedicated Copilot page, so the manager can ask a quick question without leaving Inventory or Suppliers. Opening the widget's "expand" control jumps to the full Copilot page with the same conversation carried over.

---

## 2. Screen Inventory

| Screen | Route | Purpose |
|---|---|---|
| Login | `/login` | Auth entry point |
| Dashboard | `/dashboard` | KPI cards, alerts, entry point to everything else |
| Inventory List | `/inventory` | All SKUs, status-filterable |
| Inventory Detail | `/inventory/[id]` | Single SKU detail, edit, "Draft PO" shortcut |
| Suppliers List | `/suppliers` | All suppliers with scorecards |
| Supplier Detail | `/suppliers/[id]` | Contact info, contract terms, AI-narrated scorecard |
| Purchase Orders List | `/purchase-orders` | All POs by status (Draft / Approved / Issued) |
| PO Detail / Review | `/purchase-orders/[id]` | Editable draft, approve action, audit trail |
| Copilot (full page) | `/copilot` | Full-screen chat, same engine as the widget |

---

## 3. Core User Journeys

### 3.1 Login → Dashboard

```
Login screen
   ↓ (credentials submitted)
Auth validated, session created
   ↓
Dashboard loads
   → KPI cards: stock health, open POs, supplier OTIF
   → Alert list: Low/Critical SKUs surfaced automatically
```

### 3.2 Detecting & Acting on Low Stock (primary demo journey)

This is the flow described in PRD §8 — the single highest-impact path to walk through live.

```
Dashboard shows a Low/Critical alert for a SKU
   ↓
Manager clicks the alert → Inventory Detail for that SKU
   ↓ (or, directly from the widget)
Manager opens Copilot, asks: "Draft a PO for [SKU]"
   ↓
AI recommends a supplier (scorecard formula) and drafts:
   supplier, quantity, estimated cost, status = Draft
   ↓
Copilot response links to PO Detail / Review screen
   ↓
Manager reviews, edits line items if needed
   ↓
Manager clicks "Approve" (single-tier, no auto-submit)
   ↓
PO status → Issued; action written to audit log
   ↓
Dashboard's "open POs" KPI updates
```

### 3.3 Reviewing Supplier Performance

```
Suppliers List (sorted by score, worst first by default)
   ↓
Manager opens a Supplier Detail
   → Deterministic score displayed (see PRD §7 formula)
   → AI narrative: plain-language explanation of the score
   ↓
Optional: Manager asks Copilot "Why is [Supplier]'s score low?"
   → Response cites the underlying on-time/accuracy/quality/
     responsiveness data, does not re-compute or contradict
     the displayed score
```

### 3.4 Ad-hoc Natural-Language Query (any screen)

```
Manager opens the floating Copilot widget
   ↓
Types a question (e.g., "Which SKUs are critical right now?")
   ↓
Response returned with source citation(s)
   → If ambiguous/out-of-scope: Copilot asks a clarifying
     question instead of guessing
   ↓
Manager can "Expand to full Copilot" to continue in /copilot
```

---

## 4. Screen-Level Detail

### 4.1 Dashboard
- KPI cards: Stock Health, Open POs, Supplier OTIF
- Alert feed: Low/Critical SKUs, most severe first
- Each alert links directly to the relevant Inventory Detail

### 4.2 Inventory List → Detail
- List: filterable by status (All / Healthy / Low / Critical)
- Detail: quantity_on_hand, reorder_threshold, unit_cost, editable fields
- "Draft PO with AI" button on Low/Critical items — pre-fills the Copilot prompt

### 4.3 Suppliers List → Detail
- List: name, computed score, OTIF %, sorted worst-first by default
- Detail: contact info, contract terms, AI-narrated scorecard block (clearly separated from the deterministic score itself)

### 4.4 Purchase Orders List → Detail/Review
- List: grouped by status (Draft / Approved / Issued)
- Detail: editable line items (only while Draft), source-data reference for each item, single "Approve" action
- After approval: read-only view + audit trail entry visible inline (timestamp, user, what was approved)

### 4.5 Copilot (full page)
- Same chat engine as the widget, larger surface for longer sessions
- Message history persists within the session
- Every numeric answer shows an inline citation chip linking to the source record (SKU, supplier, or PO)

---

## 5. Chat Placement Rationale

Per the design discussion, chat is treated as **both** persistent and full-page rather than choosing one:

- **Floating widget** — keeps the Copilot one click away from Inventory/Suppliers/PO screens where a quick question comes up mid-task, without forcing a navigation away from what the manager is looking at.
- **Dedicated `/copilot` page** — needed for the PO-drafting journey (§3.2), which benefits from a larger surface and a persistent transcript, and works better as the "hero" moment to walk through live during the demo.

The two share state: starting a conversation in the widget and expanding it does not lose context.

---

## 6. Out of Scope for This Flow (Deferred)

- Multi-role navigation differences (RBAC-driven sidebar changes) — single role only for demo
- Warehouse Overview / Shipment Tracking screens
- Export flows (PDF/Excel) and a dedicated Audit Log screen
- CSV/Excel import UI (data is seeded once at setup, not imported live)
