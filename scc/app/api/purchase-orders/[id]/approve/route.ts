import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/require-session";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { session, response } = await requireSession();
    if (!session) return response;

    const { id } = await params;
    const po = await prisma.purchaseOrder.findUnique({ where: { id } });
    if (!po) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (po.status !== "DRAFT") {
        return NextResponse.json(
            { error: "Only DRAFT purchase orders can be approved" },
            { status: 400 }
        );
    }

    const [updated] = await prisma.$transaction([
        prisma.purchaseOrder.update({
            where: { id },
            data: {
                status: "ISSUED",
                approvedById: session.user.id,
                approvedAt: new Date(),
            },
        }),
        prisma.auditLogEntry.create({
            data: {
                userId: session.user.id,
                actionType: "PO_APPROVED",
                aiInvolved: false,
                recordType: "PurchaseOrder",
                recordId: id,
                inputSummary: `Manager approved PO ${id}`,
                outputSummary: `Status changed to ISSUED`,
            },
        }),
    ]);

    return NextResponse.json(updated);
}