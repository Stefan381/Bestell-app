import { useState } from 'react';
import { Alert, Switch, Text, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useCurrentCustomer } from '@/hooks/useCurrentCustomer';
import { startGeofencing, stopGeofencing } from '@/services/geofencing/geofenceService';
import { useAuthStore } from '@/state/authStore';
import { useCustomerStore } from '@/state/customerStore';
import { useSettingsStore } from '@/state/settingsStore';

function InfoRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View className="flex-row items-center gap-3 py-2">
      <Ionicons name={icon} size={18} color="#8A93A0" />
      <View>
        <Text className="text-xs text-ink-400">{label}</Text>
        <Text className="text-sm font-medium text-ink-900 dark:text-ink-50">{value}</Text>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const { customer } = useCurrentCustomer();
  const logout = useAuthStore((s) => s.logout);
  const updateCustomer = useCustomerStore((s) => s.updateCustomer);
  const geofenceConfig = useSettingsStore((s) => s.geofenceConfig);
  const geofencingActive = useSettingsStore((s) => s.geofencingActive);
  const setGeofencingActive = useSettingsStore((s) => s.setGeofencingActive);
  const [toggling, setToggling] = useState(false);

  if (!customer) return <Redirect href="/(auth)/login" />;

  async function handleGeofenceToggle(value: boolean) {
    setToggling(true);
    try {
      if (value) {
        await startGeofencing(geofenceConfig);
      } else {
        await stopGeofencing();
      }
      setGeofencingActive(value);
    } catch (e) {
      Alert.alert(
        'Standortzugriff nötig',
        'Für Erinnerungen in Ladennähe wird der Standort ("immer erlauben") benötigt. In Expo Go ist Hintergrund-Geofencing eingeschränkt – nutze dafür einen Development Build.',
      );
    } finally {
      setToggling(false);
    }
  }

  return (
    <Screen>
      <SectionHeader title="Mein Profil" />
      <Card>
        <InfoRow icon="person" label="Name" value={`${customer.firstName} ${customer.lastName}`} />
        <InfoRow icon="mail" label="E-Mail" value={customer.email} />
        <InfoRow icon="call" label="Telefon" value={customer.phone} />
        <InfoRow icon="card" label="Kundennummer" value={customer.customerNumber} />
      </Card>

      <SectionHeader title="Benachrichtigungen" />
      <Card className="gap-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="font-medium text-ink-900 dark:text-ink-50">Erinnerung in Ladennähe</Text>
            <Text className="text-xs text-ink-400">
              Push-Nachricht bei Annäherung (~{geofenceConfig.radiusMeters} m) während der Öffnungszeiten.
            </Text>
          </View>
          <Switch value={geofencingActive} onValueChange={handleGeofenceToggle} disabled={toggling} />
        </View>
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="font-medium text-ink-900 dark:text-ink-50">Marketing per E-Mail/WhatsApp</Text>
            <Text className="text-xs text-ink-400">Angebote und Neuigkeiten von Citykauf erhalten.</Text>
          </View>
          <Switch
            value={customer.gdprMarketingConsent}
            onValueChange={(v) => updateCustomer(customer.id, { gdprMarketingConsent: v })}
          />
        </View>
      </Card>

      <Button
        label="Abmelden"
        variant="ghost"
        onPress={() => {
          logout();
          router.replace('/(auth)/login');
        }}
      />
    </Screen>
  );
}
