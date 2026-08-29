import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { MOCK_CUSTOMERS } from '@/mocks/customers';
import type { Customer } from '@/types';
import { createId } from '@/utils/id';

export type NewCustomerInput = Pick<Customer, 'firstName' | 'lastName' | 'email' | 'phone'> &
  Partial<Pick<Customer, 'address' | 'gdprMarketingConsent' | 'notes'>>;

interface CustomerState {
  customers: Customer[];
  nextCustomerSeq: number;

  addCustomer: (input: NewCustomerInput) => Customer;
  updateCustomer: (id: string, patch: Partial<Customer>) => void;
  removeTag: (id: string, tag: string) => void;
  addTag: (id: string, tag: string) => void;
  markPurchaseNow: (id: string) => void;
}

export const useCustomerStore = create<CustomerState>()(
  persist(
    (set, get) => ({
      customers: MOCK_CUSTOMERS,
      nextCustomerSeq: MOCK_CUSTOMERS.length + 1,

      addCustomer: (input) => {
        const seq = get().nextCustomerSeq;
        const customer: Customer = {
          id: createId('cus'),
          customerNumber: `CK-${100000 + seq}`,
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          phone: input.phone,
          address: input.address,
          notes: input.notes,
          gdprMarketingConsent: input.gdprMarketingConsent ?? false,
          createdAt: new Date().toISOString(),
          lastPurchaseAt: null,
          tags: ['Neukundin'],
        };
        set((state) => ({
          customers: [customer, ...state.customers],
          nextCustomerSeq: state.nextCustomerSeq + 1,
        }));
        return customer;
      },

      updateCustomer: (id, patch) =>
        set((state) => ({
          customers: state.customers.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),

      addTag: (id, tag) =>
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === id && !c.tags.includes(tag) ? { ...c, tags: [...c.tags, tag] } : c,
          ),
        })),

      removeTag: (id, tag) =>
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === id ? { ...c, tags: c.tags.filter((t) => t !== tag) } : c,
          ),
        })),

      markPurchaseNow: (id) =>
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === id ? { ...c, lastPurchaseAt: new Date().toISOString() } : c,
          ),
        })),
    }),
    {
      name: 'kundenpilot.customers',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
