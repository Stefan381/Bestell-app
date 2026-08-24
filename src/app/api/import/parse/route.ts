import { NextResponse } from "next/server";
import { requireStaffSession } from "@/lib/auth/apiAuth";
import { parseCsv } from "@/lib/import/parseCsv";
import { parseExcel } from "@/lib/import/parseExcel";
import { guessColumnMapping } from "@/lib/import/columnMapping";
import { ARTICLE_TARGET_FIELDS, CUSTOMER_TARGET_FIELDS } from "@/lib/import/types";

export async function POST(request: Request) {
  const auth = await requireStaffSession();
  if (!auth.session) return auth.response;

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  const importType = formData?.get("importType")?.toString();

  if (!(file instanceof File) || !importType) {
    return NextResponse.json({ error: "Datei und Importtyp erforderlich." }, { status: 400 });
  }

  const isExcel = /\.xlsx?$/i.test(file.name);
  const table = isExcel
    ? await parseExcel(await file.arrayBuffer())
    : parseCsv(await file.text());

  if (table.rows.length === 0) {
    return NextResponse.json({ error: "Keine Datenzeilen in der Datei gefunden." }, { status: 400 });
  }

  const targetFields = importType === "ARTICLE" ? ARTICLE_TARGET_FIELDS : CUSTOMER_TARGET_FIELDS;
  const guessedMapping = guessColumnMapping(table.headers, targetFields);

  return NextResponse.json({
    headers: table.headers,
    rows: table.rows,
    guessedMapping,
    targetFields,
    rowCount: table.rows.length,
    fileName: file.name,
  });
}
