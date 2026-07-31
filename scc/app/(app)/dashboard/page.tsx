"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatusTag } from "@/components/status-tag";
import { StatusCard } from "@/components/status-card";

type DashboardData = {
    stockHealth: { HEALTHY: number; LOW: number; CRITICAL: number };
    openPoCount: number;
    avgOtif: number;
    alerts: {
        id: string;
        name: string;
        code: string;
        quantityOnHand: number;
        reorderThreshold: number;
        status: "LOW" | "CRITICAL";
    }[];
};

const RAIL_MAP = { LOW: "amber", CRITICAL: "red" } as const;
const TAG_MAP = { LOW: "LOW", CRITICAL: "CRIT" } as const;

export default function DashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null);

    useEffect(() => {
        fetch("/api/dashboard")
            .then((res) => res.json())
            .then(setData);
    }, []);

    if (!data) return <div className="text-text-muted">Loading...</div>;

    const totalItems = data.stockHealth.HEALTHY + data.stockHealth.LOW + data.stockHealth.CRITICAL;

    return (
        <div>
            <h1 className="font-display text-2xl font-bold mb-6">Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <StatusCard>
                    <div className="text-sm text-text-muted mb-1">Stock Health</div>
                    <div className="font-display text-2xl font-bold mb-2">
                        {data.stockHealth.HEALTHY}/{totalItems} Healthy
                    </div>
                    <div className="flex gap-3 text-xs text-text-muted">
                        <span className="text-signal-amber">{data.stockHealth.LOW} Low</span>
                        <span className="text-signal-red">{data.stockHealth.CRITICAL} Critical</span>
                    </div>
                </StatusCard>

                <StatusCard>
                    <div className="text-sm text-text-muted mb-1">Open POs</div>
                    <div className="font-display text-2xl font-bold">{data.openPoCount}</div>
                </StatusCard>

                <StatusCard>
                    <div className="text-sm text-text-muted mb-1">Supplier OTIF (avg)</div>
                    <div className="font-display text-2xl font-bold">{data.avgOtif}%</div>
                </StatusCard>
            </div>

            <h2 className="font-display text-lg font-bold mb-3">Alerts</h2>
            {data.alerts.length === 0 ? (
                <div className="text-text-muted text-sm">No low or critical stock right now.</div>
            ) : (
                <div className="flex flex-col gap-2">
                    {data.alerts.map((item) => (
                        <Link key={item.id} href={`/inventory/${item.id}`}>
                            <StatusCard rail={RAIL_MAP[item.status]} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <StatusTag value={TAG_MAP[item.status]} />
                                    <span className="font-medium">{item.name}</span>
                                    <span className="font-mono text-xs text-text-muted">{item.code}</span>
                                </div>
                                <span className="text-sm text-text-muted">
                                    {item.quantityOnHand} on hand · reorder at {item.reorderThreshold}
                                </span>
                            </StatusCard>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}