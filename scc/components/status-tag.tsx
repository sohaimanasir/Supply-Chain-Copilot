type StatusTagValue =
    | "HEALTHY"
    | "LOW"
    | "CRIT"
    | "DRAFT"
    | "APPROVED"
    | "ISSUED"
    | "STRONG"
    | "WATCH"
    | "AT RISK";

const STATUS_COLOR_MAP: Record<StatusTagValue, string> = {
    HEALTHY: "bg-signal-mint text-ink-900",
    LOW: "bg-signal-amber text-ink-900",
    CRIT: "bg-signal-red text-ink-900",
    DRAFT: "bg-signal-amber text-ink-900",
    APPROVED: "bg-signal-mint text-ink-900",
    ISSUED: "bg-signal-mint text-ink-900",
    STRONG: "bg-signal-mint text-ink-900",
    WATCH: "bg-signal-amber text-ink-900",
    "AT RISK": "bg-signal-red text-ink-900",
};

export function StatusTag({ value }: { value: StatusTagValue }) {
    return (
        <span
            className={`inline-block font-mono text-xs font-medium uppercase tracking-wider px-2 py-0.5 rounded-[2px] ${STATUS_COLOR_MAP[value]}`}
        >
            {value}
        </span>
    );
}