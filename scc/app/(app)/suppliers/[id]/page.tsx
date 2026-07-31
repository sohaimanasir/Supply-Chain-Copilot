"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { StatusTag } from "@/components/status-tag";
import { StatusCard } from "@/components/status-card";

type Supplier = {
    id: string;
    name: string;
    contactEmail: string;
    contactPhone: string | null;
    contractTerms: string | null;
    onTimeDeliveryPct: string;
    orderAccuracyPct: string;
    qualityScorePct: string;
    responsivenessPct: string;
    computedScore: string;
};

function scoreBand(score: number): "STRONG" | "WATCH" | "AT RISK" {
    if (score >= 90) return "STRONG";
    if (score >= 75) return "WATCH";
    return "AT RISK";
}

const RAIL_MAP = { STRONG: "mint", WATCH: "amber", "AT RISK": "red" } as const;

export default function SupplierDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [supplier, setSupplier] = useState<Supplier | null>(null);

    useEffect(() => {
        fetch(`/api/suppliers/${id}`)
            .then((res) => res.json())
            .then(setSupplier);
    }, [id]);

    if (!supplier) return <div className="text-text-muted">Loading...</div>;

    const band = scoreBand(Number(supplier.computedScore));

    return (
        <div className="max-w-xl">
            <button
                onClick={() => router.push("/suppliers")}
                className="text-sm text-text-muted hover:text-brand-cobalt mb-4"
            >
                ← Back to Suppliers
            </button>

            <StatusCard rail={RAIL_MAP[band]}>
                <div className="flex justify-between items-start mb-3">
                    <span className="font-mono text-xs text-text-muted">
                        Score: {supplier.computedScore}
                    </span>
                    <StatusTag value={band} />
                </div>
                <h1 className="font-display text-xl font-bold mb-4">{supplier.name}</h1>

                <div className="flex flex-col gap-2 mb-4 text-sm">
                    <div className="text-text-muted">Email: {supplier.contactEmail}</div>
                    {supplier.contactPhone && (
                        <div className="text-text-muted">Phone: {supplier.contactPhone}</div>
                    )}
                    {supplier.contractTerms && (
                        <div className="text-text-muted">Terms: {supplier.contractTerms}</div>
                    )}
                </div>

                <div className="border-t border-line-700 pt-3 mt-3">
                    <div className="text-sm font-medium mb-2">Scorecard Inputs</div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-text-muted">
                        <div>On-time delivery: {supplier.onTimeDeliveryPct}%</div>
                        <div>Order accuracy: {supplier.orderAccuracyPct}%</div>
                        <div>Quality: {supplier.qualityScorePct}%</div>
                        <div>Responsiveness: {supplier.responsivenessPct}%</div>
                    </div>
                </div>
            </StatusCard>
        </div>
    );
}