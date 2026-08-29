import { Redirect } from 'expo-router';
import { Text, View } from 'react-native';

import { ReceiptListItem } from '@/components/customer/ReceiptListItem';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useCurrentCustomer } from '@/hooks/useCurrentCustomer';
import { receiptsForCustomer } from '@/mocks/receipts';

export default function HistoryScreen() {
  const { customer } = useCurrentCustomer();
  if (!customer) return <Redirect href="/(auth)/login" />;

  const receipts = receiptsForCustomer(customer.id);

  return (
    <Screen>
      <SectionHeader title="Deine Kassenbons" />
      {receipts.length === 0 ? (
        <EmptyState
          icon="receipt-outline"
          title="Noch keine Einkäufe"
          message="Sobald du an der Kasse deinen Code scannen lässt, erscheinen deine Bons hier."
        />
      ) : (
        <View className="gap-3">
          {receipts.map((receipt) => (
            <ReceiptListItem key={receipt.id} receipt={receipt} />
          ))}
        </View>
      )}
    </Screen>
  );
}
