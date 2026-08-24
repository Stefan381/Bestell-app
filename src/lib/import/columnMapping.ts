const SYNONYMS: Record<string, string[]> = {
  firstName: ["firstname", "first name", "vorname"],
  lastName: ["lastname", "last name", "nachname"],
  email: ["email", "e-mail", "mail", "emailadresse"],
  phone: ["phone", "telefon", "telefonnummer", "mobil", "handynummer"],
  externalRef: [
    "externalref",
    "kundennummer",
    "kunden-nr",
    "contactid",
    "contact id",
    "kontakt-id",
  ],
  notes: ["notes", "notiz", "notizen", "bemerkung"],
  articleNumber: ["articlenumber", "artikelnummer", "artikel-nr", "sku"],
  name: ["name", "bezeichnung", "artikelbezeichnung"],
  price: ["price", "preis", "vkpreis", "verkaufspreis"],
  ean: ["ean", "ean-nummer", "barcode"],
  category: ["category", "kategorie"],
  stock: ["stock", "lagerbestand", "bestand"],
};

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Best-effort guess of "file column -> target field" from header names.
 * Returned as a map the import preview UI shows and the user can override. */
export function guessColumnMapping(
  headers: string[],
  targetFields: readonly string[]
): Record<string, string | null> {
  const mapping: Record<string, string | null> = {};
  const usedTargets = new Set<string>();

  for (const header of headers) {
    const normalized = normalizeHeader(header);
    let matchedField: string | null = null;

    for (const field of targetFields) {
      if (usedTargets.has(field)) continue;
      const synonyms = SYNONYMS[field] ?? [field.toLowerCase()];
      if (synonyms.some((syn) => normalized === syn)) {
        matchedField = field;
        break;
      }
    }

    if (matchedField) {
      usedTargets.add(matchedField);
    }
    mapping[header] = matchedField;
  }

  return mapping;
}

/** Applies a confirmed header->field mapping to raw rows, producing plain
 * objects keyed by target field name (values still strings; typed parsing
 * happens in the connector building the NormalizedCustomerRow/ArticleRow). */
export function applyColumnMapping(
  rows: Record<string, string>[],
  mapping: Record<string, string | null>
): Record<string, string>[] {
  return rows.map((row) => {
    const mapped: Record<string, string> = {};
    for (const [header, field] of Object.entries(mapping)) {
      if (!field) continue;
      mapped[field] = row[header] ?? "";
    }
    return mapped;
  });
}
