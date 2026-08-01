import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/require-session";
import { classifyStockStatus, computeSupplierScore } from "@/lib/derived";

type EntityType = "inventory" | "suppliers" | "purchase-orders";
type ImportMode = "append" | "replace";

export async function POST(req: Request) {
    const { session, response } = await requireSession();
    if (!session) return response;

    const { entity, mode, records } = (await req.json()) as {
        entity: EntityType;
        mode: ImportMode;
        records: Record<string, unknown>[];
    };

    const result = { created: 0, updated: 0, skipped: 0, errors: [] as string[] };

    try {
        if (entity === "inventory") {
            if (mode === "replace") {
                await prisma.inventoryItem.deleteMany({});
            }
            for (const [i, r] of records.entries()) {
                const name = String(r.name ?? "").trim();
                const code = String(r.code ?? "").trim();
                const quantityOnHand = Number(r.quantityOnHand);
                const reorderThreshold = Number(r.reorderThreshold);
                const unitCost = Number(r.unitCost);

                if (!name || !code || isNaN(quantityOnHand) || isNaN(reorderThreshold) || isNaN(unitCost)) {
                    result.skipped++;
                    result.errors.push(`Row ${i + 1}: missing/invalid required field(s)`);
                    continue;
                }

                const status = classifyStockStatus(quantityOnHand, reorderThreshold);
                const existing = await prisma.inventoryItem.findUnique({ where: { code } });

                if (existing) {
                    await prisma.inventoryItem.update({
                        where: { code },
                        data: { name, quantityOnHand, reorderThreshold, unitCost, status },
                    });
                    result.updated++;
                } else {
                    await prisma.inventoryItem.create({
                        data: { name, code, quantityOnHand, reorderThreshold, unitCost, status },
                    });
                    result.created++;
                }
            }
        }

        if (entity === "suppliers") {
            if (mode === "replace") {
                await prisma.supplier.deleteMany({});
            }
            for (const [i, r] of records.entries()) {
                const name = String(r.name ?? "").trim();
                const contactEmail = String(r.contactEmail ?? "").trim();
                const onTimeDeliveryPct = Number(r.onTimeDeliveryPct);
                const orderAccuracyPct = Number(r.orderAccuracyPct);
                const qualityScorePct = Number(r.qualityScorePct);
                const responsivenessPct = Number(r.responsivenessPct);

                if (
                    !name ||
                    !contactEmail ||
                    [onTimeDeliveryPct, orderAccuracyPct, qualityScorePct, responsivenessPct].some(isNaN)
                ) {
                    result.skipped++;
                    result.errors.push(`Row ${i + 1}: missing/invalid required field(s)`);
                    continue;
                }

                const computedScore = computeSupplierScore({
                    onTimeDeliveryPct,
                    orderAccuracyPct,
                    qualityScorePct,
                    responsivenessPct,
                });
                const contactPhone = r.contactPhone ? String(r.contactPhone) : null;
                const contractTerms = r.contractTerms ? String(r.contractTerms) : null;

                const existing = await prisma.supplier.findFirst({
                    where: { name: { equals: name, mode: "insensitive" } },
                });

                if (existing) {
                    await prisma.supplier.update({
                        where: { id: existing.id },
                        data: {
                            contactEmail,
                            contactPhone,
                            contractTerms,
                            onTimeDeliveryPct,
                            orderAccuracyPct,
                            qualityScorePct,
                            responsivenessPct,
                            computedScore,
                        },
                    });
                    result.updated++;
                } else {
                    await prisma.supplier.create({
                        data: {
                            name,
                            contactEmail,
                            contactPhone,
                            contractTerms,
                            onTimeDeliveryPct,
                            orderAccuracyPct,
                            qualityScorePct,
                            responsivenessPct,
                            computedScore,
                        },
                    });
                    result.created++;
                }
            }
        }

        if (entity === "purchase-orders") {
            if (mode === "replace") {
                await prisma.purchaseOrderLine.deleteMany({});
                await prisma.purchaseOrder.deleteMany({});
            }
            for (const [i, r] of records.entries()) {
                const supplierName = String(r.supplierName ?? "").trim();
                const itemCode = r.itemCode ? String(r.itemCode).trim() : null;
                const itemName = r.itemName ? String(r.itemName).trim() : null;
                const quantity = Number(r.quantity);
                const unitCost = Number(r.unitCost);

                if (!supplierName || (!itemCode && !itemName) || isNaN(quantity) || isNaN(unitCost)) {
                    result.skipped++;
                    result.errors.push(`Row ${i + 1}: missing/invalid required field(s)`);
                    continue;
                }

                const supplier = await prisma.supplier.findFirst({
                    where: { name: { equals: supplierName, mode: "insensitive" } },
                });
                const item = itemCode
                    ? await prisma.inventoryItem.findUnique({ where: { code: itemCode } })
                    : await prisma.inventoryItem.findFirst({
                        where: { name: { equals: itemName ?? "", mode: "insensitive" } },
                    });

                if (!supplier || !item) {
                    result.skipped++;
                    result.errors.push(
                        `Row ${i + 1}: ${!supplier ? `supplier "${supplierName}" not found` : `item not found`}`
                    );
                    continue;
                }

                const estimatedCost = quantity * unitCost;
                await prisma.purchaseOrder.create({
                    data: {
                        supplierId: supplier.id,
                        status: "DRAFT",
                        aiGenerated: false,
                        estimatedCost,
                        createdById: session.user.id,
                        lines: { create: [{ inventoryItemId: item.id, quantity, unitCost }] },
                    },
                });
                result.created++;
            }
        }

        await prisma.auditLogEntry.create({
            data: {
                userId: session.user.id,
                actionType: "PO_DRAFTED",
                aiInvolved: true,
                recordType: entity,
                recordId: "bulk-import",
                inputSummary: `Import ${records.length} ${entity} records (${mode} mode)`,
                outputSummary: `Created: ${result.created}, Updated: ${result.updated}, Skipped: ${result.skipped}`,
            },
        });

        return NextResponse.json(result);
    } catch (err) {
        return NextResponse.json(
            { error: (err as Error).message, ...result },
            { status: 400 }
        );
    }
}