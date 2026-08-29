import type { BonusPeriod, LoyaltyAccount } from '@/types';

/** 1 € Umsatz = 1 Punkt (Basislogik, vor Bonus-Multiplikator). */
export const POINTS_PER_EURO = 1;

/** 100 Punkte = 1 € Gutscheinwert. */
export const POINTS_PER_EURO_VOUCHER = 100;

/** Automatisch bei Erstregistrierung. */
export const WELCOME_BONUS_POINTS = 50;

/** Mindestpunktestand, ab dem der jährliche Logik-Check einen Gutschein erstellt. */
export const YEARLY_VOUCHER_MIN_POINTS = 100;

export function createEmptyAccount(customerId: string): LoyaltyAccount {
  return {
    customerId,
    pointsBalance: 0,
    pointsLifetime: 0,
    welcomeBonusGranted: false,
  };
}

/** Aktiver Bonus-Zeitraum für ein gegebenes Datum, falls vorhanden. */
export function findActiveBonusPeriod(
  periods: BonusPeriod[],
  at: Date = new Date(),
): BonusPeriod | undefined {
  const time = at.getTime();
  return periods.find(
    (p) => p.active && new Date(p.startAt).getTime() <= time && time <= new Date(p.endAt).getTime(),
  );
}

export function activeMultiplier(periods: BonusPeriod[], at: Date = new Date()): number {
  return findActiveBonusPeriod(periods, at)?.multiplier ?? 1;
}

/** Punkte für einen Einkauf inkl. eines evtl. aktiven Bonus-Multiplikators. */
export function pointsForPurchase(amountCents: number, multiplier: number): number {
  return Math.round((amountCents / 100) * POINTS_PER_EURO * multiplier);
}

export function pointsToVoucherValueCents(points: number): number {
  return Math.floor(points / POINTS_PER_EURO_VOUCHER) * 100;
}

export function pointsRedeemableForVoucher(points: number): number {
  return Math.floor(points / POINTS_PER_EURO_VOUCHER) * POINTS_PER_EURO_VOUCHER;
}

export interface YearlyVoucherResult {
  eligible: boolean;
  pointsToRedeem: number;
  valueCents: number;
}

/**
 * Jährlicher Logik-Check: Ist der Kunde für dieses Jahr noch nicht bedient
 * worden und hat genug Punkte für mindestens 1 €, wird ein Gutschein auf
 * Basis des vollen Punktestands erstellt (Rest bleibt als Punkte erhalten).
 */
export function evaluateYearlyVoucher(account: LoyaltyAccount, year: number): YearlyVoucherResult {
  if (account.lastYearlyVoucherYear === year || account.pointsBalance < YEARLY_VOUCHER_MIN_POINTS) {
    return { eligible: false, pointsToRedeem: 0, valueCents: 0 };
  }
  const pointsToRedeem = pointsRedeemableForVoucher(account.pointsBalance);
  return {
    eligible: pointsToRedeem > 0,
    pointsToRedeem,
    valueCents: pointsToVoucherValueCents(pointsToRedeem),
  };
}
