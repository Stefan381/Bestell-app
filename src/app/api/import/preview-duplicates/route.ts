import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireStaffSession } from "@/lib/auth/apiAuth";
import { applyColumnMapping } from "@/lib/import/columnMapping";
import { rowsToCustomerRows } from "@/lib/import/connectors";
import { findDuplicateCustomer } from "@/lib/import/matcher";

const schema = z.object({
  headers: z.array(z.string()),
  rows: z.array(z.record(z.string(), z.string())),
  mapping: z.record(z.string(), z.string().nullable()),
});

/** Dry-run duplicate check for the import preview step (no writes) - lets
 * staff see the "X of Y already exist" warning before confirming, per the
 * brief's "Import-Vorschau ... Duplikat-Warnung" requirement. */
export async function POST(request: Request) {
  const auth = await requireStaffSession();
  if (!auth.session) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const mappedRows = applyColumnMapping(parsed.data.rows, parsed.data.mapping);
  const { rows: customerRows, errors } = rowsToCustomerRows(mappedRows);

  const existingCustomers = await prisma.customer.findMany({
    select: { id: true, firstName: true, lastName: true, email: true, phone: true },
  });

  const duplicates = customerRows
    .map((row, index) => ({ row, index, match: findDuplicateCustomer(row, existingCustomers) }))
    .filter((r) => r.match !== null)
    .map((r) => ({
      rowIndex: r.index,
      newName: `${r.row.firstName} ${r.row.lastName}`,
      matchedCustomerName: `${r.match!.firstName} ${r.match!.lastName}`,
    }));

  return NextResponse.json({
    totalRows: customerRows.length,
    duplicateCount: duplicates.length,
    duplicates: duplicates.slice(0, 20),
    conversionErrors: errors,
  });
}
