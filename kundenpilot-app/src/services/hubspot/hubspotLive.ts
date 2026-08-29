import type { HubspotConfig, Customer, LoyaltyAccount } from '@/types';
import type { HubspotClient, HubspotSyncResult } from './types';

const HUBSPOT_API_BASE = 'https://api.hubapi.com';

/**
 * Schreibt Kundendaten + Punktestand als HubSpot-Kontakt (CRM API v3).
 * Erwartet in HubSpot die Custom Properties `kundenpilot_punktestand` und
 * `kundenpilot_kundennummer` (per HubSpot-Property-Einstellungen anzulegen).
 */
export function createHubspotLiveClient(config: HubspotConfig): HubspotClient {
  async function upsert(customer: Customer, loyalty: LoyaltyAccount): Promise<HubspotSyncResult> {
    const res = await fetch(`${HUBSPOT_API_BASE}/crm/v3/objects/contacts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        properties: {
          email: customer.email,
          firstname: customer.firstName,
          lastname: customer.lastName,
          phone: customer.phone,
          kundenpilot_kundennummer: customer.customerNumber,
          kundenpilot_punktestand: String(loyalty.pointsBalance),
        },
      }),
    });
    if (!res.ok) {
      throw new Error(`HubSpot API Fehler ${res.status}: ${await res.text()}`);
    }
    const body = (await res.json()) as { id: string };
    return { hubspotContactId: body.id, syncedAt: new Date().toISOString() };
  }

  return {
    syncCustomer: upsert,
    async syncMany(entries) {
      const results: HubspotSyncResult[] = [];
      for (const entry of entries) {
        results.push(await upsert(entry.customer, entry.loyalty));
      }
      return results;
    },
  };
}
