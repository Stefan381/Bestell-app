import { createId } from '@/utils/id';
import type { HubspotClient, HubspotSyncResult } from './types';

function delay<T>(value: T, ms = 200): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

/** Simulierte HubSpot-Synchronisation – protokolliert nur, ohne echten Netzwerkaufruf. */
export function createHubspotMockClient(): HubspotClient {
  return {
    async syncCustomer(customer, loyalty) {
      const result: HubspotSyncResult = {
        hubspotContactId: customer.hubspotContactId ?? createId('hs_contact'),
        syncedAt: new Date().toISOString(),
      };
      if (__DEV__) {
        console.log(
          `[HubSpot Mock] Sync ${customer.email} · Punkte: ${loyalty.pointsBalance} · Kontakt: ${result.hubspotContactId}`,
        );
      }
      return delay(result);
    },
    async syncMany(entries) {
      const results: HubspotSyncResult[] = [];
      for (const entry of entries) {
        results.push(await this.syncCustomer(entry.customer, entry.loyalty));
      }
      return results;
    },
  };
}
