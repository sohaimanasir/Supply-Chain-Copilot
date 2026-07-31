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
    const supplier = await prisma.supplier.findUnique({ where: { id } });
    if (!supplier) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(supplier);
}