import { NextResponse } from "next/server";
import { requireSession } from "@/lib/require-session";
import { draftPurchaseOrderForItem } from "@/lib/draft-po";
import { askGemini } from "@/lib/gemini";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { session, response } = await requireSession();
    if (!session) return response;

    const { id } = await params;

    try {
        const { po, item, supplier, quantity, estimatedCost } =
            await draftPurchaseOrderForItem(id, session.user.id);

        const summary = await askGemini(
            `Write ONE short sentence (max 25 words) confirming a draft purchase order was created. Facts: ${quantity} units of "${item.name}" from ${supplier.name}, estimated cost $${estimatedCost.toFixed(2)}. Do not invent any other details.`
        );

        return NextResponse.json({ poId: po.id, summary });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 400 });
    }
}