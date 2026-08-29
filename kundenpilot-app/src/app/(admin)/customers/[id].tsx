import { useMemo, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { TextField } from '@/components/ui/TextField';
import { receiptsForCustomer } from '@/mocks/receipts';
import { createHubspotClient } from '@/services/hubspot/hubspotService';
import { openMailto, openWhatsApp } from '@/services/share/deepLinks';
import { useCustomerStore } from '@/state/customerStore';
import { useLoyaltyStore } from '@/state/loyaltyStore';
import { useSettingsStore } from '@/state/settingsStore';
import { formatDate, formatDateTime, formatEuroFromCents } from '@/utils/date';

export default function CustomerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const customer = useCustomerStore((s) => s.customers.find((c) => c.id === id));
  const updateCustomer = useCustomerStore((s) => s.updateCustomer);
  const account = useLoyaltyStore((s) => (id ? s.accounts[id] : undefined));
  const transactions = useLoyaltyStore((s) => s.transactions.filter((t) => t.customerId === id));
  const addManualAdjustment = useLoyaltyStore((s) => s.addManualAdjustment);
  const hubspotConfig = useSettingsStore((s) => s.hubspotConfig);
  const markHubspotSynced = useSettingsStore((s) => s.markHubspotSynced);

  const [notes, setNotes] = useState(customer?.notes ?? '');
  const [adjustPoints, setAdjustPoints] = useState('');
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const receipts = useMemo(() => (id ? receiptsForCustomer(id) : []), [id]);

  if (!customer || !account) {
    return (
      <Screen>
        <EmptyState icon="person-remove-outline" title="Kunde nicht gefunden" message="" />
      </Screen>
    );
  }

  function handleSaveNotes() {
    updateCustomer(customer!.id, { notes });
    Alert.alert('Gespeichert', 'Notiz wurde aktualisiert.');
  }

  function handleAdjustPoints(sign: 1 | -1) {
    const value = parseInt(adjustPoints, 10);
    if (!Number.isFinite(value) || value <= 0) return;
    addManualAdjustment(customer!.id, value * sign, 'Manuelle Anpassung durch Mitarbeiter:in');
    setAdjustPoints('');
  }

  async function handleHubspotSync() {
    setSyncStatus('Synchronisiere…');
    try {
      const client = createHubspotClient(hubspotConfig);
      const result = await client.syncCustomer(customer!, account!);
      updateCustomer(customer!.id, { hubspotContactId: result.hubspotContactId });
      markHubspotSynced();
      setSyncStatus(`Synchronisiert · Kontakt ${result.hubspotContactId}`);
    } catch (e) {
      setSyncStatus(e instanceof Error ? e.message : 'Fehler bei der Synchronisation');
    }
  }

  return (
    <Screen>
      <View className="flex-row items-center gap-2">
        <Button label="" icon={<Ionicons name="arrow-back" size={18} color="#1E6F5C" />} variant="ghost" size="sm" onPress={() => router.back()} />
        <Text className="text-xl font-extrabold text-ink-900 dark:text-ink-50">
          {customer.firstName} {customer.lastName}
        </Text>
      </View>

      <Card className="gap-2">
        <View className="flex-row justify-between items-center">
          <Badge label={customer.customerNumber} tone="brand" />
          <Text className="text-2xl font-extrabold text-brand-600">{account.pointsBalance} Pkt.</Text>
        </View>
        <View className="flex-row gap-2">
          <Button
            label="E-Mail"
            size="sm"
            variant="secondary"
            icon={<Ionicons name="mail" size={14} color="#1E6F5C" />}
            onPress={() => openMailto([customer.email], 'Nachricht von Citykauf', `Hallo ${customer.firstName},\n\n`)}
          />
          <Button
            label="WhatsApp"
            size="sm"
            variant="secondary"
            icon={<Ionicons name="logo-whatsapp" size={14} color="#1E6F5C" />}
            onPress={() => openWhatsApp(customer.phone, `Hallo ${customer.firstName}, `)}
          />
        </View>
      </Card>

      <SectionHeader title="Stammdaten" />
      <Card className="gap-3">
        <TextField label="E-Mail" value={customer.email} onChangeText={(v) => updateCustomer(customer.id, { email: v })} autoCapitalize="none" />
        <TextField label="Telefon" value={customer.phone} onChangeText={(v) => updateCustomer(customer.id, { phone: v })} />
        <TextField label="Notizen" value={notes} onChangeText={setNotes} multiline numberOfLines={3} />
        <Button label="Notizen speichern" variant="secondary" onPress={handleSaveNotes} />
      </Card>

      <SectionHeader title="Punkte manuell anpassen" />
      <Card className="gap-3">
        <TextField label="Anzahl Punkte" keyboardType="number-pad" value={adjustPoints} onChangeText={setAdjustPoints} placeholder="z.B. 20" />
        <View className="flex-row gap-2">
          <View className="flex-1">
            <Button label="Gutschreiben" onPress={() => handleAdjustPoints(1)} fullWidth />
          </View>
          <View className="flex-1">
            <Button label="Abziehen" variant="danger" onPress={() => handleAdjustPoints(-1)} fullWidth />
          </View>
        </View>
      </Card>

      <SectionHeader title="HubSpot CRM" />
      <Card className="gap-2">
        <Text className="text-xs text-ink-400">
          {customer.hubspotContactId ? `Verknüpft: ${customer.hubspotContactId}` : 'Noch nicht synchronisiert'}
        </Text>
        <Button label="Jetzt synchronisieren" variant="secondary" onPress={handleHubspotSync} />
        {syncStatus ? <Text className="text-xs text-brand-600">{syncStatus}</Text> : null}
      </Card>

      <SectionHeader title="Punkte-Verlauf" />
      <View className="gap-2">
        {transactions
          .slice()
          .reverse()
          .map((tx) => (
            <View key={tx.id} className="flex-row justify-between rounded-xl bg-white dark:bg-ink-800 border border-ink-100 dark:border-ink-800/60 px-3 py-2">
              <View className="flex-1 pr-2">
                <Text className="text-sm text-ink-800 dark:text-ink-100">{tx.note}</Text>
                <Text className="text-[10px] text-ink-400">{formatDateTime(tx.createdAt)}</Text>
              </View>
              <Text className={tx.points >= 0 ? 'font-bold text-brand-600' : 'font-bold text-red-500'}>
                {tx.points >= 0 ? '+' : ''}
                {tx.points}
              </Text>
            </View>
          ))}
      </View>

      <SectionHeader title="Artikelhistorie (e-vendo)" />
      {receipts.length === 0 ? (
        <EmptyState icon="receipt-outline" title="Keine Bons" message="Noch keine erfassten Einkäufe." />
      ) : (
        <View className="gap-2">
          {receipts.map((r) => (
            <View key={r.id} className="rounded-xl bg-white dark:bg-ink-800 border border-ink-100 dark:border-ink-800/60 p-3">
              <View className="flex-row justify-between">
                <Text className="text-sm font-medium text-ink-800 dark:text-ink-100">{formatDate(r.createdAt)}</Text>
                <Text className="text-sm font-bold text-ink-900 dark:text-ink-50">{formatEuroFromCents(r.totalCents)}</Text>
              </View>
              <Text className="text-xs text-ink-400" numberOfLines={1}>
                {r.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
              </Text>
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}
