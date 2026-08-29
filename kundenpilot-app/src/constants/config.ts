import type {
  AiGeneratorSettings,
  EvendoConfig,
  GeofenceConfig,
  HubspotConfig,
  NotificationTemplate,
} from '@/types';

// Beispiel-Koordinaten (Musterstadt-Innenstadt) – über Einstellungen im
// Admin-Dashboard anpassbar.
export const DEFAULT_GEOFENCE_CONFIG: GeofenceConfig = {
  latitude: 50.9375,
  longitude: 6.9603,
  radiusMeters: 200,
  storeName: 'Citykauf Filiale Innenstadt',
  openingHours: [
    { weekday: 1, opensAt: '08:00', closesAt: '19:00' },
    { weekday: 2, opensAt: '08:00', closesAt: '19:00' },
    { weekday: 3, opensAt: '08:00', closesAt: '19:00' },
    { weekday: 4, opensAt: '08:00', closesAt: '19:00' },
    { weekday: 5, opensAt: '08:00', closesAt: '20:00' },
    { weekday: 6, opensAt: '08:00', closesAt: '16:00' },
  ],
  approachMessageTitle: 'Du bist in der Nähe von Citykauf! 👋',
  approachMessageBody: 'Schau doch kurz vorbei – heute warten frische Angebote auf dich.',
  reengagementInactivityDays: 30,
  reengagementMessageTitle: 'Wir vermissen dich! 🛒',
  reengagementMessageBody:
    'Hallo {{vorname}}, es ist eine Weile her – als Dankeschön warten Bonuspunkte auf deinen nächsten Einkauf.',
};

export const DEFAULT_EVENDO_CONFIG: EvendoConfig = {
  mode: 'mock',
  baseUrl: 'https://api.e-vendo.example.com/v1',
  apiKey: '',
  storeId: 'store_innenstadt',
};

export const DEFAULT_HUBSPOT_CONFIG: HubspotConfig = {
  enabled: false,
  apiKey: '',
  syncDirection: 'one_way_to_hubspot',
  syncIntervalMinutes: 60,
};

export const DEFAULT_AI_SETTINGS: AiGeneratorSettings = {
  systemInstructions:
    'Ton: freundlich, duzen, Fokus auf Frische & Lokalität. Kurze Sätze, keine Superlative, kein Emoji-Overkill.',
  tone: 'freundlich-persönlich',
  defaultHashtags: ['#Frische', '#Regional'],
};

export const DEFAULT_NOTIFICATION_TEMPLATES: NotificationTemplate[] = [
  {
    id: 'tmpl_email_inactive',
    channel: 'email',
    label: 'Inaktive Kund:innen – Erinnerung',
    subject: 'Wir vermissen dich bei Citykauf!',
    body:
      'Hallo {{vorname}},\n\nes ist eine Weile her seit deinem letzten Besuch. Als Dankeschön schenken wir dir 20 Bonuspunkte bei deinem nächsten Einkauf.\n\nBis bald bei Citykauf!',
  },
  {
    id: 'tmpl_whatsapp_inactive',
    channel: 'whatsapp',
    label: 'Inaktive Kund:innen – WhatsApp',
    body:
      'Hallo {{vorname}}! 👋 Lange nicht gesehen – wir haben 20 Bonuspunkte für deinen nächsten Einkauf bei Citykauf für dich reserviert.',
  },
  {
    id: 'tmpl_email_bonus_weekend',
    channel: 'email',
    label: 'Bonuswochenende ankündigen',
    subject: 'Dieses Wochenende: doppelte Punkte!',
    body:
      'Hallo {{vorname}},\n\ndieses Wochenende gibt es bei jedem Einkauf doppelte Punkte. Wir freuen uns auf dich!',
  },
];

export const OPENING_HOURS_WEEKDAY_LABELS = [
  'Sonntag',
  'Montag',
  'Dienstag',
  'Mittwoch',
  'Donnerstag',
  'Freitag',
  'Samstag',
];
