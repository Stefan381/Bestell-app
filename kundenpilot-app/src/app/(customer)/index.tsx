import { Redirect } from 'expo-router';
import { Text, View } from 'react-native';

import { PointsSummary } from '@/components/customer/PointsSummary';
import { QRCodeCard } from '@/components/customer/QRCodeCard';
import { Screen } from '@/components/ui/Screen';
import { useCurrentCustomer } from '@/hooks/useCurrentCustomer';
import { useReengagementCheck } from '@/hooks/useReengagementCheck';
import { activeMultiplier } from '@/services/loyalty/loyaltyEngine';
import { useLoyaltyStore } from '@/state/loyaltyStore';

export default function CustomerHomeScreen() {
  const { customer, account } = useCurrentCustomer();
  const bonusPeriods = useLoyaltyStore((s) => s.bonusPeriods);
  useReengagementCheck(customer);

  if (!customer || !account) return <Redirect href="/(auth)/login" />;

  const multiplier = activeMultiplier(bonusPeriods);

  return (
    <Screen>
      <View>
        <Text className="text-sm text-ink-400">Willkommen zurück,</Text>
        <Text className="text-2xl font-extrabold text-ink-900 dark:text-ink-50">{customer.firstName}!</Text>
      </View>

      <QRCodeCard customerNumber={customer.customerNumber} displayName={`${customer.firstName} ${customer.lastName}`} />
      <PointsSummary pointsBalance={account.pointsBalance} multiplier={multiplier} />
    </Screen>
  );
}
