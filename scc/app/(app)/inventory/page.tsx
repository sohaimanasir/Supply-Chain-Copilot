"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatusTag } from "@/components/status-tag";
import { StatusCard } from "@/components/status-card";

type InventoryItem = {
    id: string;
    name: string;
    code: string;
    quantityOnHand: number;
    reorderThreshold: number;
    unitCost: string;
    status: "HEALTHY" | "LOW" | "CRITICAL";
};

const RAIL_MAP = { HEALTHY: "mint", LOW: "amber", CRITICAL: "red" } as const;
const TAG_MAP = { HEALTHY: "HEALTHY", LOW: "LOW", CRITICAL: "CRIT" } as const;

export default function InventoryPage() {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [filter, setFilter] = useState<"ALL" | "HEALTHY" | "LOW" | "CRITICAL">("ALL");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/inventory")
            .then((res) => res.json())
            .then((data) => {
                setItems(data);
                setLoading(false);
            });
    }, []);

    const filtered = filter === "ALL" ? items : items.filter((i) => i.status === filter);

    if (loading) return <div className="text-text-muted">Loading...</div>;

    return (
        <div>
            <h1 className="font-display text-2xl font-bold mb-4">Inventory</h1>

            <div className="flex gap-2 mb-4">
                {(["ALL", "HEALTHY", "LOW", "CRITICAL"] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-3 py-1 rounded text-sm border ${filter === f
                                ? "border-brand-cobalt text-brand-cobalt"
                                : "border-line-700 text-text-muted"
                            }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((item) => (
                    <Link key={item.id} href={`/inventory/${item.id}`}>
                        <StatusCard rail={RAIL_MAP[item.status]}>
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-mono text-xs text-text-muted">{item.code}</span>
                                <StatusTag value={TAG_MAP[item.status]} />
                            </div>
                            <div className="font-display font-bold mb-1">{item.name}</div>
                            <div className="text-sm text-text-muted">
                                {item.quantityOnHand} on hand · reorder at {item.reorderThreshold}
                            </div>
                        </StatusCard>
                    </Link>
                ))}
            </div>
        </div>
    );
}