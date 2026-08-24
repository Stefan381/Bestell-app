import Papa from "papaparse";
import type { ParsedTable } from "./types";

export function parseCsv(fileContents: string): ParsedTable {
  const result = Papa.parse<Record<string, string>>(fileContents, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });

  const headers = result.meta.fields ?? [];
  const rows = result.data.filter((row) =>
    Object.values(row).some((value) => (value ?? "").toString().trim() !== "")
  );

  return { headers, rows };
}
