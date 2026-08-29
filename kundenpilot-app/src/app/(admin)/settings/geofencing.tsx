import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { TextField } from '@/components/ui/TextField';
import { OPENING_HOURS_WEEKDAY_LABELS } from '@/constants/config';
import { useSettingsStore } from '@/state/settingsStore';

export default function GeofencingSettingsScreen() {
  const config = useSettingsStore((s) => s.geofenceConfig);
  const updateGeofenceConfig = useSettingsStore((s) => s.updateGeofenceConfig);

  function updateOpeningHour(weekday: number, patch: { opensAt?: string; closesAt?: string }) {
    const exists = config.openingHours.some((h) => h.weekday === weekday);
    const nextHours = exists
      ? config.openingHours.map((h) => (h.weekday === weekday ? { ...h, ...patch } : h))
      : [...config.openingHours, { weekday, opensAt: '08:00', closesAt: '18:00', ...patch }];
    updateGeofenceConfig({ openingHours: nextHours });
  }

  return (
    <Screen>
      <View className="flex-row items-center gap-2">
        <Button label="" variant="ghost" size="sm" icon={<Ionicons name="arrow-back" size={18} color="#1E6F5C" />} onPress={() => router.back()} />
        <Text className="text-xl font-extrabold text-ink-900 dark:text-ink-50">Geofencing</Text>
      </View>

      <SectionHeader title="Standort & Radius" />
      <Card className="gap-3">
        <TextField label="Filialname" value={config.storeName} onChangeText={(v) => updateGeofenceConfig({ storeName: v })} />
        <View className="flex-row gap-3">
          <View className="flex-1">
            <TextField
              label="Breitengrad"
              keyboardType="numeric"
              value={String(config.latitude)}
              onChangeText={(v) => updateGeofenceConfig({ latitude: parseFloat(v) || 0 })}
            />
          </View>
          <View className="flex-1">
            <TextField
              label="Längengrad"
              keyboardType="numeric"
              value={String(config.longitude)}
              onChangeText={(v) => updateGeofenceConfig({ longitude: parseFloat(v) || 0 })}
            />
          </View>
        </View>
        <TextField
          label="Radius (Meter)"
          keyboardType="number-pad"
          value={String(config.radiusMeters)}
          onChangeText={(v) => updateGeofenceConfig({ radiusMeters: parseInt(v, 10) || 0 })}
        />
      </Card>

      <SectionHeader title="Öffnungszeiten" />
      <Card className="gap-3">
        {OPENING_HOURS_WEEKDAY_LABELS.map((label, weekday) => {
          const hour = config.openingHours.find((h) => h.weekday === weekday);
          return (
            <View key={weekday} className="flex-row items-center gap-2">
              <Text className="w-24 text-sm text-ink-600 dark:text-ink-300">{label}</Text>
              <View className="flex-1">
                <TextField
                  placeholder="geschlossen"
                  value={hour?.opensAt ?? ''}
                  onChangeText={(v) => updateOpeningHour(weekday, { opensAt: v })}
                />
              </View>
              <Text className="text-ink-400">–</Text>
              <View className="flex-1">
                <TextField
                  placeholder="geschlossen"
                  value={hour?.closesAt ?? ''}
                  onChangeText={(v) => updateOpeningHour(weekday, { closesAt: v })}
                />
              </View>
            </View>
          );
        })}
      </Card>

      <SectionHeader title="Push-Texte" />
      <Card className="gap-3">
        <TextField label="Annäherung – Titel" value={config.approachMessageTitle} onChangeText={(v) => updateGeofenceConfig({ approachMessageTitle: v })} />
        <TextField label="Annäherung – Text" value={config.approachMessageBody} onChangeText={(v) => updateGeofenceConfig({ approachMessageBody: v })} multiline numberOfLines={2} />
        <TextField
          label="Inaktivität (Tage) für Re-Engagement"
          keyboardType="number-pad"
          value={String(config.reengagementInactivityDays)}
          onChangeText={(v) => updateGeofenceConfig({ reengagementInactivityDays: parseInt(v, 10) || 0 })}
        />
        <TextField label="Re-Engagement – Titel" value={config.reengagementMessageTitle} onChangeText={(v) => updateGeofenceConfig({ reengagementMessageTitle: v })} />
        <TextField
          label="Re-Engagement – Text (unterstützt {{vorname}})"
          value={config.reengagementMessageBody}
          onChangeText={(v) => updateGeofenceConfig({ reengagementMessageBody: v })}
          multiline
          numberOfLines={2}
        />
      </Card>

      <Text className="text-xs text-ink-400">
        Hinweis: Hintergrund-Geofencing wird pro Gerät in der Kunden-App (Profil) aktiviert und erfordert
        einen Development Build (in Expo Go seit SDK 53 eingeschränkt).
      </Text>
    </Screen>
  );
}
