import type { EvendoConfig } from '@/types';
import type { EvendoClient, EvendoCustomerLookup, EvendoReceiptRecord, EvendoReceiptSubmission } from './types';

/**
 * Dünner REST-Client für die echte e-vendo Kassen-API. Endpunkte/Payload
 * folgen der e-vendo REST-Doku und müssten beim Live-Rollout final gegen
 * die tatsächliche Schnittstelle abgeglichen werden – Interface (EvendoClient)
 * bleibt dabei unverändert, sodass UI/Stores nichts davon merken.
 */
export function createEvendoLiveClient(config: EvendoConfig): EvendoClient {
  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${config.baseUrl.replace(/\/$/, '')}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
        ...init?.headers,
      },
    });
    if (!res.ok) {
      throw new Error(`e-vendo API Fehler ${res.status}: ${await res.text()}`);
    }
    return (await res.json()) as T;
  }

  return {
    resolveCustomer(customerNumberOrCode) {
      return request<EvendoCustomerLookup | null>(
        `/customers/${encodeURIComponent(customerNumberOrCode)}?storeId=${config.storeId}`,
      );
    },
    submitReceipt(payload: EvendoReceiptSubmission) {
      return request<EvendoReceiptRecord>('/receipts', {
        method: 'POST',
        body: JSON.stringify({ ...payload, storeId: config.storeId }),
      });
    },
    getArticleHistory(customerNumber) {
      return request<EvendoReceiptRecord[]>(
        `/customers/${encodeURIComponent(customerNumber)}/receipts?storeId=${config.storeId}`,
      );
    },
  };
}
