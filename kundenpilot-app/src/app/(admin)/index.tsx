import { useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';

import { ScannerField } from '@/components/admin/ScannerField';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { TextField } from '@/components/ui/TextField';
import { activeMultiplier, pointsForPurchase } from '@/services/loyalty/loyaltyEngine';
import { useCustomerStore } from '@/state/customerStore';
import { useLoyaltyStore } from '@/state/loyaltyStore';
import type { Customer } from '@/types';
import { formatDate } from '@/utils/date';

export default function AdminScanScreen() {
  const customers = useCustomerStore((s) => s.customers);
  const markPurchaseNow = useCustomerStore((s) => s.markPurchaseNow);
  const recordPurchase = useLoyaltyStore((s) => s.recordPurchase);
  const bonusPeriods = useLoyaltyStore((s) => s.bonusPeriods);
  const accounts = useLoyaltyStore((s) => s.accounts);

  const [found, setFound] = useState<Customer | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [amount, setAmount] = useState('');
  const [lastAward, setLastAward] = useState<number | null>(null);

  function handleResult(code: string) {
    const normalized = code.trim().toUpperCase();
    const match = customers.find(
      (c) => c.customerNumber.toUpperCase() === normalized || c.id === code.trim(),
    );
    setFound(match ?? null);
    setNotFound(!match);
    setLastAward(null);
    setAmount('');
  }

  function handleRecordPurchase() {
    if (!found) return;
    const cents = Math.round(parseFloat(amount.replace(',', '.')) * 100);
    if (!Number.isFinite(cents) || cents <= 0) return;
    const tx = recordPurchase(found.id, cents);
    markPurchaseNow(found.id);
    setLastAward(tx.points);
    setAmount('');
  }

  const multiplier = activeMultiplier(bonusPeriods);
  const previewPoints =
    found && amount ? pointsForPurchase(Math.round(parseFloat(amount.replace(',', '.')) * 100) || 0, multiplier) : 0;

  return (
    <Screen>
      <SectionHeader title="Schnell-Scan an der Kasse" />
      <Card>
        <ScannerField onResult={handleResult} />
      </Card>

      {notFound ? (
        <Card>
          <Text className="text-sm text-red-500">Kein Kunde mit diesem Code gefunden.</Text>
        </Card>
      ) : null}

      {found ? (
        <Card className="gap-3">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-lg font-bold text-ink-900 dark:text-ink-50">
                {found.firstName} {found.lastName}
              </Text>
              <Text className="text-xs text-ink-400">{found.customerNumber}</Text>
            </View>
            <Badge tone="brand" label={`${accounts[found.id]?.pointsBalance ?? 0} Punkte`} />
          </View>
          <Text className="text-xs text-ink-400">
            Letzter Einkauf: {found.lastPurchaseAt ? formatDate(found.lastPurchaseAt) : 'noch keiner'}
          </Text>

          <View className="gap-2">
            <TextField
              label={`Einkaufsbetrag erfassen${multiplier > 1 ? ` (${multiplier}x Bonus aktiv)` : ''}`}
              keyboardType="decimal-pad"
              placeholder="z.B. 24,90"
              value={amount}
              onChangeText={setAmount}
            />
            {amount ? (
              <Text className="text-xs text-brand-600">≈ {previewPoints} Punkte werden gutgeschrieben</Text>
            ) : null}
            <Button label="Einkauf gutschreiben" onPress={handleRecordPurchase} fullWidth />
          </View>

          {lastAward !== null ? (
            <Text className="text-sm font-semibold text-brand-600">
              ✅ {lastAward} Punkte gutgeschrieben.
            </Text>
          ) : null}

          <Button
            label="Kundenkartei öffnen"
            variant="ghost"
            onPress={() => router.push({ pathname: '/(admin)/customers/[id]', params: { id: found.id } })}
          />
        </Card>
      ) : null}
    </Screen>
  );
}
