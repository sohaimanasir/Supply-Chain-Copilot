import { askGemini } from "./gemini";

export type EntityType = "inventory" | "suppliers" | "purchase-orders";

const SCHEMA_FIELDS: Record<EntityType, string> = {
    inventory: `name (string, product name), code (string, SKU code), quantityOnHand (number), reorderThreshold (number), unitCost (number, price per unit in dollars)`,
    suppliers: `name (string, supplier/vendor name), contactEmail (string), contactPhone (string, optional), contractTerms (string, optional e.g. "Net 30"), onTimeDeliveryPct (number 0-100), orderAccuracyPct (number 0-100), qualityScorePct (number 0-100), responsivenessPct (number 0-100)`,
    "purchase-orders": `supplierName (string, must match an existing supplier name), itemCode (string, SKU code) or itemName (string, product name), quantity (number), unitCost (number)`,
};

type ParsedInput =
    | { type: "rows"; data: Record<string, string>[] }
    | { type: "text"; data: string };

export async function mapRowsToSchema(
    entity: EntityType,
    input: ParsedInput
): Promise<Record<string, unknown>[]> {
    const fields = SCHEMA_FIELDS[entity];

    const sourceDescription =
        input.type === "rows"
            ? `Here are the raw rows extracted from the spreadsheet (JSON array of objects, keys are the original column headers):\n${JSON.stringify(input.data)}`
            : `Here is raw extracted text from a PDF. Find any tabular or list data describing ${entity} and extract it into records:\n${input.data}`;

    const prompt = `You are mapping messy uploaded data into a fixed schema. The target entity is "${entity}", with these fields:
${fields}

${sourceDescription}

Return ONLY a valid JSON array of objects, one per record, using EXACTLY these field names. Do not include markdown formatting, backticks, or any explanation — just the raw JSON array. If a field's value can't be determined for a row, omit that field for that row rather than guessing a fake value. Strip currency symbols/commas from numbers and return plain numbers.`;

    const raw = await askGemini(prompt);
    const cleaned = raw
        .trim()
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```\s*$/i, "");

    try {
        return JSON.parse(cleaned);
    } catch {
        throw new Error("AI mapping failed to produce valid data. Please try again.");
    }
}