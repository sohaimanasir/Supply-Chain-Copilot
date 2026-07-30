Schema — Supply Chain Copilot MVP
=================================

FieldDetailSourcePRD.md §10, techstack.md §3 (Prisma + Postgres)ScopeInventory, Suppliers, Purchase Orders, Auth, Audit LogDateJuly 30, 2026

1\. Entity Overview
-------------------

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   User ─────────────┐                     │ created_by / approved_by                     ▼                PurchaseOrder ──────► Supplier                     │                    ▲                     │ line items         │ recommended by (scorecard)                     ▼                    │                InventoryItem ────────────┘                     │                     ▼                AuditLogEntry (references any of the above via action_type + record_id)   `

Single-tenant: no organization\_id / tenant scoping in the MVP — confirmed single-enterprise deployment (PRD §3.3 open item #2 notwithstanding; revisit if multi-tenant is confirmed later).

2\. Prisma Schema
-----------------

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   // schema.prisma  generator client {    provider = "prisma-client-js"  }  datasource db {    provider = "postgresql"    url      = env("DATABASE_URL")  }  // ─────────────────────────────────────────────  // Enums  // ─────────────────────────────────────────────  enum Role {    MANAGER // combined Supply Chain / Procurement Manager — single role for demo  }  enum StockStatus {    HEALTHY    LOW    CRITICAL  }  enum PoStatus {    DRAFT    APPROVED    ISSUED  }  enum ActionType {    PO_DRAFTED    PO_APPROVED    SCORECARD_GENERATED    CHAT_QUERY  }  // ─────────────────────────────────────────────  // Core entities  // ─────────────────────────────────────────────  model User {    id            String   @id @default(cuid())    name          String    email         String   @unique    passwordHash  String    role          Role     @default(MANAGER)    createdAt     DateTime @default(now())    purchaseOrdersCreated  PurchaseOrder[] @relation("CreatedBy")    purchaseOrdersApproved PurchaseOrder[] @relation("ApprovedBy")    auditLogEntries        AuditLogEntry[]  }  model InventoryItem {    id               String      @id @default(cuid())    name             String    code             String      @unique          // SKU code    quantityOnHand   Int    reorderThreshold Int    unitCost         Decimal     @db.Decimal(10, 2)    status           StockStatus @default(HEALTHY) // derived on write, see §3    purchaseOrderLines PurchaseOrderLine[]    createdAt DateTime @updatedAt    updatedAt DateTime @updatedAt    @@index([status])  }  model Supplier {    id             String   @id @default(cuid())    name           String    contactEmail   String    contactPhone   String?    contractTerms  String?  @db.Text    // Deterministic scorecard inputs (see §4 formula)    onTimeDeliveryPct Decimal @db.Decimal(5, 2) // 0–100    orderAccuracyPct  Decimal @db.Decimal(5, 2) // 0–100    qualityScorePct   Decimal @db.Decimal(5, 2) // 0–100    responsivenessPct Decimal @db.Decimal(5, 2) // 0–100    computedScore  Decimal  @db.Decimal(5, 2)  // derived, never AI-set — see §4    scoreUpdatedAt DateTime @default(now())    purchaseOrders PurchaseOrder[]    createdAt DateTime @default(now())    updatedAt DateTime @updatedAt  }  model PurchaseOrder {    id          String   @id @default(cuid())    supplierId  String    supplier    Supplier @relation(fields: [supplierId], references: [id])    status      PoStatus @default(DRAFT)    aiGenerated Boolean  @default(true) // false only if manually created (not built in MVP UI, but modeled)    estimatedCost Decimal @db.Decimal(10, 2)    createdById String    createdBy   User     @relation("CreatedBy", fields: [createdById], references: [id])    approvedById String?    approvedBy   User?    @relation("ApprovedBy", fields: [approvedById], references: [id])    approvedAt   DateTime?    lines PurchaseOrderLine[]    createdAt DateTime @default(now())    updatedAt DateTime @updatedAt    @@index([status])  }  model PurchaseOrderLine {    id              String        @id @default(cuid())    purchaseOrderId String    purchaseOrder   PurchaseOrder @relation(fields: [purchaseOrderId], references: [id], onDelete: Cascade)    inventoryItemId String    inventoryItem   InventoryItem @relation(fields: [inventoryItemId], references: [id])    quantity  Int    unitCost  Decimal @db.Decimal(10, 2) // snapshot at draft time — not a live FK to InventoryItem.unitCost  }  // ─────────────────────────────────────────────  // Audit  // ─────────────────────────────────────────────  model AuditLogEntry {    id            String     @id @default(cuid())    userId        String    user          User       @relation(fields: [userId], references: [id])    actionType    ActionType    aiInvolved    Boolean    @default(true)    recordType    String     // "PurchaseOrder" | "InventoryItem" | "Supplier"    recordId      String    inputSummary  String     @db.Text // prompt / triggering context    outputSummary String     @db.Text // what the AI produced or what action occurred    createdAt DateTime @default(now())    @@index([recordType, recordId])    @@index([createdAt])  }   `

3\. Derived Fields — Rules (not stored as AI output)
----------------------------------------------------

FieldRuleOwnerInventoryItem.statusCRITICAL if quantityOnHand <= reorderThreshold \* 0.5; LOW if quantityOnHand <= reorderThreshold; else HEALTHYApp logic on every write, not AISupplier.computedScoreSee formula in §4App logic, recalculated whenever inputs change

**Confirm before build:** the CRITICAL threshold multiplier (0.5×) is not specified in the BRD — it's a reasonable default for the demo but should be sanity-checked against the seed data so the demo actually shows both Low and Critical states.

4\. Supplier Scorecard Formula
------------------------------

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   computedScore =      (onTimeDeliveryPct * 0.40) +      (orderAccuracyPct  * 0.30) +      (qualityScorePct   * 0.20) +      (responsivenessPct * 0.10)   `

Per PRD §7 / BRD §6: this is a **proposed, unconfirmed** weighting. Implement it as a single named function (e.g., computeSupplierScore()) rather than inlined math, so the weights can be changed in one place once Procurement confirms them.

5\. Seed Data Requirements
--------------------------

For the demo to tell a convincing story, the seed dataset needs deliberate variety, not just realistic-looking rows:

*   At least 2–3 InventoryItem rows landing in each status bucket (Healthy / Low / Critical)
    
*   At least 4–5 Supplier rows with a spread of scores (at least one clearly "at risk" supplier to narrate)
    
*   1–2 pre-existing PurchaseOrder rows in ISSUED status (so the PO list isn't empty on first load), plus the live demo creates a new DRAFT → APPROVED one during the walkthrough
    
*   One seed User (the Manager) with a known login for the demo
    

**Open item (PRD §4.4):** exact data volume (# SKUs, suppliers, POs/month) isn't specified in the BRD. Low stakes for a demo, but the seed file should be sized to look plausible on screen — recommend 15–25 SKUs, 5–8 suppliers, 5–10 historical POs.

6\. What's Intentionally Not Modeled
------------------------------------

*   Shipment entity — exists in the full BRD data model (§10) but out of scope for the demo build (PRD §3.2)
    
*   Multi-tenant fields (organizationId, tenant-scoped uniqueness) — single-enterprise only
    
*   RBAC beyond a single Role enum value — full 5-role matrix deferred (PRD §3.2)
    
*   Soft deletes / versioning on any entity — not needed for a 1–2 day demo