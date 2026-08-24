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
- **nodemailer** für E-Mail-Versand
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

### Benachrichtigungs-Abstraktion (`src/lib/notifications/`)

`channel.ts` definiert `NotificationChannel.send()`. `emailChannel.ts` ist eine
echte Nodemailer-Implementierung; `whatsappChannel.ts` ist ein Platzhalter, der
klar protokolliert, dass die WhatsApp Business API noch nicht angebunden ist
(siehe Projektbrief §6). Ein Wechsel auf einen echten Anbieter (Meta Cloud API,
Twilio, 360dialog) betrifft nur diese eine Datei.

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
- Tatsächlicher WhatsApp-Versand (nur vorbereiteter Kanal-Stub)
- Cloud-Hosting/Infrastruktur-Provisionierung (App ist Cloud-ready: Konfiguration
  vollständig über Umgebungsvariablen, kein lokaler Dateisystem-State)
