import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/require-session";

export async function GET() {
    const { session, response } = await requireSession();
    if (!session) return response;

    const [statusCounts, openPoCount, suppliers, alerts] = await Promise.all([
        prisma.inventoryItem.groupBy({
            by: ["status"],
            _count: { status: true },
        }),
        prisma.purchaseOrder.count({
            where: { status: { in: ["DRAFT", "APPROVED"] } },
        }),
        prisma.supplier.findMany({ select: { onTimeDeliveryPct: true } }),
        prisma.inventoryItem.findMany({
            where: { status: { in: ["LOW", "CRITICAL"] } },
            orderBy: [{ status: "asc" }, { quantityOnHand: "asc" }], // CRITICAL sorts before LOW alphabetically — good, matches "most severe first"
            take: 10,
        }),
    ]);

    const stockHealth = { HEALTHY: 0, LOW: 0, CRITICAL: 0 } as Record<string, number>;
    statusCounts.forEach((s) => {
        stockHealth[s.status] = s._count.status;
    });

    const avgOtif =
        suppliers.reduce((sum, s) => sum + Number(s.onTimeDeliveryPct), 0) / suppliers.length;

    return NextResponse.json({
        stockHealth,
        openPoCount,
        avgOtif: Math.round(avgOtif * 10) / 10,
        alerts,
    });
}