import { NextResponse } from "next/server";
import Papa from "papaparse";
import { prisma } from "@/lib/prisma";
import { requireStaffSession } from "@/lib/auth/apiAuth";
import { buildCustomerWhere } from "@/lib/customerFilters";

const SOURCE_LABEL: Record<string, string> = {
  KASSE: "Kasse",
  HUBSPOT: "HubSpot",
  MANUAL: "Manuell",
};

// Bulk CSV export of the customer pool (respects the same per-column filters
// as the Kunden list). Column names match what the import wizard's
// guessColumnMapping recognizes, so a re-import round-trips cleanly.
export async function GET(request: Request) {
  const auth = await requireStaffSession();
  if (!auth.session) return auth.response;

  const { searchParams } = new URL(request.url);
  const where = buildCustomerWhere(searchParams);

  const customers = await prisma.customer.findMany({
    where,
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  const csv = Papa.unparse(
    customers.map((c) => ({
      Vorname: c.firstName ?? "",
      Nachname: c.lastName,
      "E-Mail": c.email ?? "",
      Telefon: c.phone ?? "",
      Kundennummer: c.externalRef ?? "",
      Herkunft: SOURCE_LABEL[c.source] ?? c.source,
      "DSGVO-Einwilligung": c.gdprConsent ? "Ja" : "Nein",
      "DSGVO-Zeitstempel": c.gdprConsentAt ? c.gdprConsentAt.toISOString() : "",
      Notizen: c.notes ?? "",
    }))
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="kunden-export-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
