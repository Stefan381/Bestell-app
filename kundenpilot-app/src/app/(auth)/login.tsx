import { useState } from 'react';
import { Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { useAuthStore } from '@/state/authStore';
import { cn } from '@/utils/cn';

type Role = 'customer' | 'admin';

export default function LoginScreen() {
  const [role, setRole] = useState<Role>('customer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const loginCustomerByEmail = useAuthStore((s) => s.loginCustomerByEmail);
  const loginAdminByEmail = useAuthStore((s) => s.loginAdminByEmail);

  function handleLogin() {
    if (!email.trim() || !password.trim()) {
      setError('Bitte E-Mail und Passwort eingeben.');
      return;
    }
    const success = role === 'customer' ? loginCustomerByEmail(email) : loginAdminByEmail(email);
    if (!success) {
      setError('Kein Konto mit dieser E-Mail gefunden.');
      return;
    }
    setError(null);
    router.replace(role === 'customer' ? '/(customer)' : '/(admin)');
  }

  return (
    <Screen contentClassName="justify-center flex-1">
      <View className="items-center gap-2 mb-4">
        <View className="h-16 w-16 items-center justify-center rounded-2xl bg-brand-500">
          <Ionicons name="qr-code" size={30} color="white" />
        </View>
        <Text className="text-2xl font-extrabold text-ink-900 dark:text-ink-50">KundenPilot</Text>
        <Text className="text-sm text-ink-400">Kundenkarte & CRM für Citykauf</Text>
      </View>

      <Card className="gap-4">
        <View className="flex-row rounded-xl bg-ink-100 dark:bg-ink-900 p-1">
          {(['customer', 'admin'] as Role[]).map((r) => (
            <View key={r} className="flex-1">
              <Button
                label={r === 'customer' ? 'Kund:in' : 'Mitarbeiter:in'}
                variant={role === r ? 'primary' : 'ghost'}
                size="sm"
                onPress={() => {
                  setRole(r);
                  setError(null);
                }}
              />
            </View>
          ))}
        </View>

        <TextField
          label="E-Mail"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          placeholder={role === 'customer' ? 'anna.bauer@example.com' : 'sabine@citykauf.example'}
        />
        <TextField
          label="Passwort"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
        />
        {error ? <Text className="text-sm text-red-500">{error}</Text> : null}

        <Button label="Anmelden" onPress={handleLogin} fullWidth />

        <Text className="text-center text-xs text-ink-400">
          Demo-Zugang: {role === 'customer' ? 'anna.bauer@example.com' : 'sabine@citykauf.example'} · beliebiges Passwort
        </Text>
      </Card>

      {role === 'customer' ? (
        <Text className={cn('text-center text-sm text-ink-500 mt-4')}>
          Neu bei Citykauf?{' '}
          <Link href="/(auth)/register" className="font-semibold text-brand-600">
            Jetzt registrieren
          </Link>
        </Text>
      ) : null}
    </Screen>
  );
}
