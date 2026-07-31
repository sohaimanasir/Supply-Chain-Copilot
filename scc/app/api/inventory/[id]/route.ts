import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/require-session";
import { classifyStockStatus } from "@/lib/derived";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { session, response } = await requireSession();
    if (!session) return response;

    const { id } = await params;
    const item = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!item) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(item);
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { session, response } = await requireSession();
    if (!session) return response;

    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!existing) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const quantityOnHand = body.quantityOnHand ?? existing.quantityOnHand;
    const reorderThreshold = body.reorderThreshold ?? existing.reorderThreshold;
    const status = classifyStockStatus(quantityOnHand, reorderThreshold);

    const updated = await prisma.inventoryItem.update({
        where: { id },
        data: {
            quantityOnHand,
            reorderThreshold,
            unitCost: body.unitCost ?? existing.unitCost,
            status,
        },
    });

    return NextResponse.json(updated);
}