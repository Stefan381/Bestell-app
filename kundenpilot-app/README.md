# KundenPilot – Citykauf

Kundenkarten-, Treue- und CRM-App für den Einzelhandel "Citykauf", als eigenständiges
Expo/React-Native-Projekt (iOS, Android, Web) neben dem bestehenden
Kundenbestellportal im Repo-Root aufgebaut. Beide Apps sind bewusst unabhängig
voneinander (eigene Abhängigkeiten, eigener Mock-Datenbestand) – siehe
"Verhältnis zum Kundenbestellportal" unten.

## Stack

- **Expo SDK 57** (React Native 0.86, React 19) mit **expo-router** (file-based
  Routing, `src/app`)
- **TypeScript**, strict
- **NativeWind v4 / Tailwind CSS v3** für das Styling (`className`-Props)
- **Zustand** (+ `persist`/AsyncStorage) für State Management
- **expo-location** + **expo-task-manager** für Geofencing
- **expo-notifications** für lokale Push-Benachrichtigungen
- **expo-camera** für den Kassen-Scanner, **react-native-qrcode-svg** für den
  Kunden-Code

## Setup

```bash
cd kundenpilot-app
npm install
npx expo start
```

Zum Testen im Browser: `npx expo start --web` bzw. im Terminal `w` drücken.
Für Kamera-Scanner, echte Push-Benachrichtigungen und Geofencing empfiehlt
sich ein Development Build (`npx expo run:ios` / `npx expo run:android`) oder
Expo Go auf einem physischen Gerät – reine Simulatoren haben keine Kamera/GPS.

### Demo-Zugänge (Mock-Daten, kein echtes Passwort erforderlich)

- **Kund:in:** `anna.bauer@example.com` (oder jede andere E-Mail aus
  `src/mocks/customers.ts`)
- **Mitarbeiter:in/Admin:** `sabine@citykauf.example` oder
  `david@citykauf.example` (`src/mocks/adminUsers.ts`)

Beim Kassen-Schnell-Scan (Admin → Scan) funktionieren die Kundennummern
`CK-100000` bis `CK-100017`.

## Architektur

```
src/
  app/                    # expo-router: Screens & Layouts
    (auth)/               # Login (Kunde/Mitarbeiter-Toggle) + Registrierung
    (customer)/            # Kunden-App: Karte, Verlauf, Aktionen, Profil (Tabs)
    (admin)/                # Admin-Dashboard: Scan, Kunden, Bonus, KI, Einstellungen (Tabs)
  components/
    ui/                   # Design-System (Button, Card, TextField, Badge, …)
    customer/              # QR-Karte, Punkte-Anzeige, Bon-Liste, Aktions-Karte
    admin/                  # Scanner-Feld, Kundenliste-Zeile, Batch-Kontakt-Sheet
  services/
    evendo/                # e-vendo Kassen-API: Interface + Mock + Live-Client
    hubspot/                # HubSpot CRM: Interface + Mock + Live-Client
    ai/                     # Mock-KI-Textgenerator für Social-Media-Posts
    loyalty/                # Punkte-/Bonus-/Gutschein-Logik (reine Funktionen)
    geofencing/             # Standort-Task, Öffnungszeiten-Check, Re-Engagement-Regel
    notifications/          # Lokale Push-Benachrichtigungen (expo-notifications)
    share/                  # mailto:/wa.me-Deeplinks, Share-Sheet, Zwischenablage
  state/                   # Zustand-Stores (auth, customers, loyalty, settings)
  mocks/                   # Testdaten: Kund:innen, Artikel, Kassenbons, Admins, Aktionen
  types/                   # Zentrale Domänen-Typen
```

### Warum diese Trennung?

- **`services/*`** kennen nur ihr eigenes TS-Interface (`EvendoClient`,
  `HubspotClient`) – UI und Stores rufen ausschließlich dieses Interface auf.
  Ein Wechsel von Mock → Live-API (Einstellungen → Integrationen) tauscht nur
  die Implementierung, nicht die Aufrufer.
- **`services/loyalty/loyaltyEngine.ts`** enthält die gesamte Punkte-Mathematik
  (1 €=1 Punkt, Bonus-Multiplikator, 100 Punkte = 1 € Gutschein,
  Willkommens-Bonus, Jahres-Gutschein-Check) als reine, ungetestete-UI-freie
  Funktionen – leicht nachvollziehbar und testbar.
- **`state/*`** sind dünne Zustand-Stores, die diese Services/Engine aufrufen
  und Ergebnisse persistieren (AsyncStorage) – keine Geschäftslogik in den
  Screens.

## Umgesetzte Kernfunktionen

**Kunden-App**
- QR-/Barcode-Kunden-Code mit automatisch erhöhter Displayhelligkeit
  (`expo-brightness`) für den Scan an der Kasse
- Punktestand, Fortschrittsbalken bis zum nächsten Euro-Gutscheinwert,
  aktiver Bonus-Multiplikator sichtbar
- Kassenbon-Historie mit aufklappbaren Artikeln
- Aktionsübersicht (aktive Bonus-Zeiträume) + manueller Jahres-Gutschein-Check
  (Demo-Button, in Produktion serverseitig zeitgesteuert)
- Opt-in-Schalter für Geofencing-Erinnerungen und Marketing-Einwilligung

**Admin-Dashboard**
- Kamera- oder manueller Schnell-Scan an der Kasse, inkl. Einkaufsbetrag
  erfassen → Punkte automatisch mit aktuellem Bonus-Multiplikator gutschreiben
- Kundenliste mit Such-/Inaktivitätsfiltern (30/60/90 Tage), Mehrfachauswahl
  und Batch-Kontakt (E-Mail-Sammel-`mailto:`, WhatsApp pro Kund:in via
  `wa.me`-Deeplink) auf Basis frei editierbarer Vorlagen
- Kundenkartei: Stammdaten, Notizen, manuelle Punkte-Korrektur, Punkte-Verlauf,
  Artikelhistorie, Einzel-Kontakt, HubSpot-Sync-Button
- Bonuspunkte-Steuerung: Zeiträume mit Multiplikator anlegen/aktivieren
- KI-Social-Media-Generator: dauerhafte System-Vorgaben + Thema →
  Textvorschlag, Teilen (natives Share-Sheet, dort u. a. Instagram/TikTok)
  oder Text kopieren
- Einstellungen: Geofencing-Koordinaten/Radius/Öffnungszeiten/Push-Texte,
  Nachrichten-Vorlagen, e-vendo (Mock/Live) und HubSpot (API-Key,
  Sync-Richtung, Intervall)

## Bekannte Einschränkungen (Mock-/Demo-Scope)

- **Kein Backend.** Alle Daten liegen lokal (Mock-Arrays + AsyncStorage pro
  Gerät). Admin-Einstellungen auf einem Gerät wirken sich **nicht** auf
  Kunden-Apps auf anderen Geräten aus – ein Produktivbetrieb bräuchte einen
  gemeinsamen Server, der `GeofenceConfig`/Vorlagen/Bonuszeiträume verteilt.
- **Hintergrund-Geofencing** (`expo-location` + `expo-task-manager`) ist in
  **Expo Go seit SDK 53 nicht mehr unterstützt** – dafür ist ein
  Development Build nötig. Die Logik (Task-Registrierung, Öffnungszeiten-
  Check, Push-Auslösung) ist vollständig implementiert und
  produktionsreif verdrahtet.
- **Smart Re-Engagement** läuft im Demo-Scope client-seitig beim App-Start
  (Vergleich `lastPurchaseAt` vs. Schwelle, max. 1 Push/Tag) statt über einen
  serverseitigen Cron-Job – Logik ist identisch, nur der Auslöser wäre in
  Produktion serverseitig.
- **Jahres-Gutschein-Check** ist als manueller Demo-Button verfügbar
  (Aktionen-Tab); die Funktion `evaluateYearlyVoucher` ist so geschrieben,
  dass sie 1:1 in einen jährlichen Server-Job übernommen werden kann.
- **KI-Generator** ist ein deterministischer Mock-Textbaukasten (kombiniert
  System-Vorgaben, Thema, Ton) – kein Aufruf eines externen LLM-Dienstes.
  Signatur (`generateSocialPost`) ist so gehalten, dass ein echter API-Call
  sie ersetzen kann, ohne die UI anzufassen.
- **e-vendo/HubSpot Live-Clients** (`evendoLive.ts`, `hubspotLive.ts`) sind
  reale `fetch`-Implementierungen gegen die jeweilige REST-API, aber gegen
  keine echten Zugangsdaten getestet – Endpunkte/Payloads sollten vor
  Live-Rollout gegen die tatsächliche e-vendo-Doku bzw. HubSpot-Property-
  Konfiguration abgeglichen werden.
- **Bonus-Zeiträume** werden im Admin-Formular relativ ("Start in X Tagen /
  Dauer Y Tage") statt über einen nativen Datums-Picker angelegt – bewusst
  ohne zusätzliche Datepicker-Abhängigkeit gehalten.

## Verhältnis zum Kundenbestellportal (Repo-Root)

Dieses Verzeichnis ist eine eigenständige App neben dem bestehenden
Next.js-Kundenbestellportal (Kanban-Bestellverwaltung + Kiosk) im Repo-Root.
Beide bedienen unterschiedliche Anforderungen (Bestellabwicklung vs.
Kundenkarte/Treue/CRM) und teilen sich aktuell **keine** Datenbasis. Eine
spätere Verzahnung (z. B. ein gemeinsamer Kundenpool statt zweier getrennter
Mock-/DB-Stände) wäre ein bewusster, separater Schritt.

## Build & Checks

```bash
npx tsc --noEmit          # Typprüfung
npx expo export --platform web   # Voller Bundling-Check (alle Routen)
npx expo lint
```
