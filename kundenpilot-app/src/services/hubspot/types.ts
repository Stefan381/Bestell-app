import type { Customer, LoyaltyAccount } from '@/types';

export interface HubspotSyncResult {
  hubspotContactId: string;
  syncedAt: string;
}

/**
 * Vertrag für die HubSpot-Synchronisation. `syncCustomer` schreibt
 * Stammdaten + Punktestand nach HubSpot (One-Way) bzw. gleicht sie ab
 * (bi-direktional, je nach HubspotConfig.syncDirection).
 */
export interface HubspotClient {
  syncCustomer(customer: Customer, loyalty: LoyaltyAccount): Promise<HubspotSyncResult>;
  syncMany(entries: { customer: Customer; loyalty: LoyaltyAccount }[]): Promise<HubspotSyncResult[]>;
}
