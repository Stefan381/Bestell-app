import { useCustomerStore } from '@/state/customerStore';
import { useAuthStore } from '@/state/authStore';
import { useLoyaltyStore } from '@/state/loyaltyStore';
import { createEmptyAccount } from '@/services/loyalty/loyaltyEngine';

export function useCurrentCustomer() {
  const session = useAuthStore((s) => s.session);
  const customerId = session?.role === 'customer' ? session.customerId : undefined;

  const customer = useCustomerStore((s) => s.customers.find((c) => c.id === customerId));
  const account = useLoyaltyStore((s) =>
    customerId ? s.accounts[customerId] ?? createEmptyAccount(customerId) : undefined,
  );

  return { customer, account };
}
