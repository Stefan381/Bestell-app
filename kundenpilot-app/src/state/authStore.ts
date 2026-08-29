import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { MOCK_ADMIN_USERS } from '@/mocks/adminUsers';
import { useCustomerStore, type NewCustomerInput } from '@/state/customerStore';
import { useLoyaltyStore } from '@/state/loyaltyStore';

export type Session =
  | { role: 'customer'; customerId: string }
  | { role: 'admin'; adminUserId: string }
  | null;

interface AuthState {
  session: Session;
  loginCustomerByEmail: (email: string) => boolean;
  registerCustomer: (input: NewCustomerInput) => string;
  loginAdminByEmail: (email: string) => boolean;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,

      loginCustomerByEmail: (email) => {
        const normalized = email.trim().toLowerCase();
        const match = useCustomerStore
          .getState()
          .customers.find((c) => c.email.toLowerCase() === normalized);
        if (!match) return false;
        set({ session: { role: 'customer', customerId: match.id } });
        return true;
      },

      registerCustomer: (input) => {
        const customer = useCustomerStore.getState().addCustomer(input);
        useLoyaltyStore.getState().grantWelcomeBonus(customer.id);
        set({ session: { role: 'customer', customerId: customer.id } });
        return customer.id;
      },

      loginAdminByEmail: (email) => {
        const normalized = email.trim().toLowerCase();
        const match = MOCK_ADMIN_USERS.find((a) => a.email.toLowerCase() === normalized);
        if (!match) return false;
        set({ session: { role: 'admin', adminUserId: match.id } });
        return true;
      },

      logout: () => set({ session: null }),
    }),
    {
      name: 'kundenpilot.auth',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
