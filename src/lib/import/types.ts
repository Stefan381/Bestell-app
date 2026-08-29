/**
 * Normalized shape every import source (CSV/Excel upload today, a live
 * Kasse/HubSpot API sync tomorrow) must produce. Persistence and dedup logic
 * only ever deal with these shapes, never with raw source rows.
 */
export interface NormalizedCustomerRow {
  firstName?: string | null;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  externalRef?: string | null;
  notes?: string | null;
}

export interface NormalizedArticleRow {
  articleNumber: string;
  name: string;
  price: number;
  ean?: string | null;
  category?: string | null;
  stock?: number | null;
}

/** A source of customer rows. CSV upload is one implementation; a future
 * live Kasse/HubSpot connector is another — callers (the import commit
 * logic) don't need to change either way. */
export interface CustomerSource {
  fetchCustomers(): Promise<NormalizedCustomerRow[]>;
}

export interface ArticleSource {
  fetchArticles(): Promise<NormalizedArticleRow[]>;
}

export type ParsedTable = {
  headers: string[];
  rows: Record<string, string>[];
};

export const CUSTOMER_TARGET_FIELDS = [
  "firstName",
  "lastName",
  "email",
  "phone",
  "externalRef",
  "notes",
] as const;

export const ARTICLE_TARGET_FIELDS = [
  "articleNumber",
  "name",
  "price",
  "ean",
  "category",
  "stock",
] as const;

export type CustomerTargetField = (typeof CUSTOMER_TARGET_FIELDS)[number];
export type ArticleTargetField = (typeof ARTICLE_TARGET_FIELDS)[number];
