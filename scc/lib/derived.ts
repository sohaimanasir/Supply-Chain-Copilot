// lib/derived.ts

export type StockStatus = "HEALTHY" | "LOW" | "CRITICAL";

/**
 * CRITICAL if quantityOnHand <= reorderThreshold * 0.5
 * LOW if quantityOnHand <= reorderThreshold
 * else HEALTHY
 */
export function classifyStockStatus(
    quantityOnHand: number,
    reorderThreshold: number
): StockStatus {
    if (quantityOnHand <= reorderThreshold * 0.5) return "CRITICAL";
    if (quantityOnHand <= reorderThreshold) return "LOW";
    return "HEALTHY";
}

export interface SupplierScoreInputs {
    onTimeDeliveryPct: number;
    orderAccuracyPct: number;
    qualityScorePct: number;
    responsivenessPct: number;
}

/**
 * computedScore = (onTimeDeliveryPct * 0.40) + (orderAccuracyPct * 0.30)
 *               + (qualityScorePct * 0.20) + (responsivenessPct * 0.10)
 */
export function computeSupplierScore(inputs: SupplierScoreInputs): number {
    const { onTimeDeliveryPct, orderAccuracyPct, qualityScorePct, responsivenessPct } = inputs;
    const score =
        onTimeDeliveryPct * 0.4 +
        orderAccuracyPct * 0.3 +
        qualityScorePct * 0.2 +
        responsivenessPct * 0.1;
    return Math.round(score * 100) / 100; // 2 decimal places, matches Decimal(5,2)
}