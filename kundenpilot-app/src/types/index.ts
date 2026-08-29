// Zentrale Domänen-Typen für KundenPilot.
// Diese Typen bilden die Verträge zwischen Mock- und späteren Live-Services
// (e-vendo, HubSpot) und der UI ab.

export type CustomerStatus = 'active' | 'inactive';

export interface Customer {
  id: string;
  customerNumber: string; // e-vendo Kunden-ID, gleichzeitig QR/Barcode-Inhalt
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthday?: string; // YYYY-MM-DD
  address?: {
    street: string;
    zip: string;
    city: string;
  };
  notes?: string;
  gdprMarketingConsent: boolean;
  createdAt: string; // ISO
  lastPurchaseAt: string | null; // ISO, null = noch nie gekauft
  hubspotContactId?: string;
  tags: string[];
}

export interface LoyaltyAccount {
  customerId: string;
  pointsBalance: number;
  pointsLifetime: number;
  welcomeBonusGranted: boolean;
  lastYearlyVoucherYear?: number;
}

export type PointsTransactionKind =
  | 'purchase'
  | 'welcome_bonus'
  | 'bonus_multiplier'
  | 'voucher_redemption'
  | 'yearly_voucher'
  | 'manual_adjustment';

export interface PointsTransaction {
  id: string;
  customerId: string;
  kind: PointsTransactionKind;
  points: number; // positiv = Gutschrift, negativ = Einlösung
  note: string;
  createdAt: string; // ISO
  receiptId?: string;
}

export interface ReceiptItem {
  articleId: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
}

export interface Receipt {
  id: string;
  customerId: string;
  storeName: string;
  createdAt: string; // ISO
  items: ReceiptItem[];
  totalCents: number;
  pointsEarned: number;
  pointsMultiplier: number;
}

export interface BonusPeriod {
  id: string;
  label: string;
  multiplier: number; // z.B. 2 = doppelte Punkte
  startAt: string; // ISO
  endAt: string; // ISO
  active: boolean;
}

export interface VoucherAward {
  id: string;
  customerId: string;
  year: number;
  valueCents: number;
  pointsRedeemed: number;
  createdAt: string;
  redeemed: boolean;
}

export interface GeofenceConfig {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  storeName: string;
  openingHours: {
    weekday: number; // 0 = Sonntag ... 6 = Samstag
    opensAt: string; // "HH:mm"
    closesAt: string; // "HH:mm"
  }[];
  approachMessageTitle: string;
  approachMessageBody: string;
  reengagementInactivityDays: number;
  reengagementMessageTitle: string;
  reengagementMessageBody: string;
}

export interface EvendoConfig {
  mode: 'mock' | 'live';
  baseUrl: string;
  apiKey: string;
  storeId: string;
}

export interface HubspotConfig {
  enabled: boolean;
  apiKey: string;
  syncDirection: 'one_way_to_hubspot' | 'bi_directional';
  syncIntervalMinutes: number;
  lastSyncedAt?: string;
}

export interface AiGeneratorSettings {
  systemInstructions: string;
  tone: string;
  defaultHashtags: string[];
}

export type AdminRole = 'owner' | 'staff';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
}

export type Channel = 'email' | 'whatsapp';

export interface NotificationTemplate {
  id: string;
  channel: Channel;
  label: string;
  subject?: string; // nur E-Mail
  body: string; // unterstützt Platzhalter wie {{vorname}}, {{punkte}}
}
