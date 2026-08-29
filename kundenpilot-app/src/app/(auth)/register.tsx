import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { TextField } from '@/components/ui/TextField';
import { WELCOME_BONUS_POINTS } from '@/services/loyalty/loyaltyEngine';
import { useAuthStore } from '@/state/authStore';

export default function RegisterScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const registerCustomer = useAuthStore((s) => s.registerCustomer);

  function handleSubmit() {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim()) {
      setError('Bitte alle Pflichtfelder ausfüllen.');
      return;
    }
    registerCustomer({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      gdprMarketingConsent: consent,
    });
    router.replace('/(customer)');
  }

  return (
    <Screen>
      <Text className="text-2xl font-extrabold text-ink-900 dark:text-ink-50 mt-2">Registrierung</Text>
      <Text className="text-sm text-ink-400 -mt-2">
        Erhalte direkt {WELCOME_BONUS_POINTS} Willkommens-Punkte geschenkt.
      </Text>

      <Card className="gap-4">
        <TextField label="Vorname" value={firstName} onChangeText={setFirstName} placeholder="Anna" />
        <TextField label="Nachname" value={lastName} onChangeText={setLastName} placeholder="Bauer" />
        <TextField
          label="E-Mail"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          placeholder="anna.bauer@example.com"
        />
        <TextField
          label="Telefon"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          placeholder="+49 151 1234567"
        />

        <Pressable
          onPress={() => setConsent((c) => !c)}
          className="flex-row items-start gap-3 rounded-xl bg-ink-50 dark:bg-ink-900 p-3"
        >
          <Ionicons
            name={consent ? 'checkbox' : 'square-outline'}
            size={22}
            color={consent ? '#1E6F5C' : '#8A93A0'}
          />
          <Text className="flex-1 text-sm text-ink-600 dark:text-ink-300">
            Ich möchte per E-Mail/WhatsApp über Angebote und Aktionen informiert werden.
          </Text>
        </Pressable>

        {error ? <Text className="text-sm text-red-500">{error}</Text> : null}

        <Button label="Registrieren" onPress={handleSubmit} fullWidth />
        <Button label="Zurück zum Login" variant="ghost" onPress={() => router.back()} fullWidth />
      </Card>
    </Screen>
  );
}
