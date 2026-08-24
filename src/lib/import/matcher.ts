import { normalizeEmail, normalizePhone } from "./normalize";

export interface MatchableCustomer {
  id: string;
  email?: string | null;
  phone?: string | null;
}

export interface CustomerCandidate {
  email?: string | null;
  phone?: string | null;
}

/**
 * Finds an existing customer that matches the candidate by normalized email
 * or normalized phone. This is the single source of truth for "is this the
 * same customer" across CSV import today and any future live Kasse/HubSpot
 * sync — both call this instead of re-implementing dedup logic.
 */
export function findDuplicateCustomer<T extends MatchableCustomer>(
  candidate: CustomerCandidate,
  existing: T[]
): T | null {
  const email = normalizeEmail(candidate.email);
  const phone = normalizePhone(candidate.phone);

  if (email) {
    const byEmail = existing.find((c) => normalizeEmail(c.email) === email);
    if (byEmail) return byEmail;
  }

  if (phone) {
    const byPhone = existing.find((c) => normalizePhone(c.phone) === phone);
    if (byPhone) return byPhone;
  }

  return null;
}
