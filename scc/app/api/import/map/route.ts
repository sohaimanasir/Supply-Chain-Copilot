import { NextResponse } from "next/server";
import { requireSession } from "@/lib/require-session";
import { mapRowsToSchema, EntityType } from "@/lib/import-mapping";

export async function POST(req: Request) {
    const { session, response } = await requireSession();
    if (!session) return response;

    const { entity, parsed } = await req.json();

    try {
        const mapped = await mapRowsToSchema(entity as EntityType, parsed);
        return NextResponse.json({ mapped });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 400 });
    }
}