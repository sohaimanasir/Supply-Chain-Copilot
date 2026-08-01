import { prisma } from "./prisma";

export async function draftPurchaseOrderForItem(itemId: string, userId: string) {
    const item = await prisma.inventoryItem.findUnique({ where: { id: itemId } });
    if (!item) throw new Error("Inventory item not found");

    const topSupplier = await prisma.supplier.findFirst({
        orderBy: { computedScore: "desc" },
    });
    if (!topSupplier) throw new Error("No suppliers available");

    const targetLevel = item.reorderThreshold * 2;
    const quantity = Math.max(targetLevel - item.quantityOnHand, item.reorderThreshold);
    const estimatedCost = quantity * Number(item.unitCost);

    const po = await prisma.$transaction(async (tx) => {
        const created = await tx.purchaseOrder.create({
            data: {
                supplierId: topSupplier.id,
                status: "DRAFT",
                aiGenerated: true,
                estimatedCost,
                createdById: userId,
                lines: {
                    create: [{ inventoryItemId: item.id, quantity, unitCost: item.unitCost }],
                },
            },
        });

        await tx.auditLogEntry.create({
            data: {
                userId,
                actionType: "PO_DRAFTED",
                aiInvolved: true,
                recordType: "PurchaseOrder",
                recordId: created.id,
                inputSummary: `Draft PO for ${item.name} (${item.code})`,
                outputSummary: `Supplier: ${topSupplier.name}, Qty: ${quantity}, Est. cost: $${estimatedCost.toFixed(2)}`,
            },
        });

        return created;
    });

    return { po, item, supplier: topSupplier, quantity, estimatedCost };
}