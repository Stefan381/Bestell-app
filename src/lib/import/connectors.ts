import { z } from "zod";
import type { NormalizedArticleRow, NormalizedCustomerRow } from "./types";

const customerRowSchema = z.object({
  firstName: z.string().trim().optional(),
  lastName: z.string().trim().min(1),
  email: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  externalRef: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

const articleRowSchema = z.object({
  articleNumber: z.string().trim().min(1),
  name: z.string().trim().min(1),
  price: z.string().trim().min(1),
  ean: z.string().trim().optional(),
  category: z.string().trim().optional(),
  stock: z.string().trim().optional(),
});

export interface RowConversionResult<T> {
  rows: T[];
  errors: { rowIndex: number; message: string }[];
}

function toGermanOrPlainNumber(value: string): number {
  // Accepts "89.99", "89,99", "1.234,56"
  const normalized = value.includes(",")
    ? value.replace(/\./g, "").replace(",", ".")
    : value;
  return Number(normalized);
}

/** Converts CSV/Excel rows (already mapped to target field names, still all
 * strings) into the same NormalizedCustomerRow[] shape a live source would
 * produce. This is where CSV-specific parsing ends and the shared pipeline
 * (dedup + persistence) begins. */
export function rowsToCustomerRows(
  mappedRows: Record<string, string>[]
): RowConversionResult<NormalizedCustomerRow> {
  const rows: NormalizedCustomerRow[] = [];
  const errors: { rowIndex: number; message: string }[] = [];

  mappedRows.forEach((raw, index) => {
    const parsed = customerRowSchema.safeParse(raw);
    if (!parsed.success) {
      errors.push({
        rowIndex: index,
        message: parsed.error.issues.map((i) => i.message).join(", "),
      });
      return;
    }
    const data = parsed.data;
    rows.push({
      firstName: data.firstName || null,
      lastName: data.lastName,
      email: data.email || null,
      phone: data.phone || null,
      externalRef: data.externalRef || null,
      notes: data.notes || null,
    });
  });

  return { rows, errors };
}

export function rowsToArticleRows(
  mappedRows: Record<string, string>[]
): RowConversionResult<NormalizedArticleRow> {
  const rows: NormalizedArticleRow[] = [];
  const errors: { rowIndex: number; message: string }[] = [];

  mappedRows.forEach((raw, index) => {
    const parsed = articleRowSchema.safeParse(raw);
    if (!parsed.success) {
      errors.push({
        rowIndex: index,
        message: parsed.error.issues.map((i) => i.message).join(", "),
      });
      return;
    }
    const data = parsed.data;
    const price = toGermanOrPlainNumber(data.price);
    if (Number.isNaN(price)) {
      errors.push({ rowIndex: index, message: `Ungültiger Preis: "${data.price}"` });
      return;
    }
    const stock = data.stock ? toGermanOrPlainNumber(data.stock) : null;
    rows.push({
      articleNumber: data.articleNumber,
      name: data.name,
      price,
      ean: data.ean || null,
      category: data.category || null,
      stock: stock !== null && !Number.isNaN(stock) ? stock : null,
    });
  });

  return { rows, errors };
}
