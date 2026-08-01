import { NextResponse } from "next/server";
import { requireSession } from "@/lib/require-session";
import { parseCsv, parseXlsx, parsePdfToText } from "@/lib/parse-file";

export async function POST(req: Request) {
    const { session, response } = await requireSession();
    if (!session) return response;

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop()?.toLowerCase();

    try {
        if (ext === "csv") {
            const rows = await parseCsv(buffer);
            return NextResponse.json({ type: "rows", data: rows });
        }
        if (ext === "xlsx" || ext === "xls") {
            const rows = await parseXlsx(buffer);
            return NextResponse.json({ type: "rows", data: rows });
        }
        if (ext === "pdf") {
            const text = await parsePdfToText(buffer);
            return NextResponse.json({ type: "text", data: text });
        }
        return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 400 });
    }
}