import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/require-session";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { session, response } = await requireSession();
    if (!session) return response;

    const { id } = await params;
    const po = await prisma.purchaseOrder.findUnique({
        where: { id },
        include: {
            supplier: true,
            lines: { include: { inventoryItem: true } },
            createdBy: { select: { name: true } },
            approvedBy: { select: { name: true } },
        },
    });
    if (!po) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(po);
}