"use client";

import { usePathname } from "next/navigation";
import { CopilotWidget } from "./copilot-widget";

export function CopilotWidgetGate() {
    const pathname = usePathname();
    if (pathname === "/copilot") return null;
    return <CopilotWidget />;
}