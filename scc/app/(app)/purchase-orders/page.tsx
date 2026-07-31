"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatusTag } from "@/components/status-tag";
import { StatusCard } from "@/components/status-card";

type PurchaseOrder = {
    id: string;
    status: "DRAFT" | "APPROVED" | "ISSUED";
    estimatedCost: string;
    supplier: { name: string };
    lines: { id: string }[];
};

const RAIL_MAP = { DRAFT: "amber", APPROVED: "mint", ISSUED: "mint" } as const;
const GROUPS = ["DRAFT", "APPROVED", "ISSUED"] as const;

export default function PurchaseOrdersPage() {
    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/purchase-orders")
            .then((res) => res.json())
            .then((data) => {
                setOrders(data);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="text-text-muted">Loading...</div>;

    return (
        <div>
            <h1 className="font-display text-2xl font-bold mb-6">Purchase Orders</h1>

            {GROUPS.map((group) => {
                const groupOrders = orders.filter((o) => o.status === group);
                if (groupOrders.length === 0) return null;

                return (
                    <div key={group} className="mb-8">
                        <h2 className="font-display text-sm font-bold text-text-muted uppercase tracking-wide mb-3">
                            {group} ({groupOrders.length})
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {groupOrders.map((po) => (
                                <Link key={po.id} href={`/purchase-orders/${po.id}`}>
                                    <StatusCard rail={RAIL_MAP[po.status]}>
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-mono text-xs text-text-muted">
                                                {po.lines.length} line{po.lines.length !== 1 ? "s" : ""}
                                            </span>
                                            <StatusTag value={po.status} />
                                        </div>
                                        <div className="font-display font-bold mb-1">{po.supplier.name}</div>
                                        <div className="text-sm text-text-muted">
                                            Est. cost: ${Number(po.estimatedCost).toFixed(2)}
                                        </div>
                                    </StatusCard>
                                </Link>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}