"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { StatusTag } from "@/components/status-tag";
import { StatusCard } from "@/components/status-card";

type Line = {
    id: string;
    quantity: number;
    unitCost: string;
    inventoryItem: { name: string; code: string };
};

type PurchaseOrder = {
    id: string;
    status: "DRAFT" | "APPROVED" | "ISSUED";
    estimatedCost: string;
    supplier: { name: string };
    lines: Line[];
    createdBy: { name: string };
    approvedBy: { name: string } | null;
    approvedAt: string | null;
};

const RAIL_MAP = { DRAFT: "amber", APPROVED: "mint", ISSUED: "mint" } as const;

export default function PurchaseOrderDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [po, setPo] = useState<PurchaseOrder | null>(null);
    const [approving, setApproving] = useState(false);

    useEffect(() => {
        fetch(`/api/purchase-orders/${id}`)
            .then((res) => res.json())
            .then(setPo);
    }, [id]);

    async function handleApprove() {
        setApproving(true);
        const res = await fetch(`/api/purchase-orders/${id}/approve`, { method: "POST" });
        if (res.ok) {
            const updated = await res.json();
            setPo((prev) => (prev ? { ...prev, ...updated } : prev));
            // Refetch full detail to get approvedBy relation populated
            fetch(`/api/purchase-orders/${id}`)
                .then((r) => r.json())
                .then(setPo);
        }
        setApproving(false);
    }

    if (!po) return <div className="text-text-muted">Loading...</div>;

    return (
        <div className="max-w-xl">
            <button
                onClick={() => router.push("/purchase-orders")}
                className="text-sm text-text-muted hover:text-brand-cobalt mb-4"
            >
                ← Back to Purchase Orders
            </button>

            <StatusCard rail={RAIL_MAP[po.status]}>
                <div className="flex justify-between items-start mb-3">
                    <span className="font-mono text-xs text-text-muted">{po.id}</span>
                    <StatusTag value={po.status} />
                </div>
                <h1 className="font-display text-xl font-bold mb-1">{po.supplier.name}</h1>
                <div className="text-sm text-text-muted mb-4">
                    Created by {po.createdBy.name}
                </div>

                <div className="border-t border-line-700 pt-3 mb-4">
                    <div className="text-sm font-medium mb-2">Line Items</div>
                    <div className="flex flex-col gap-2">
                        {po.lines.map((line) => (
                            <div key={line.id} className="flex justify-between text-sm text-text-muted">
                                <span>
                                    {line.inventoryItem.name}{" "}
                                    <span className="font-mono text-xs">({line.inventoryItem.code})</span>
                                </span>
                                <span>
                                    {line.quantity} × ${line.unitCost}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="border-t border-line-700 pt-3 mb-4 text-sm text-text-muted">
                    Estimated cost: ${Number(po.estimatedCost).toFixed(2)}
                </div>

                {po.status === "DRAFT" && (
                    <button
                        onClick={handleApprove}
                        disabled={approving}
                        className="bg-brand-cobalt text-ink-900 px-4 py-2 rounded text-sm font-medium"
                    >
                        {approving ? "Approving..." : "Approve"}
                    </button>
                )}

                {po.approvedBy && po.approvedAt && (
                    <div className="border-t border-line-700 pt-3 mt-3 text-sm text-text-muted">
                        Approved by {po.approvedBy.name} on{" "}
                        {new Date(po.approvedAt).toLocaleString()}
                    </div>
                )}
            </StatusCard>
        </div>
    );
}