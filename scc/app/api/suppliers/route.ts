import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/require-session";

export async function GET() {
    const { session, response } = await requireSession();
    if (!session) return response;

    const suppliers = await prisma.supplier.findMany({
        orderBy: { computedScore: "asc" }, // worst-first, per AppFlow §4.3
    });

    return NextResponse.json(suppliers);
}