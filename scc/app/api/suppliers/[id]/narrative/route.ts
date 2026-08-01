import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/require-session";
import { askGemini } from "@/lib/gemini";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { session, response } = await requireSession();
    if (!session) return response;

    const { id } = await params;
    const supplier = await prisma.supplier.findUnique({ where: { id } });
    if (!supplier) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const prompt = `You are explaining a supplier performance score to a retail supply chain manager. The score below is ALREADY COMPUTED and FINAL — do not recalculate it, do not state a different number, do not second-guess it. Your only job is to explain in 2-3 plain-language sentences WHY the score is what it is, based on the four inputs.

Supplier: ${supplier.name}
Computed score (final, do not alter): ${supplier.computedScore}/100
On-time delivery: ${supplier.onTimeDeliveryPct}%
Order accuracy: ${supplier.orderAccuracyPct}%
Quality: ${supplier.qualityScorePct}%
Responsiveness: ${supplier.responsivenessPct}%

Note the weighting: on-time delivery counts most (40%), then order accuracy (30%), quality (20%), responsiveness (10%).`;

    const narrative = await askGemini(prompt);

    await prisma.auditLogEntry.create({
        data: {
            userId: session.user.id,
            actionType: "SCORECARD_GENERATED",
            aiInvolved: true,
            recordType: "Supplier",
            recordId: id,
            inputSummary: `Narrate score for ${supplier.name}`,
            outputSummary: narrative.slice(0, 500),
        },
    });

    return NextResponse.json({ narrative });
}