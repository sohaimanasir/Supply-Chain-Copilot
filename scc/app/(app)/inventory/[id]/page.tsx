"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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

export default function InventoryDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [item, setItem] = useState<InventoryItem | null>(null);
    const [quantityOnHand, setQuantityOnHand] = useState(0);
    const [reorderThreshold, setReorderThreshold] = useState(0);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetch(`/api/inventory/${id}`)
            .then((res) => res.json())
            .then((data) => {
                setItem(data);
                setQuantityOnHand(data.quantityOnHand);
                setReorderThreshold(data.reorderThreshold);
            });
    }, [id]);

    async function handleSave() {
        setSaving(true);
        const res = await fetch(`/api/inventory/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ quantityOnHand, reorderThreshold }),
        });
        const updated = await res.json();
        setItem(updated);
        setSaving(false);
    }

    if (!item) return <div className="text-text-muted">Loading...</div>;

    return (
        <div className="max-w-xl">
            <button
                onClick={() => router.push("/inventory")}
                className="text-sm text-text-muted hover:text-brand-cobalt mb-4"
            >
                ← Back to Inventory
            </button>

            <StatusCard rail={RAIL_MAP[item.status]}>
                <div className="flex justify-between items-start mb-3">
                    <span className="font-mono text-xs text-text-muted">{item.code}</span>
                    <StatusTag value={TAG_MAP[item.status]} />
                </div>
                <h1 className="font-display text-xl font-bold mb-4">{item.name}</h1>

                <div className="flex flex-col gap-3 mb-4">
                    <label className="text-sm text-text-muted">
                        Quantity on hand
                        <input
                            type="number"
                            value={quantityOnHand}
                            onChange={(e) => setQuantityOnHand(Number(e.target.value))}
                            className="block w-full mt-1 bg-ink-900 border border-line-700 rounded px-2 py-1 text-text-primary"
                        />
                    </label>
                    <label className="text-sm text-text-muted">
                        Reorder threshold
                        <input
                            type="number"
                            value={reorderThreshold}
                            onChange={(e) => setReorderThreshold(Number(e.target.value))}
                            className="block w-full mt-1 bg-ink-900 border border-line-700 rounded px-2 py-1 text-text-primary"
                        />
                    </label>
                    <div className="text-sm text-text-muted">Unit cost: ${item.unitCost}</div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-brand-cobalt text-ink-900 px-4 py-2 rounded text-sm font-medium"
                    >
                        {saving ? "Saving..." : "Save"}
                    </button>
                    {(item.status === "LOW" || item.status === "CRITICAL") && (
                        <button
                            disabled
                            title="Wired up in Phase 4"
                            className="border border-line-700 text-text-muted px-4 py-2 rounded text-sm cursor-not-allowed"
                        >
                            Draft PO with AI
                        </button>
                    )}
                </div>
            </StatusCard>
        </div>
    );
}