"use client";

import { useState } from "react";

type EntityType = "inventory" | "suppliers" | "purchase-orders";
type ImportMode = "append" | "replace";
type MappedRecord = Record<string, unknown>;

const FIELD_LABELS: Record<EntityType, string[]> = {
    inventory: ["name", "code", "quantityOnHand", "reorderThreshold", "unitCost"],
    suppliers: [
        "name",
        "contactEmail",
        "contactPhone",
        "contractTerms",
        "onTimeDeliveryPct",
        "orderAccuracyPct",
        "qualityScorePct",
        "responsivenessPct",
    ],
    "purchase-orders": ["supplierName", "itemCode", "itemName", "quantity", "unitCost"],
};

export default function ImportPage() {
    const [entity, setEntity] = useState<EntityType>("inventory");
    const [mode, setMode] = useState<ImportMode>("append");
    const [file, setFile] = useState<File | null>(null);
    const [dragging, setDragging] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [mapped, setMapped] = useState<MappedRecord[] | null>(null);
    const [committing, setCommitting] = useState(false);
    const [result, setResult] = useState<{
        created: number;
        updated: number;
        skipped: number;
        errors: string[];
    } | null>(null);

    function handleFile(f: File) {
        setFile(f);
        setMapped(null);
        setResult(null);
    }

    async function handlePreview() {
        if (!file) return;
        setProcessing(true);
        const formData = new FormData();
        formData.append("file", file);
        const parseRes = await fetch("/api/import/parse", { method: "POST", body: formData });
        const parseData = await parseRes.json();

        const mapRes = await fetch("/api/import/map", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ entity, parsed: parseData }),
        });
        const mapData = await mapRes.json();

        setMapped(mapData.mapped ?? []);
        setProcessing(false);
    }

    async function handleConfirm() {
        if (!mapped) return;
        setCommitting(true);
        const res = await fetch("/api/import/commit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ entity, mode, records: mapped }),
        });
        const data = await res.json();
        setResult(data);
        setCommitting(false);
    }

    const columns = FIELD_LABELS[entity];

    return (
        <div className="max-w-4xl">
            <h1 className="font-display text-2xl font-bold mb-6">Import Data</h1>

            <div className="flex gap-4 mb-6">
                <div>
                    <label className="text-sm text-text-muted block mb-1">Data type</label>
                    <select
                        value={entity}
                        onChange={(e) => {
                            setEntity(e.target.value as EntityType);
                            setMapped(null);
                            setResult(null);
                        }}
                        className="bg-ink-800 border border-line-700 rounded px-3 py-2 text-sm"
                    >
                        <option value="inventory">Inventory</option>
                        <option value="suppliers">Suppliers</option>
                        <option value="purchase-orders">Purchase Orders</option>
                    </select>
                </div>

                <div>
                    <label className="text-sm text-text-muted block mb-1">Mode</label>
                    <select
                        value={mode}
                        onChange={(e) => setMode(e.target.value as ImportMode)}
                        className="bg-ink-800 border border-line-700 rounded px-3 py-2 text-sm"
                    >
                        <option value="append">Append (add to existing)</option>
                        <option value="replace">Replace (clear and reload)</option>
                    </select>
                </div>
            </div>

            {!result && (
                <div
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(e) => {
                        e.preventDefault();
                        setDragging(false);
                        if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
                    }}
                    className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${dragging ? "border-brand-cobalt bg-brand-cobalt/5" : "border-line-700"
                        }`}
                >
                    {file ? (
                        <div>
                            <div className="font-medium mb-1">{file.name}</div>
                            <div className="text-text-muted text-sm">{(file.size / 1024).toFixed(1)} KB</div>
                            <button
                                onClick={() => { setFile(null); setMapped(null); setResult(null); }}
                                className="text-signal-red text-sm mt-3 hover:underline"
                            >
                                Remove
                            </button>
                        </div>
                    ) : (
                        <div>
                            <div className="text-text-muted mb-3">Drag a CSV, Excel, or PDF file here</div>
                            <label className="inline-block bg-brand-cobalt text-ink-900 px-4 py-2 rounded text-sm font-medium cursor-pointer">
                                Choose file
                                <input
                                    type="file"
                                    accept=".csv,.xlsx,.xls,.pdf"
                                    className="hidden"
                                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                                />
                            </label>
                        </div>
                    )}
                </div>
            )}

            {file && !mapped && !result && (
                <button
                    onClick={handlePreview}
                    disabled={processing}
                    className="mt-6 bg-brand-cobalt text-ink-900 px-4 py-2 rounded text-sm font-medium disabled:opacity-50"
                >
                    {processing ? "Processing..." : "Continue → Preview"}
                </button>
            )}

            {mapped && !result && (
                <div className="mt-6">
                    <div className="text-sm font-medium mb-2">
                        Preview — {mapped.length} record{mapped.length !== 1 ? "s" : ""} mapped
                    </div>
                    <div className="overflow-x-auto border border-line-700 rounded-md mb-4">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-ink-800 border-b border-line-700">
                                    {columns.map((col) => (
                                        <th key={col} className="text-left px-3 py-2 font-mono text-xs text-text-muted">
                                            {col}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {mapped.map((row, i) => (
                                    <tr key={i} className="border-b border-line-700 last:border-0">
                                        {columns.map((col) => (
                                            <td key={col} className="px-3 py-2 text-text-primary">
                                                {row[col] !== undefined ? String(row[col]) : (
                                                    <span className="text-signal-amber text-xs">missing</span>
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleConfirm}
                            disabled={committing}
                            className="bg-brand-cobalt text-ink-900 px-4 py-2 rounded text-sm font-medium disabled:opacity-50"
                        >
                            {committing ? "Importing..." : `Confirm Import (${mode === "replace" ? "Replace" : "Append"})`}
                        </button>
                        <button
                            onClick={() => { setMapped(null); setFile(null); }}
                            className="border border-line-700 text-text-muted px-4 py-2 rounded text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {result && (
                <div className="mt-6 bg-ink-700 border border-line-700 rounded-md p-4">
                    <div className="font-medium mb-2">Import complete</div>
                    <div className="text-sm text-text-muted mb-2">
                        Created: {result.created} · Updated: {result.updated} · Skipped: {result.skipped}
                    </div>
                    {result.errors.length > 0 && (
                        <div className="text-signal-amber text-xs mt-2">
                            {result.errors.map((e, i) => (
                                <div key={i}>{e}</div>
                            ))}
                        </div>
                    )}
                    <button
                        onClick={() => { setFile(null); setMapped(null); setResult(null); }}
                        className="mt-4 border border-line-700 text-text-primary px-4 py-2 rounded text-sm"
                    >
                        Import another file
                    </button>
                </div>
            )}
        </div>
    );
}