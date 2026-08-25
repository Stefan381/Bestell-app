import type { Prisma } from "@/generated/prisma/client";

/** Shared filter parsing for GET /api/customers and GET /api/customers/export
 * so the CSV export always matches what's currently filtered in the Kunden
 * table. `q` is a broad free-text search (used by pickers like
 * NewOrderModal); `name`/`contact`/`source`/`gdprConsent` are the per-column
 * filters on the Kunden page and combine with AND. */
export function buildCustomerWhere(searchParams: URLSearchParams): Prisma.CustomerWhereInput {
  const q = searchParams.get("q")?.trim();
  const name = searchParams.get("name")?.trim();
  const contact = searchParams.get("contact")?.trim();
  const source = searchParams.get("source")?.trim();
  const gdprConsent = searchParams.get("gdprConsent")?.trim();

  const and: Prisma.CustomerWhereInput[] = [];

  if (q) {
    and.push({
      OR: [
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
        { externalRef: { contains: q, mode: "insensitive" } },
      ],
    });
  }

  if (name) {
    and.push({
      OR: [
        { firstName: { contains: name, mode: "insensitive" } },
        { lastName: { contains: name, mode: "insensitive" } },
      ],
    });
  }

  if (contact) {
    and.push({
      OR: [
        { email: { contains: contact, mode: "insensitive" } },
        { phone: { contains: contact } },
      ],
    });
  }

  if (source === "KASSE" || source === "HUBSPOT" || source === "MANUAL") {
    and.push({ source });
  }

  if (gdprConsent === "true" || gdprConsent === "false") {
    and.push({ gdprConsent: gdprConsent === "true" });
  }

  return and.length > 0 ? { AND: and } : {};
}
