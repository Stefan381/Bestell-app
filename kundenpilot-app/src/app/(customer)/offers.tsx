import { useState } from 'react';
import { Redirect } from 'expo-router';
import { Text, View } from 'react-native';

import { OfferCard } from '@/components/customer/OfferCard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useCurrentCustomer } from '@/hooks/useCurrentCustomer';
import { findActiveBonusPeriod, YEARLY_VOUCHER_MIN_POINTS } from '@/services/loyalty/loyaltyEngine';
import { useLoyaltyStore } from '@/state/loyaltyStore';
import { formatDate, formatEuroFromCents } from '@/utils/date';

export default function OffersScreen() {
  const { customer, account } = useCurrentCustomer();
  const bonusPeriods = useLoyaltyStore((s) => s.bonusPeriods);
  const vouchers = useLoyaltyStore((s) => s.vouchers.filter((v) => v.customerId === customer?.id));
  const runYearlyVoucherCheck = useLoyaltyStore((s) => s.runYearlyVoucherCheck);
  const [checkMessage, setCheckMessage] = useState<string | null>(null);

  if (!customer || !account) return <Redirect href="/(auth)/login" />;

  const activePeriods = bonusPeriods.filter((p) => p.active);
  const active = findActiveBonusPeriod(bonusPeriods);

  function handleYearlyCheck() {
    const voucher = runYearlyVoucherCheck(customer!.id);
    setCheckMessage(
      voucher
        ? `🎉 Neuer Jahres-Gutschein über ${formatEuroFromCents(voucher.valueCents)} erstellt!`
        : `Noch kein Gutschein möglich – ab ${YEARLY_VOUCHER_MIN_POINTS} Punkten und einmal pro Jahr.`,
    );
  }

  return (
    <Screen>
      <SectionHeader title="Aktuelle Aktionen" />
      {activePeriods.length === 0 ? (
        <EmptyState icon="flash-outline" title="Keine Aktion aktiv" message="Schau bald wieder vorbei!" />
      ) : (
        <View className="gap-3">
          {activePeriods.map((period) => (
            <OfferCard key={period.id} period={period} />
          ))}
        </View>
      )}
      {active ? (
        <Text className="text-xs text-ink-400">
          Aktuell erhältst du {active.multiplier}x Punkte auf jeden Einkauf.
        </Text>
      ) : null}

      <SectionHeader title="Jahres-Gutschein" />
      <Card className="gap-3">
        <Text className="text-sm text-ink-500 dark:text-ink-300">
          Am Jahresende prüft KundenPilot automatisch deinen Punktestand und wandelt volle 100er-Schritte
          in einen Gutschein um (100 Punkte = 1 €). Rest-Punkte bleiben erhalten.
        </Text>
        <Button label="Jetzt prüfen (Demo)" variant="secondary" onPress={handleYearlyCheck} />
        {checkMessage ? <Text className="text-sm text-brand-600">{checkMessage}</Text> : null}
      </Card>

      {vouchers.length > 0 ? (
        <View className="gap-2">
          {vouchers.map((voucher) => (
            <View
              key={voucher.id}
              className="flex-row items-center justify-between rounded-2xl bg-white dark:bg-ink-800 border border-ink-100 dark:border-ink-800/60 p-4"
            >
              <View>
                <Text className="font-semibold text-ink-900 dark:text-ink-50">
                  Jahres-Gutschein {voucher.year}
                </Text>
                <Text className="text-xs text-ink-400">{formatDate(voucher.createdAt)}</Text>
              </View>
              <Text className="font-bold text-brand-600">{formatEuroFromCents(voucher.valueCents)}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </Screen>
  );
}
