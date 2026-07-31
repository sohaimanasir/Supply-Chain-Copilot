"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatusTag } from "@/components/status-tag";
import { StatusCard } from "@/components/status-card";

type Supplier = {
    id: string;
    name: string;
    contactEmail: string;
    onTimeDeliveryPct: string;
    computedScore: string;
};

function scoreBand(score: number): "STRONG" | "WATCH" | "AT RISK" {
    if (score >= 90) return "STRONG";
    if (score >= 75) return "WATCH";
    return "AT RISK";
}

const RAIL_MAP = { STRONG: "mint", WATCH: "amber", "AT RISK": "red" } as const;

export default function SuppliersPage() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/suppliers")
            .then((res) => res.json())
            .then((data) => {
                setSuppliers(data);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="text-text-muted">Loading...</div>;

    return (
        <div>
            <h1 className="font-display text-2xl font-bold mb-4">Suppliers</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {suppliers.map((s) => {
                    const band = scoreBand(Number(s.computedScore));
                    return (
                        <Link key={s.id} href={`/suppliers/${s.id}`}>
                            <StatusCard rail={RAIL_MAP[band]}>
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-mono text-xs text-text-muted">
                                        OTIF {s.onTimeDeliveryPct}%
                                    </span>
                                    <StatusTag value={band} />
                                </div>
                                <div className="font-display font-bold mb-1">{s.name}</div>
                                <div className="text-sm text-text-muted">
                                    Score: {s.computedScore}
                                </div>
                            </StatusCard>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}