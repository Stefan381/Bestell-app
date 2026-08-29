import type { Receipt, ReceiptItem } from '@/types';
import { MOCK_CUSTOMERS } from '@/mocks/customers';
import { randomArticles } from '@/mocks/articles';
import { daysAgo } from '@/utils/date';
import { createId } from '@/utils/id';

function buildItems(seed: number): ReceiptItem[] {
  const count = 2 + (seed % 4);
  return randomArticles(count).map((article, i) => ({
    articleId: article.id,
    name: article.name,
    quantity: 1 + ((seed + i) % 3),
    unitPriceCents: article.priceCents,
  }));
}

function itemsTotal(items: ReceiptItem[]): number {
  return items.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0);
}

function buildReceiptsForCustomer(customerId: string, seed: number, lastPurchaseDaysAgo: number): Receipt[] {
  const receiptCount = 1 + (seed % 4);
  const receipts: Receipt[] = [];
  for (let i = 0; i < receiptCount; i++) {
    const daysBack = lastPurchaseDaysAgo + i * (7 + (seed % 5));
    const items = buildItems(seed + i);
    const totalCents = itemsTotal(items);
    const multiplier = i === 0 && seed % 5 === 0 ? 2 : 1;
    receipts.push({
      id: createId('rcpt'),
      customerId,
      storeName: 'Citykauf Filiale Innenstadt',
      createdAt: daysAgo(daysBack),
      items,
      totalCents,
      pointsEarned: Math.round((totalCents / 100) * multiplier),
      pointsMultiplier: multiplier,
    });
  }
  return receipts;
}

export const MOCK_RECEIPTS: Receipt[] = MOCK_CUSTOMERS.flatMap((customer, index) => {
  if (!customer.lastPurchaseAt) return [];
  const daysBack = Math.max(
    0,
    Math.floor((Date.now() - new Date(customer.lastPurchaseAt).getTime()) / (1000 * 60 * 60 * 24)),
  );
  return buildReceiptsForCustomer(customer.id, index + 1, daysBack);
});

export function receiptsForCustomer(customerId: string): Receipt[] {
  return MOCK_RECEIPTS.filter((r) => r.customerId === customerId).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}
