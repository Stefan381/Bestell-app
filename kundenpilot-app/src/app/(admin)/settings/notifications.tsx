import { useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { TextField } from '@/components/ui/TextField';
import { useSettingsStore } from '@/state/settingsStore';
import type { Channel } from '@/types';
import { createId } from '@/utils/id';

export default function NotificationTemplatesScreen() {
  const templates = useSettingsStore((s) => s.notificationTemplates);
  const upsertNotificationTemplate = useSettingsStore((s) => s.upsertNotificationTemplate);

  const [label, setLabel] = useState('');
  const [channel, setChannel] = useState<Channel>('email');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  function handleAdd() {
    if (!label.trim() || !body.trim()) return;
    upsertNotificationTemplate({
      id: createId('tmpl'),
      channel,
      label: label.trim(),
      subject: channel === 'email' ? subject.trim() : undefined,
      body: body.trim(),
    });
    setLabel('');
    setSubject('');
    setBody('');
  }

  return (
    <Screen>
      <View className="flex-row items-center gap-2">
        <Button label="" variant="ghost" size="sm" icon={<Ionicons name="arrow-back" size={18} color="#1E6F5C" />} onPress={() => router.back()} />
        <Text className="text-xl font-extrabold text-ink-900 dark:text-ink-50">Nachrichten-Vorlagen</Text>
      </View>

      <SectionHeader title="Bestehende Vorlagen" />
      <View className="gap-2">
        {templates.map((t) => (
          <Card key={t.id} className="gap-2">
            <View className="flex-row items-center gap-2">
              <Badge label={t.channel === 'email' ? 'E-Mail' : 'WhatsApp'} tone="brand" />
              <Text className="font-semibold text-ink-900 dark:text-ink-50">{t.label}</Text>
            </View>
            {t.subject ? <Text className="text-xs text-ink-500">Betreff: {t.subject}</Text> : null}
            <Text className="text-xs text-ink-400">{t.body}</Text>
          </Card>
        ))}
      </View>

      <SectionHeader title="Neue Vorlage" />
      <Card className="gap-3">
        <View className="flex-row rounded-xl bg-ink-100 dark:bg-ink-800 p-1">
          {(['email', 'whatsapp'] as Channel[]).map((c) => (
            <View key={c} className="flex-1">
              <Button label={c === 'email' ? 'E-Mail' : 'WhatsApp'} size="sm" variant={channel === c ? 'primary' : 'ghost'} onPress={() => setChannel(c)} />
            </View>
          ))}
        </View>
        <TextField label="Name der Vorlage" value={label} onChangeText={setLabel} placeholder="z.B. Sommeraktion" />
        {channel === 'email' ? <TextField label="Betreff" value={subject} onChangeText={setSubject} /> : null}
        <TextField
          label="Text (unterstützt {{vorname}}, {{nachname}})"
          value={body}
          onChangeText={setBody}
          multiline
          numberOfLines={4}
        />
        <Button label="Vorlage speichern" onPress={handleAdd} fullWidth />
      </Card>
    </Screen>
  );
}
