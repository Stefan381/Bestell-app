import { useState } from 'react';
import { Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { TextField } from '@/components/ui/TextField';
import { createHubspotClient } from '@/services/hubspot/hubspotService';
import { useCustomerStore } from '@/state/customerStore';
import { useLoyaltyStore } from '@/state/loyaltyStore';
import { useSettingsStore } from '@/state/settingsStore';
import { formatDateTime } from '@/utils/date';

export default function IntegrationsSettingsScreen() {
  const evendoConfig = useSettingsStore((s) => s.evendoConfig);
  const updateEvendoConfig = useSettingsStore((s) => s.updateEvendoConfig);
  const hubspotConfig = useSettingsStore((s) => s.hubspotConfig);
  const updateHubspotConfig = useSettingsStore((s) => s.updateHubspotConfig);
  const markHubspotSynced = useSettingsStore((s) => s.markHubspotSynced);

  const customers = useCustomerStore((s) => s.customers);
  const accounts = useLoyaltyStore((s) => s.accounts);

  const [syncing, setSyncing] = useState(false);
  const [syncSummary, setSyncSummary] = useState<string | null>(null);

  async function handleSyncAll() {
    setSyncing(true);
    setSyncSummary(null);
    try {
      const client = createHubspotClient(hubspotConfig);
      const entries = customers.map((customer) => ({
        customer,
        loyalty: accounts[customer.id] ?? { customerId: customer.id, pointsBalance: 0, pointsLifetime: 0, welcomeBonusGranted: false },
      }));
      const results = await client.syncMany(entries);
      markHubspotSynced();
      setSyncSummary(`${results.length} Kund:innen synchronisiert.`);
    } catch (e) {
      setSyncSummary(e instanceof Error ? e.message : 'Synchronisation fehlgeschlagen.');
    } finally {
      setSyncing(false);
    }
  }

  return (
    <Screen>
      <View className="flex-row items-center gap-2">
        <Button label="" variant="ghost" size="sm" icon={<Ionicons name="arrow-back" size={18} color="#1E6F5C" />} onPress={() => router.back()} />
        <Text className="text-xl font-extrabold text-ink-900 dark:text-ink-50">Integrationen</Text>
      </View>

      <SectionHeader title="e-vendo Kassen-API" action={<Badge tone={evendoConfig.mode === 'live' ? 'success' : 'neutral'} label={evendoConfig.mode === 'live' ? 'Live' : 'Mock'} />} />
      <Card className="gap-3">
        <View className="flex-row items-center justify-between">
          <Text className="font-medium text-ink-900 dark:text-ink-50">Live-Modus</Text>
          <Switch
            value={evendoConfig.mode === 'live'}
            onValueChange={(v) => updateEvendoConfig({ mode: v ? 'live' : 'mock' })}
          />
        </View>
        <TextField label="Basis-URL" autoCapitalize="none" value={evendoConfig.baseUrl} onChangeText={(v) => updateEvendoConfig({ baseUrl: v })} />
        <TextField label="API-Key" autoCapitalize="none" secureTextEntry value={evendoConfig.apiKey} onChangeText={(v) => updateEvendoConfig({ apiKey: v })} />
        <TextField label="Filial-ID (storeId)" autoCapitalize="none" value={evendoConfig.storeId} onChangeText={(v) => updateEvendoConfig({ storeId: v })} />
        <Text className="text-xs text-ink-400">
          Im Mock-Modus laufen alle Kunden-Abgleiche und Bon-Übermittlungen gegen die lokalen Testdaten.
        </Text>
      </Card>

      <SectionHeader title="HubSpot CRM" action={<Badge tone={hubspotConfig.enabled ? 'success' : 'neutral'} label={hubspotConfig.enabled ? 'Aktiv' : 'Deaktiviert'} />} />
      <Card className="gap-3">
        <View className="flex-row items-center justify-between">
          <Text className="font-medium text-ink-900 dark:text-ink-50">Synchronisation aktivieren</Text>
          <Switch value={hubspotConfig.enabled} onValueChange={(v) => updateHubspotConfig({ enabled: v })} />
        </View>
        <TextField label="Private App API-Key" autoCapitalize="none" secureTextEntry value={hubspotConfig.apiKey} onChangeText={(v) => updateHubspotConfig({ apiKey: v })} />

        <View className="flex-row rounded-xl bg-ink-100 dark:bg-ink-800 p-1">
          <View className="flex-1">
            <Button
              label="One-Way → HubSpot"
              size="sm"
              variant={hubspotConfig.syncDirection === 'one_way_to_hubspot' ? 'primary' : 'ghost'}
              onPress={() => updateHubspotConfig({ syncDirection: 'one_way_to_hubspot' })}
            />
          </View>
          <View className="flex-1">
            <Button
              label="Bi-direktional"
              size="sm"
              variant={hubspotConfig.syncDirection === 'bi_directional' ? 'primary' : 'ghost'}
              onPress={() => updateHubspotConfig({ syncDirection: 'bi_directional' })}
            />
          </View>
        </View>

        <TextField
          label="Sync-Intervall (Minuten)"
          keyboardType="number-pad"
          value={String(hubspotConfig.syncIntervalMinutes)}
          onChangeText={(v) => updateHubspotConfig({ syncIntervalMinutes: parseInt(v, 10) || 0 })}
        />

        <Text className="text-xs text-ink-400">
          {hubspotConfig.lastSyncedAt ? `Zuletzt synchronisiert: ${formatDateTime(hubspotConfig.lastSyncedAt)}` : 'Noch nie synchronisiert.'}
        </Text>

        <Button
          label={syncing ? 'Synchronisiere…' : 'Jetzt alle Kund:innen synchronisieren'}
          icon={<Ionicons name="sync" size={16} color="white" />}
          loading={syncing}
          onPress={handleSyncAll}
          fullWidth
        />
        {syncSummary ? <Text className="text-xs text-brand-600">{syncSummary}</Text> : null}
      </Card>
    </Screen>
  );
}
