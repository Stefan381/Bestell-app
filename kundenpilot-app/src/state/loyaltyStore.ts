import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { MOCK_BONUS_PERIODS } from '@/mocks/bonusPeriods';
import { MOCK_CUSTOMERS } from '@/mocks/customers';
import { receiptsForCustomer } from '@/mocks/receipts';
import {
  activeMultiplier,
  createEmptyAccount,
  evaluateYearlyVoucher,
  pointsForPurchase,
  WELCOME_BONUS_POINTS,
} from '@/services/loyalty/loyaltyEngine';
import type { BonusPeriod, LoyaltyAccount, PointsTransaction, VoucherAward } from '@/types';
import { createId } from '@/utils/id';

function buildInitialAccounts(): Record<string, LoyaltyAccount> {
  const accounts: Record<string, LoyaltyAccount> = {};
  for (const customer of MOCK_CUSTOMERS) {
    const receipts = receiptsForCustomer(customer.id);
    const pointsFromReceipts = receipts.reduce((sum, r) => sum + r.pointsEarned, 0);
    accounts[customer.id] = {
      customerId: customer.id,
      pointsBalance: pointsFromReceipts + WELCOME_BONUS_POINTS,
      pointsLifetime: pointsFromReceipts + WELCOME_BONUS_POINTS,
      welcomeBonusGranted: true,
    };
  }
  return accounts;
}

function buildInitialTransactions(): PointsTransaction[] {
  const transactions: PointsTransaction[] = [];
  for (const customer of MOCK_CUSTOMERS) {
    transactions.push({
      id: createId('tx'),
      customerId: customer.id,
      kind: 'welcome_bonus',
      points: WELCOME_BONUS_POINTS,
      note: 'Willkommens-Bonus bei Registrierung',
      createdAt: customer.createdAt,
    });
    for (const receipt of receiptsForCustomer(customer.id)) {
      transactions.push({
        id: createId('tx'),
        customerId: customer.id,
        kind: receipt.pointsMultiplier > 1 ? 'bonus_multiplier' : 'purchase',
        points: receipt.pointsEarned,
        note:
          receipt.pointsMultiplier > 1
            ? `Einkauf mit ${receipt.pointsMultiplier}x Bonuspunkten`
            : 'Einkauf an der Kasse',
        createdAt: receipt.createdAt,
        receiptId: receipt.id,
      });
    }
  }
  return transactions.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

interface LoyaltyState {
  accounts: Record<string, LoyaltyAccount>;
  transactions: PointsTransaction[];
  bonusPeriods: BonusPeriod[];
  vouchers: VoucherAward[];

  ensureAccount: (customerId: string) => LoyaltyAccount;
  grantWelcomeBonus: (customerId: string) => void;
  recordPurchase: (customerId: string, amountCents: number, receiptId?: string) => PointsTransaction;
  addManualAdjustment: (customerId: string, points: number, note: string) => void;
  addBonusPeriod: (period: Omit<BonusPeriod, 'id'>) => void;
  updateBonusPeriod: (id: string, patch: Partial<BonusPeriod>) => void;
  removeBonusPeriod: (id: string) => void;
  runYearlyVoucherCheck: (customerId: string, year?: number) => VoucherAward | null;
  redeemVoucher: (voucherId: string) => void;
}

export const useLoyaltyStore = create<LoyaltyState>()(
  persist(
    (set, get) => ({
      accounts: buildInitialAccounts(),
      transactions: buildInitialTransactions(),
      bonusPeriods: MOCK_BONUS_PERIODS,
      vouchers: [],

      ensureAccount: (customerId) => {
        const existing = get().accounts[customerId];
        if (existing) return existing;
        const fresh = createEmptyAccount(customerId);
        set((state) => ({ accounts: { ...state.accounts, [customerId]: fresh } }));
        return fresh;
      },

      grantWelcomeBonus: (customerId) => {
        const account = get().ensureAccount(customerId);
        if (account.welcomeBonusGranted) return;
        set((state) => ({
          accounts: {
            ...state.accounts,
            [customerId]: {
              ...account,
              pointsBalance: account.pointsBalance + WELCOME_BONUS_POINTS,
              pointsLifetime: account.pointsLifetime + WELCOME_BONUS_POINTS,
              welcomeBonusGranted: true,
            },
          },
          transactions: [
            ...state.transactions,
            {
              id: createId('tx'),
              customerId,
              kind: 'welcome_bonus',
              points: WELCOME_BONUS_POINTS,
              note: 'Willkommens-Bonus bei Registrierung',
              createdAt: new Date().toISOString(),
            },
          ],
        }));
      },

      recordPurchase: (customerId, amountCents, receiptId) => {
        const account = get().ensureAccount(customerId);
        const multiplier = activeMultiplier(get().bonusPeriods);
        const points = pointsForPurchase(amountCents, multiplier);
        const transaction: PointsTransaction = {
          id: createId('tx'),
          customerId,
          kind: multiplier > 1 ? 'bonus_multiplier' : 'purchase',
          points,
          note:
            multiplier > 1
              ? `Einkauf mit ${multiplier}x Bonuspunkten`
              : 'Einkauf an der Kasse',
          createdAt: new Date().toISOString(),
          receiptId,
        };
        set((state) => ({
          accounts: {
            ...state.accounts,
            [customerId]: {
              ...account,
              pointsBalance: account.pointsBalance + points,
              pointsLifetime: account.pointsLifetime + points,
            },
          },
          transactions: [...state.transactions, transaction],
        }));
        return transaction;
      },

      addManualAdjustment: (customerId, points, note) => {
        const account = get().ensureAccount(customerId);
        set((state) => ({
          accounts: {
            ...state.accounts,
            [customerId]: {
              ...account,
              pointsBalance: account.pointsBalance + points,
              pointsLifetime: account.pointsLifetime + Math.max(points, 0),
            },
          },
          transactions: [
            ...state.transactions,
            {
              id: createId('tx'),
              customerId,
              kind: 'manual_adjustment',
              points,
              note,
              createdAt: new Date().toISOString(),
            },
          ],
        }));
      },

      addBonusPeriod: (period) =>
        set((state) => ({
          bonusPeriods: [...state.bonusPeriods, { ...period, id: createId('bonus') }],
        })),

      updateBonusPeriod: (id, patch) =>
        set((state) => ({
          bonusPeriods: state.bonusPeriods.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),

      removeBonusPeriod: (id) =>
        set((state) => ({ bonusPeriods: state.bonusPeriods.filter((p) => p.id !== id) })),

      runYearlyVoucherCheck: (customerId, year = new Date().getFullYear()) => {
        const account = get().ensureAccount(customerId);
        const result = evaluateYearlyVoucher(account, year);
        if (!result.eligible) return null;
        const voucher: VoucherAward = {
          id: createId('voucher'),
          customerId,
          year,
          valueCents: result.valueCents,
          pointsRedeemed: result.pointsToRedeem,
          createdAt: new Date().toISOString(),
          redeemed: false,
        };
        set((state) => ({
          accounts: {
            ...state.accounts,
            [customerId]: {
              ...account,
              pointsBalance: account.pointsBalance - result.pointsToRedeem,
              lastYearlyVoucherYear: year,
            },
          },
          vouchers: [...state.vouchers, voucher],
          transactions: [
            ...state.transactions,
            {
              id: createId('tx'),
              customerId,
              kind: 'yearly_voucher',
              points: -result.pointsToRedeem,
              note: `Jahres-Gutschein ${year} erstellt`,
              createdAt: new Date().toISOString(),
            },
          ],
        }));
        return voucher;
      },

      redeemVoucher: (voucherId) =>
        set((state) => ({
          vouchers: state.vouchers.map((v) => (v.id === voucherId ? { ...v, redeemed: true } : v)),
        })),
    }),
    {
      name: 'kundenpilot.loyalty',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
