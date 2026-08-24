import { ImportWizard } from "./ImportWizard";

export default function ImportPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold text-foreground">Import</h1>
      <p className="mt-1 text-sm text-foreground/60">
        CSV-/Excel-Import für Kunden (Kasse/HubSpot) und Artikel (Kasse), mit Spalten-Mapping und
        Duplikat-Prüfung vor der Bestätigung.
      </p>
      <ImportWizard />
    </div>
  );
}
