import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/require-session";

export async function GET() {
    const { session, response } = await requireSession();
    if (!session) return response;

    const orders = await prisma.purchaseOrder.findMany({
        include: {
            supplier: { select: { name: true } },
            lines: true,
        },
        orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(orders);
}