import { MOCK_CUSTOMERS } from '@/mocks/customers';
import { MOCK_RECEIPTS } from '@/mocks/receipts';
import { createId } from '@/utils/id';
import type { EvendoClient, EvendoCustomerLookup, EvendoReceiptRecord, EvendoReceiptSubmission } from './types';

function delay<T>(value: T, ms = 250): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

/**
 * Simuliert die e-vendo Kassen-REST-API: Kunden-ID-Abgleich, Bon-Übermittlung
 * und Artikelhistorie, komplett auf Basis der lokalen Mock-Daten.
 */
export function createEvendoMockClient(): EvendoClient {
  return {
    async resolveCustomer(customerNumberOrCode) {
      const normalized = customerNumberOrCode.trim().toUpperCase();
      const match = MOCK_CUSTOMERS.find(
        (c) => c.customerNumber.toUpperCase() === normalized || c.id === customerNumberOrCode,
      );
      if (!match) return delay(null);
      const lookup: EvendoCustomerLookup = {
        customerNumber: match.customerNumber,
        firstName: match.firstName,
        lastName: match.lastName,
      };
      return delay(lookup);
    },

    async submitReceipt(payload: EvendoReceiptSubmission) {
      const record: EvendoReceiptRecord = {
        ...payload,
        receiptId: createId('evendo_rcpt'),
        createdAt: new Date().toISOString(),
      };
      return delay(record);
    },

    async getArticleHistory(customerNumber) {
      const customer = MOCK_CUSTOMERS.find((c) => c.customerNumber === customerNumber);
      if (!customer) return delay([]);
      const records: EvendoReceiptRecord[] = MOCK_RECEIPTS.filter(
        (r) => r.customerId === customer.id,
      ).map((r) => ({
        customerNumber,
        storeId: 'store_innenstadt',
        items: r.items.map((i) => ({
          articleId: i.articleId,
          name: i.name,
          quantity: i.quantity,
          unitPriceCents: i.unitPriceCents,
        })),
        totalCents: r.totalCents,
        receiptId: r.id,
        createdAt: r.createdAt,
      }));
      return delay(records);
    },
  };
}
