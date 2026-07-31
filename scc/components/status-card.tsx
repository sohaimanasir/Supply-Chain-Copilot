import { ReactNode } from "react";

type RailColor = "mint" | "amber" | "red" | "none";

const RAIL_COLOR_MAP: Record<RailColor, string> = {
    mint: "border-l-signal-mint",
    amber: "border-l-signal-amber",
    red: "border-l-signal-red",
    none: "border-l-transparent",
};

export function StatusCard({
    rail = "none",
    children,
    className = "",
}: {
    rail?: RailColor;
    children: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={`bg-ink-700 border border-line-700 border-l-4 ${RAIL_COLOR_MAP[rail]} rounded-md p-4 ${className}`}
        >
            {children}
        </div>
    );
}