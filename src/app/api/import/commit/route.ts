import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireStaffSession } from "@/lib/auth/apiAuth";
import { applyColumnMapping } from "@/lib/import/columnMapping";
import { rowsToArticleRows, rowsToCustomerRows } from "@/lib/import/connectors";
import { findDuplicateCustomer } from "@/lib/import/matcher";

const commitSchema = z.object({
  importType: z.enum(["CUSTOMER_KASSE", "CUSTOMER_HUBSPOT", "ARTICLE"]),
  fileName: z.string(),
  headers: z.array(z.string()),
  rows: z.array(z.record(z.string(), z.string())),
  mapping: z.record(z.string(), z.string().nullable()),
});

export async function POST(request: Request) {
  const auth = await requireStaffSession();
  if (!auth.session) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = commitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }
  const { importType, fileName, rows, mapping } = parsed.data;

  const mappedRows = applyColumnMapping(rows, mapping);

  let rowsCreated = 0;
  let rowsUpdated = 0;
  let rowsSkippedDuplicate = 0;
  let conversionErrors: { rowIndex: number; message: string }[] = [];

  if (importType === "ARTICLE") {
    const { rows: articleRows, errors } = rowsToArticleRows(mappedRows);
    conversionErrors = errors;

    for (const row of articleRows) {
      const existing = await prisma.article.findUnique({ where: { articleNumber: row.articleNumber } });
      if (existing) {
        await prisma.article.update({
          where: { id: existing.id },
          data: {
            name: row.name,
            price: row.price,
            ean: row.ean,
            category: row.category,
            stock: row.stock,
          },
        });
        rowsUpdated += 1;
      } else {
        await prisma.article.create({
          data: {
            articleNumber: row.articleNumber,
            name: row.name,
            price: row.price,
            ean: row.ean,
            category: row.category,
            stock: row.stock,
          },
        });
        rowsCreated += 1;
      }
    }
  } else {
    const { rows: customerRows, errors } = rowsToCustomerRows(mappedRows);
    conversionErrors = errors;
    const source = importType === "CUSTOMER_KASSE" ? "KASSE" : "HUBSPOT";

    const existingCustomers = await prisma.customer.findMany({
      select: { id: true, email: true, phone: true },
    });

    for (const row of customerRows) {
      const duplicate = findDuplicateCustomer(row, existingCustomers);
      if (duplicate) {
        await prisma.customer.update({
          where: { id: duplicate.id },
          data: {
            externalRef: row.externalRef ?? undefined,
            source,
          },
        });
        rowsSkippedDuplicate += 1;
      } else {
        const created = await prisma.customer.create({
          data: {
            firstName: row.firstName,
            lastName: row.lastName,
            email: row.email,
            phone: row.phone,
            externalRef: row.externalRef,
            notes: row.notes,
            source,
          },
          select: { id: true, email: true, phone: true },
        });
        existingCustomers.push(created);
        rowsCreated += 1;
      }
    }
  }

  const batch = await prisma.importBatch.create({
    data: {
      type: importType,
      fileName,
      importedByUserId: auth.session.userId,
      rowsTotal: rows.length,
      rowsCreated,
      rowsUpdated,
      rowsSkippedDuplicate,
    },
  });

  return NextResponse.json({ batch, conversionErrors });
}
