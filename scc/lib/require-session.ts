import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "./auth";

export async function requireSession() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
        return {
            session: null,
            response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
        };
    }
    return { session, response: null };
}