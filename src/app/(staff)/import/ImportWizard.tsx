"use client";

import { useState } from "react";
import { applyColumnMapping } from "@/lib/import/columnMapping";

type ImportType = "CUSTOMER_KASSE" | "CUSTOMER_HUBSPOT" | "ARTICLE";

const IMPORT_TYPE_LABELS: Record<ImportType, string> = {
  CUSTOMER_KASSE: "Kunden (Kasse-Export)",
  CUSTOMER_HUBSPOT: "Kunden (HubSpot-Export)",
  ARTICLE: "Artikel (Kasse-Export)",
};

const FIELD_LABELS: Record<string, string> = {
  firstName: "Vorname",
  lastName: "Nachname",
  email: "E-Mail",
  phone: "Telefon",
  externalRef: "Externe Referenz (Kundennr./Kontakt-ID)",
  notes: "Notizen",
  articleNumber: "Artikelnummer",
  name: "Bezeichnung",
  price: "Preis",
  ean: "EAN",
  category: "Kategorie",
  stock: "Lagerbestand",
};

interface ParseResult {
  headers: string[];
  rows: Record<string, string>[];
  guessedMapping: Record<string, string | null>;
  targetFields: string[];
  rowCount: number;
  fileName: string;
}

interface DuplicatePreview {
  totalRows: number;
  duplicateCount: number;
  duplicates: { rowIndex: number; newName: string; matchedCustomerName: string }[];
  conversionErrors: { rowIndex: number; message: string }[];
}

interface CommitResult {
  batch: { rowsTotal: number; rowsCreated: number; rowsUpdated: number; rowsSkippedDuplicate: number };
  conversionErrors: { rowIndex: number; message: string }[];
}

export function ImportWizard() {
  const [importType, setImportType] = useState<ImportType>("CUSTOMER_KASSE");
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [mapping, setMapping] = useState<Record<string, string | null>>({});
  const [duplicatePreview, setDuplicatePreview] = useState<DuplicatePreview | null>(null);
  const [commitResult, setCommitResult] = useState<CommitResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCustomerImport = importType !== "ARTICLE";

  function reset() {
    setFile(null);
    setParseResult(null);
    setMapping({});
    setDuplicatePreview(null);
    setCommitResult(null);
    setError(null);
  }

  async function handleUpload() {
    if (!file) {
      setError("Bitte eine Datei auswählen.");
      return;
    }
    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("importType", importType);

    const res = await fetch("/api/import/parse", { method: "POST", body: formData });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Datei konnte nicht analysiert werden.");
      return;
    }
    setParseResult(data);
    setMapping(data.guessedMapping);
  }

  async function checkDuplicates() {
    if (!parseResult) return;
    setLoading(true);
    setError(null);
    const res = await fetch("/api/import/preview-duplicates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ headers: parseResult.headers, rows: parseResult.rows, mapping }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Duplikatprüfung fehlgeschlagen.");
      return;
    }
    setDuplicatePreview(data);
  }

  async function commitImport() {
    if (!parseResult) return;
    setLoading(true);
    setError(null);
    const res = await fetch("/api/import/commit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        importType,
        fileName: parseResult.fileName,
        headers: parseResult.headers,
        rows: parseResult.rows,
        mapping,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Import fehlgeschlagen.");
      return;
    }
    setCommitResult(data);
  }

  if (commitResult) {
    return (
      <div className="mt-4 max-w-xl rounded-xl border border-border bg-surface p-5">
        <h2 className="text-lg font-semibold text-foreground">Import abgeschlossen</h2>
        <ul className="mt-3 space-y-1 text-sm text-foreground/80">
          <li>Zeilen gesamt: {commitResult.batch.rowsTotal}</li>
          <li>Neu angelegt: {commitResult.batch.rowsCreated}</li>
          {isCustomerImport ? (
            <li>Bereits vorhanden (aktualisiert): {commitResult.batch.rowsSkippedDuplicate}</li>
          ) : (
            <li>Aktualisiert: {commitResult.batch.rowsUpdated}</li>
          )}
          {commitResult.conversionErrors.length > 0 && (
            <li className="text-amber-700">
              {commitResult.conversionErrors.length} Zeile(n) übersprungen (Validierungsfehler)
            </li>
          )}
        </ul>
        <button
          onClick={reset}
          className="mt-4 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
        >
          Weiteren Import starten
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4 max-w-3xl">
      <div className="rounded-xl border border-border bg-surface p-4">
        <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
          Importtyp
          <select
            value={importType}
            onChange={(e) => {
              reset();
              setImportType(e.target.value as ImportType);
            }}
            className="w-fit rounded-lg border border-border px-3 py-2"
          >
            {Object.entries(IMPORT_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        {!parseResult && (
          <div className="mt-3 flex items-center gap-2">
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="text-sm"
            />
            <button
              onClick={handleUpload}
              disabled={loading}
              className="rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
            >
              {loading ? "Analysiere…" : "Datei hochladen & analysieren"}
            </button>
          </div>
        )}
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {parseResult && (
        <div className="mt-4 rounded-xl border border-border bg-surface p-4">
          <h2 className="text-sm font-semibold text-foreground">
            Spalten-Mapping ({parseResult.rowCount} Zeilen in {parseResult.fileName})
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {parseResult.headers.map((header) => (
              <label key={header} className="flex flex-col gap-1 text-xs">
                <span className="font-medium text-foreground/70">{header}</span>
                <select
                  value={mapping[header] ?? ""}
                  onChange={(e) =>
                    setMapping((m) => ({ ...m, [header]: e.target.value || null }))
                  }
                  className="rounded-lg border border-border px-2 py-1"
                >
                  <option value="">– nicht importieren –</option>
                  {parseResult.targetFields.map((field) => (
                    <option key={field} value={field}>
                      {FIELD_LABELS[field] ?? field}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>

          <h3 className="mt-4 text-xs font-semibold uppercase text-foreground/50">
            Vorschau (erste 5 Zeilen)
          </h3>
          <div className="mt-1 overflow-x-auto">
            <table className="w-full min-w-[500px] text-left text-xs">
              <thead>
                <tr className="text-foreground/50">
                  {parseResult.targetFields
                    .filter((f) => Object.values(mapping).includes(f))
                    .map((f) => (
                      <th key={f} className="px-2 py-1">
                        {FIELD_LABELS[f] ?? f}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {applyColumnMapping(parseResult.rows.slice(0, 5), mapping).map((row, i) => (
                  <tr key={i} className="border-t border-border">
                    {parseResult.targetFields
                      .filter((f) => Object.values(mapping).includes(f))
                      .map((f) => (
                        <td key={f} className="px-2 py-1">
                          {row[f] ?? ""}
                        </td>
                      ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {isCustomerImport && (
            <div className="mt-4">
              <button
                onClick={checkDuplicates}
                disabled={loading}
                className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground/70 hover:border-brand hover:text-brand disabled:opacity-60"
              >
                Duplikate prüfen
              </button>
              {duplicatePreview && (
                <p className="mt-2 text-sm text-amber-700">
                  {duplicatePreview.duplicateCount} von {duplicatePreview.totalRows} Zeilen entsprechen
                  bereits vorhandenen Kunden (E-Mail/Telefon) und werden aktualisiert statt neu angelegt.
                </p>
              )}
            </div>
          )}

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={commitImport}
              disabled={loading}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
            >
              {loading ? "Importiere…" : "Import bestätigen"}
            </button>
            <button onClick={reset} className="text-sm text-foreground/50 hover:text-foreground">
              Abbrechen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
