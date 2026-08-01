import Papa from "papaparse";
import * as XLSX from "xlsx";

export type ParsedRows = Record<string, string>[];

export async function parseCsv(buffer: Buffer): Promise<ParsedRows> {
    const text = buffer.toString("utf-8");
    const result = Papa.parse<Record<string, string>>(text, {
        header: true,
        skipEmptyLines: true,
    });
    return result.data;
}

export async function parseXlsx(buffer: Buffer): Promise<ParsedRows> {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json<Record<string, string>>(firstSheet);
}

export async function parsePdfToText(buffer: Buffer): Promise<string> {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    return result.text;
}