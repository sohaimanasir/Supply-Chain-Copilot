import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { hashPassword } from "better-auth/crypto";
import { classifyStockStatus, computeSupplierScore } from "../lib/derived";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("Seeding Chase Value data...");

    // ── Manager user ──────────────────────────
    // ── Manager user (Better Auth: user + linked credential account) ──
    const manager = await prisma.user.create({
        data: {
            name: "Alex Morgan",
            email: "alex.morgan@chasevalue.com",
            emailVerified: true,
            role: "MANAGER",
        },
    });

    const passwordHash = await hashPassword("chasevalue123");
    await prisma.account.create({
        data: {
            userId: manager.id,
            accountId: manager.id,
            providerId: "credential",
            password: passwordHash,
        },
    });

    // ── Suppliers (6) ─────────────────────────
    const supplierData = [
        { name: "Meridian Household Goods Co.", contactEmail: "sales@meridianhg.com", onTimeDeliveryPct: 94.5, orderAccuracyPct: 97.0, qualityScorePct: 92.0, responsivenessPct: 88.0 },
        { name: "Blue Harbor Apparel Distribution", contactEmail: "orders@blueharborapparel.com", onTimeDeliveryPct: 81.0, orderAccuracyPct: 89.5, qualityScorePct: 90.0, responsivenessPct: 76.0 },
        { name: "Crestline Electronics Supply", contactEmail: "b2b@crestlinesupply.com", onTimeDeliveryPct: 97.2, orderAccuracyPct: 95.0, qualityScorePct: 96.5, responsivenessPct: 93.0 },
        { name: "Summit Personal Care Wholesale", contactEmail: "accounts@summitpcw.com", onTimeDeliveryPct: 88.0, orderAccuracyPct: 91.0, qualityScorePct: 85.5, responsivenessPct: 82.0 },
        { name: "Ridgeline Seasonal & Gifting", contactEmail: "wholesale@ridgelineseasonal.com", onTimeDeliveryPct: 58.0, orderAccuracyPct: 80.0, qualityScorePct: 78.0, responsivenessPct: 65.0 },
        { name: "Pacific Pantry Foods Distribution", contactEmail: "orders@pacificpantry.com", onTimeDeliveryPct: 91.0, orderAccuracyPct: 93.5, qualityScorePct: 89.0, responsivenessPct: 90.0 },
    ];

    const suppliers = [];
    for (const s of supplierData) {
        const computedScore = computeSupplierScore(s);
        suppliers.push(
            await prisma.supplier.create({
                data: { ...s, contactPhone: null, contractTerms: "Net 30", computedScore },
            })
        );
    }

    // ── Inventory items (20 SKUs across retail categories) ──
    const itemData = [
        { name: "Stainless Steel Mixing Bowl Set", code: "CV-1001", quantityOnHand: 420, reorderThreshold: 150, unitCost: 8.5 },
        { name: "Cotton Bath Towel, White", code: "CV-1002", quantityOnHand: 60, reorderThreshold: 200, unitCost: 4.25 },
        { name: "LED Desk Lamp, Adjustable", code: "CV-1003", quantityOnHand: 18, reorderThreshold: 80, unitCost: 12.0 },
        { name: "Men's Basic Crew T-Shirt, Pack of 3", code: "CV-1004", quantityOnHand: 310, reorderThreshold: 120, unitCost: 6.75 },
        { name: "Women's Fleece Zip Hoodie", code: "CV-1005", quantityOnHand: 45, reorderThreshold: 100, unitCost: 11.5 },
        { name: "USB-C Charging Cable, 6ft", code: "CV-1006", quantityOnHand: 9, reorderThreshold: 60, unitCost: 3.1 },
        { name: "Bluetooth Earbuds, Basic", code: "CV-1007", quantityOnHand: 130, reorderThreshold: 90, unitCost: 14.99 },
        { name: "Shampoo, 2-in-1, 24oz", code: "CV-1008", quantityOnHand: 275, reorderThreshold: 100, unitCost: 3.4 },
        { name: "Toothpaste, Whitening, Twin Pack", code: "CV-1009", quantityOnHand: 22, reorderThreshold: 80, unitCost: 2.6 },
        { name: "Laundry Detergent, 100oz", code: "CV-1010", quantityOnHand: 190, reorderThreshold: 70, unitCost: 9.2 },
        { name: "Holiday String Lights, 100ct", code: "CV-1011", quantityOnHand: 5, reorderThreshold: 60, unitCost: 5.75 },
        { name: "Gift Wrap Bundle, Assorted", code: "CV-1012", quantityOnHand: 140, reorderThreshold: 50, unitCost: 4.0 },
        { name: "Ceramic Coffee Mug, 12oz", code: "CV-1013", quantityOnHand: 350, reorderThreshold: 120, unitCost: 2.9 },
        { name: "Non-Stick Frying Pan, 10in", code: "CV-1014", quantityOnHand: 30, reorderThreshold: 60, unitCost: 13.4 },
        { name: "Kids' Graphic Tee, Assorted", code: "CV-1015", quantityOnHand: 15, reorderThreshold: 90, unitCost: 5.1 },
        { name: "Throw Blanket, Fleece", code: "CV-1016", quantityOnHand: 210, reorderThreshold: 80, unitCost: 7.8 },
        { name: "Canned Soup, Chicken Noodle, 12pk", code: "CV-1017", quantityOnHand: 480, reorderThreshold: 200, unitCost: 10.5 },
        { name: "Snack Bar, Variety Box, 24ct", code: "CV-1018", quantityOnHand: 40, reorderThreshold: 150, unitCost: 8.9 },
        { name: "Phone Case, Universal Fit", code: "CV-1019", quantityOnHand: 8, reorderThreshold: 70, unitCost: 2.2 },
        { name: "Reusable Water Bottle, 32oz", code: "CV-1020", quantityOnHand: 95, reorderThreshold: 90, unitCost: 4.6 },
    ];

    const items = [];
    for (const i of itemData) {
        const status = classifyStockStatus(i.quantityOnHand, i.reorderThreshold);
        items.push(await prisma.inventoryItem.create({ data: { ...i, status } }));
    }

    // ── Purchase Orders (8, across DRAFT/APPROVED/ISSUED) ──
    const poPlans = [
        { supplier: suppliers[2], status: "ISSUED", items: [items[5], items[6]], approved: true },
        { supplier: suppliers[0], status: "ISSUED", items: [items[0], items[12]], approved: true },
        { supplier: suppliers[1], status: "APPROVED", items: [items[3], items[4], items[14]], approved: true },
        { supplier: suppliers[3], status: "APPROVED", items: [items[7], items[8]], approved: true },
        { supplier: suppliers[5], status: "APPROVED", items: [items[16], items[17]], approved: true },
        { supplier: suppliers[4], status: "DRAFT", items: [items[10], items[11]], approved: false },
        { supplier: suppliers[2], status: "DRAFT", items: [items[18]], approved: false },
        { supplier: suppliers[3], status: "DRAFT", items: [items[9]], approved: false },
    ] as const;

    for (const plan of poPlans) {
        const lines = plan.items.map((item) => ({
            inventoryItemId: item.id,
            quantity: Math.max(plan.status === "DRAFT" ? 40 : 80, item.reorderThreshold),
            unitCost: item.unitCost,
        }));
        const estimatedCost = lines.reduce((sum, l) => sum + l.quantity * Number(l.unitCost), 0);

        await prisma.purchaseOrder.create({
            data: {
                supplierId: plan.supplier.id,
                status: plan.status,
                aiGenerated: true,
                estimatedCost,
                createdById: manager.id,
                approvedById: plan.approved ? manager.id : null,
                approvedAt: plan.approved ? new Date() : null,
                lines: { create: lines },
            },
        });
    }

    console.log("Seed complete.");
    console.log(`Manager login: alex.morgan@chasevalue.com / ChaseValue123!`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });