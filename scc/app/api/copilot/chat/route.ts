import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/require-session";
import { askGemini } from "@/lib/gemini";
import { draftPurchaseOrderForItem } from "@/lib/draft-po";

export async function POST(req: Request) {
    const { session, response } = await requireSession();
    if (!session) return response;

    const { message } = await req.json();

    const [items, suppliers, orders] = await Promise.all([
        prisma.inventoryItem.findMany({
            select: { id: true, name: true, code: true, quantityOnHand: true, reorderThreshold: true, status: true },
        }),
        prisma.supplier.findMany({
            select: { id: true, name: true, computedScore: true, onTimeDeliveryPct: true },
        }),
        prisma.purchaseOrder.findMany({
            select: { id: true, status: true, estimatedCost: true, supplier: { select: { name: true } } },
        }),
    ]);

    // ── Detect PO-drafting intent ──────────────────────────────
    const draftMatch = message.match(/(?:draft|create).{0,15}(?:po|purchase order).{0,10}for\s+(.+)/i);

    if (draftMatch) {
        const query = draftMatch[1].trim().toLowerCase();
        const matches = items.filter(
            (i) => i.name.toLowerCase().includes(query) || query.includes(i.name.toLowerCase())
        );

        if (matches.length === 0) {
            const reply = `I couldn't find an item matching "${draftMatch[1].trim()}" in inventory. Could you give me the exact SKU name or code?`;
            return NextResponse.json({ reply });
        }
        if (matches.length > 1) {
            const names = matches.map((m) => m.name).join(", ");
            const reply = `That matches multiple items: ${names}. Which one did you mean?`;
            return NextResponse.json({ reply });
        }

        const { po, item, supplier, quantity, estimatedCost } = await draftPurchaseOrderForItem(
            matches[0].id,
            session.user.id
        );

        await prisma.auditLogEntry.create({
            data: {
                userId: session.user.id,
                actionType: "CHAT_QUERY",
                aiInvolved: true,
                recordType: "Chat",
                recordId: "n/a",
                inputSummary: message,
                outputSummary: `Drafted PO ${po.id} via chat`,
            },
        });

        const reply = `Drafted a purchase order for ${quantity} units of ${item.name} from ${supplier.name} — estimated cost $${estimatedCost.toFixed(2)}. {po:${po.id}}`;
        return NextResponse.json({ reply });
    }

    // ── General Q&A ─────────────────────────────────────────────
    const prompt = `You are a supply chain copilot for a retail company (Chase Value). Answer the manager's question using ONLY the data below — never invent numbers or records that aren't listed here.

If the question is ambiguous or the answer isn't in this data, ask a clarifying question instead of guessing.

When you state a specific number tied to a record, include the record's id in square brackets right after it, like "12 units [${items[0]?.id ?? "id"}]" — this becomes a citation link in the UI.

INVENTORY:
${JSON.stringify(items)}

SUPPLIERS:
${JSON.stringify(suppliers)}

PURCHASE ORDERS:
${JSON.stringify(orders)}

MANAGER'S QUESTION: ${message}`;

    const reply = await askGemini(prompt);

    await prisma.auditLogEntry.create({
        data: {
            userId: session.user.id,
            actionType: "CHAT_QUERY",
            aiInvolved: true,
            recordType: "Chat",
            recordId: "n/a",
            inputSummary: message,
            outputSummary: reply.slice(0, 500),
        },
    });

    return NextResponse.json({ reply });
}