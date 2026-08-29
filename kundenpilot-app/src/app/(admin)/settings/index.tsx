import { Pressable, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useAuthStore } from '@/state/authStore';
import { MOCK_ADMIN_USERS } from '@/mocks/adminUsers';

const MENU: { href: Href; icon: keyof typeof Ionicons.glyphMap; title: string; subtitle: string }[] = [
  {
    href: '/(admin)/settings/geofencing',
    icon: 'location',
    title: 'Geofencing & Öffnungszeiten',
    subtitle: 'Koordinaten, Radius, Push-Zeitfenster',
  },
  {
    href: '/(admin)/settings/notifications',
    icon: 'chatbubbles',
    title: 'Nachrichten-Vorlagen',
    subtitle: 'E-Mail- & WhatsApp-Texte verwalten',
  },
  {
    href: '/(admin)/settings/integrations',
    icon: 'git-network',
    title: 'Integrationen',
    subtitle: 'e-vendo REST-API & HubSpot CRM',
  },
];

export default function SettingsMenuScreen() {
  const session = useAuthStore((s) => s.session);
  const logout = useAuthStore((s) => s.logout);
  const currentAdmin = MOCK_ADMIN_USERS.find((a) => session?.role === 'admin' && a.id === session.adminUserId);

  return (
    <Screen>
      <SectionHeader title="Einstellungen" />

      {currentAdmin ? (
        <Card className="flex-row items-center gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-500">
            <Text className="font-bold text-white">{currentAdmin.name.charAt(0)}</Text>
          </View>
          <View>
            <Text className="font-semibold text-ink-900 dark:text-ink-50">{currentAdmin.name}</Text>
            <Text className="text-xs text-ink-400">
              {currentAdmin.role === 'owner' ? 'Inhaber:in' : 'Mitarbeiter:in'} · {currentAdmin.email}
            </Text>
          </View>
        </Card>
      ) : null}

      <View className="gap-2">
        {MENU.map((item) => (
          <Pressable
            key={item.title}
            onPress={() => router.push(item.href)}
            className="flex-row items-center gap-3 rounded-2xl bg-white dark:bg-ink-800 border border-ink-100 dark:border-ink-800/60 p-4"
          >
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-900">
              <Ionicons name={item.icon} size={20} color="#1E6F5C" />
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-ink-900 dark:text-ink-50">{item.title}</Text>
              <Text className="text-xs text-ink-400">{item.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#8A93A0" />
          </Pressable>
        ))}
      </View>

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
