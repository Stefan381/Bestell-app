# Kundenbestellportal – City Kauf GmbH

Zentrale Web-App zur Erfassung, Verfolgung und Abwicklung von Kundenbestellungen:
ein Personal-Dashboard (Kanban: Offen → Bestellt → Geliefert) und ein
Kiosk-Modus ohne Login für Kunden am Tablet im Laden.

## Stack

- **Next.js 16** (App Router, TypeScript) – Frontend und API-Routes in einer App
- **PostgreSQL + Prisma 7** (Prisma-7-SQL-Adapter-Workflow: `@prisma/adapter-pg`)
- **Eigene Session-Auth** (bcrypt + signiertes JWT-Cookie) statt eines
  Drittanbieter-Auth-Frameworks – `proxy.ts` (Next 16, ehemals `middleware.ts`)
  schützt alle Personal-Routen/-APIs; `/`, `/login` und `/kiosk*` bleiben öffentlich
- **Tailwind CSS v4**
- **papaparse** (CSV) / **exceljs** (Excel) für den Import
- **@dnd-kit** für das Kanban-Board (Touch-fähig, anders als natives HTML5-DnD)
- **zod** für Validierung, **vitest** für Unit-Tests

## Setup

```bash
npm install
cp .env.example .env   # DATABASE_URL, SESSION_SECRET etc. anpassen
npx prisma migrate dev
npm run db:seed        # 3 Filialen, 1 Personal-Login, Beispieldaten
npm run dev
```

Demo-Login nach dem Seed: `personal@citykauf.example` / `bestell123`.
Kiosk-Einstieg: Startseite (`/`) → Filiale wählen, oder direkt `/kiosk?filiale=<id>`.

### Tests & Build

```bash
npm run test    # vitest: Dedup-Matcher, Template-Rendering
npm run build   # Next-Build inkl. TypeScript-Check
```

## Architektur

### Datenmodell (`prisma/schema.prisma`)

`Filiale`, `User` (Personal), `Customer`, `Article`, `Order` + `OrderItem`,
`MessageTemplate`, `Notification`, `ImportBatch` – siehe Schema-Datei für Details
und Kommentare. Zentrale Entscheidungen:

- **Ein Kundenpool** für alle Filialen (Kasse + HubSpot + manuell), aber
  **Bestellungen und Personal sind je Filiale** zugeordnet (siehe „Offene
  Punkte" unten).
- **DSGVO**: `Customer.gdprConsent`/`gdprConsentAt` ist die
  *Marketing*-Einwilligung. Die Abholbenachrichtigung ist davon bewusst
  getrennt und wird immer verschickt (technisch notwendig, brauchte laut
  Aufgabenstellung keine Einwilligung).

### Austauschbare Import-/Sync-Schicht (`src/lib/import/`)

`matcher.ts` enthält die eine Dedup-Logik (normalisierte E-Mail/Telefon-Suche),
die **sowohl** der CSV-Import (`connectors.ts`) **als auch** der Kiosk-Flow beim
Anlegen neuer Kunden verwendet. Eine künftige Live-Anbindung an Kasse/HubSpot
müsste nur eine neue `CustomerSource`/`ArticleSource`-Implementierung
(`types.ts`) liefern – Matching und Persistenz bleiben unverändert.

### Benachrichtigung per Klick (`src/lib/notifications/`)

Es gibt **keinen automatischen Versand** (kein SMTP, keine WhatsApp Business
API) – das scheiterte in der Praxis regelmäßig an fehlender/nicht
einrichtbarer SMTP-Konfiguration. Stattdessen: Auf einer gelieferten
Bestellung rendert `renderOrderNotification()` die Standardvorlage des
Kanals mit den echten Bestelldaten, `POST /api/orders/[id]/notify` liefert
das Ergebnis an den Client und protokolliert den Klick (`Notification` mit
`sentByUserId`). Der Client öffnet dann direkt das Standard-Mailprogramm
(`mailto:`-Link mit vorausgefülltem Betreff/Text) bzw. WhatsApp
(`https://wa.me/<Nummer>?text=...`, öffnet WhatsApp Web/die App mit
vorausgefülltem Text). Das eigentliche Absenden macht immer die Person am
Rechner – die App bereitet nur vor und merkt sich, wer wann über welchen
Kanal informiert hat.

### Bekannte Einschränkungen

- **Telefonnummer-Abgleich** ist eine einfache Ziffern-Normalisierung (kein
  E.164/`libphonenumber`), d.h. `0151…` und `+49151…` werden aktuell **nicht**
  als dieselbe Nummer erkannt. Für den MVP ausreichend, sollte aber vor einer
  Live-Anbindung mit echten Kassendaten geprüft werden.
- **xlsx-Bibliothek**: Es wird bewusst `exceljs` statt `xlsx`/SheetJS
  verwendet – Letzteres hat bekannte, ungepatchte Prototype-Pollution-/ReDoS-
  Schwachstellen (siehe `npm audit`).
- Die dev-only Transitive-Abhängigkeiten `deepmerge-ts` (über Prisma CLI) und
  `uuid` (über `exceljs`) haben laut `npm audit` offene Advisories; beide
  betreffen keinen zur Laufzeit von Nutzereingaben erreichbaren Code-Pfad in
  dieser App. Ein Fix würde ein Downgrade auf Prisma 6 bzw. ein sehr altes
  `exceljs` erzwingen – bewusst nicht gemacht.

## Offene Punkte aus dem Projektbrief §7 – getroffene Annahmen

| Frage | Entscheidung |
|---|---|
| Filialtrennung? | Ja, von Anfang an (`Filiale` auf `Order` und `User`); Kundenpool bleibt filialübergreifend. |
| Rechte-Stufen? | Eine Rolle für alle Personal-Accounts (kein Admin/Verkäufer-Split). |
| Mehrere Artikel pro Kiosk-Bestellung? | Ja, wie beim Personal-Flow (`Order` = Kunde + 1..n `OrderItem`). |
| CSV-Spaltennamen aus Kasse/HubSpot? | Noch nicht final bekannt → Spalten-Mapping ist im Import-Wizard frei editierbar (`guessColumnMapping` liefert nur einen Vorschlag). |

## Nicht umgesetzt (laut Brief bewusst vorbereitet, nicht gebaut)

- Live-API-Anbindung an Kasse/HubSpot (Interface vorhanden, kein Live-Connector)
- Automatischer E-Mail/WhatsApp-Versand über SMTP bzw. die WhatsApp Business
  API – bewusst durch das Klick-zu-mailto:/wa.me-Vorgehen ersetzt (siehe
  oben), da SMTP in der Praxis nicht einrichtbar war
- Cloud-Hosting/Infrastruktur-Provisionierung (App ist Cloud-ready: Konfiguration
  vollständig über Umgebungsvariablen, kein lokaler Dateisystem-State)
