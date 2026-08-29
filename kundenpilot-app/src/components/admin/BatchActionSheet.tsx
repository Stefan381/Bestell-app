import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { openMailto, openWhatsApp } from '@/services/share/deepLinks';
import { useSettingsStore } from '@/state/settingsStore';
import type { Channel, Customer } from '@/types';

function applyTemplate(body: string, customer: Customer): string {
  return body
    .replace(/\{\{vorname\}\}/g, customer.firstName)
    .replace(/\{\{nachname\}\}/g, customer.lastName);
}

interface BatchActionSheetProps {
  visible: boolean;
  onClose: () => void;
  customers: Customer[];
}

export function BatchActionSheet({ visible, onClose, customers }: BatchActionSheetProps) {
  const templates = useSettingsStore((s) => s.notificationTemplates);
  const [channel, setChannel] = useState<Channel>('email');
  const [sentIds, setSentIds] = useState<string[]>([]);

  const channelTemplates = useMemo(() => templates.filter((t) => t.channel === channel), [templates, channel]);
  const [templateId, setTemplateId] = useState<string | undefined>(channelTemplates[0]?.id);
  const activeTemplate = templates.find((t) => t.id === templateId) ?? channelTemplates[0];

  function handleSendEmail() {
    if (!activeTemplate) return;
    const to = customers.map((c) => c.email);
    openMailto(to, activeTemplate.subject ?? '', activeTemplate.body.replace(/\{\{vorname\}\}/g, ''));
  }

  function handleSendWhatsApp(customer: Customer) {
    if (!activeTemplate) return;
    openWhatsApp(customer.phone, applyTemplate(activeTemplate.body, customer));
    setSentIds((ids) => [...ids, customer.id]);
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <View className="max-h-[85%] rounded-t-3xl bg-white dark:bg-ink-900 p-5 gap-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-lg font-bold text-ink-900 dark:text-ink-50">
              {customers.length} Kund:innen kontaktieren
            </Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={24} color="#8A93A0" />
            </Pressable>
          </View>

          <View className="flex-row rounded-xl bg-ink-100 dark:bg-ink-800 p-1">
            {(['email', 'whatsapp'] as Channel[]).map((c) => (
              <View key={c} className="flex-1">
                <Button
                  label={c === 'email' ? 'E-Mail' : 'WhatsApp'}
                  size="sm"
                  variant={channel === c ? 'primary' : 'ghost'}
                  onPress={() => {
                    setChannel(c);
                    setTemplateId(templates.find((t) => t.channel === c)?.id);
                  }}
                />
              </View>
            ))}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
            {channelTemplates.map((t) => (
              <Pressable key={t.id} onPress={() => setTemplateId(t.id)} className="mr-2">
                <Badge label={t.label} tone={t.id === activeTemplate?.id ? 'brand' : 'neutral'} />
              </Pressable>
            ))}
          </ScrollView>

          {activeTemplate ? (
            <View className="rounded-xl bg-ink-50 dark:bg-ink-800 p-3">
              <Text className="text-xs text-ink-500 dark:text-ink-300">{activeTemplate.body}</Text>
            </View>
          ) : (
            <Text className="text-xs text-ink-400">
              Keine Vorlage für diesen Kanal – unter Einstellungen → Push/Nachrichten anlegen.
            </Text>
          )}

          {channel === 'email' ? (
            <Button
              label={`Standard-Mailprogramm öffnen (${customers.length} Empfänger)`}
              onPress={handleSendEmail}
              disabled={!activeTemplate}
              fullWidth
            />
          ) : (
            <ScrollView className="max-h-64">
              <View className="gap-2">
                {customers.map((c) => (
                  <View
                    key={c.id}
                    className="flex-row items-center justify-between rounded-xl bg-ink-50 dark:bg-ink-800 px-3 py-2"
                  >
                    <Text className="text-sm text-ink-800 dark:text-ink-100">
                      {c.firstName} {c.lastName}
                    </Text>
                    <Button
                      label={sentIds.includes(c.id) ? 'Geöffnet ✓' : 'WhatsApp öffnen'}
                      size="sm"
                      variant={sentIds.includes(c.id) ? 'ghost' : 'secondary'}
                      disabled={!activeTemplate}
                      onPress={() => handleSendWhatsApp(c)}
                    />
                  </View>
                ))}
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}
