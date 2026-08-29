import { useState } from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { TextField } from '@/components/ui/TextField';
import { generateSocialPost, type AiGenerationResult } from '@/services/ai/aiGeneratorService';
import { copyToClipboard, shareToSocial } from '@/services/share/deepLinks';
import { useSettingsStore } from '@/state/settingsStore';

export default function AiGeneratorScreen() {
  const aiSettings = useSettingsStore((s) => s.aiSettings);
  const updateAiSettings = useSettingsStore((s) => s.updateAiSettings);

  const [topic, setTopic] = useState('');
  const [result, setResult] = useState<AiGenerationResult | null>(null);
  const [copied, setCopied] = useState(false);

  function handleGenerate() {
    if (!topic.trim()) return;
    setResult(
      generateSocialPost({
        topic: topic.trim(),
        systemInstructions: aiSettings.systemInstructions,
        hashtags: aiSettings.defaultHashtags,
      }),
    );
    setCopied(false);
  }

  async function handleCopy() {
    if (!result) return;
    await copyToClipboard(`${result.caption}\n\n${result.hashtags.join(' ')}`);
    setCopied(true);
  }

  return (
    <Screen>
      <SectionHeader title="KI-Social-Media-Generator" />

      <Card className="gap-3">
        <TextField
          label="Marken-Vorgaben (System Instructions)"
          value={aiSettings.systemInstructions}
          onChangeText={(v) => updateAiSettings({ systemInstructions: v })}
          multiline
          numberOfLines={3}
        />
        <Text className="text-xs text-ink-400">
          Dauerhaft hinterlegt – wird bei jedem Textvorschlag automatisch berücksichtigt.
        </Text>
      </Card>

      <SectionHeader title="Neuer Beitrag" />
      <Card className="gap-3">
        <TextField
          label="Thema / Angebot"
          value={topic}
          onChangeText={setTopic}
          placeholder="z.B. Frische Erdbeeren aus der Region"
        />
        <Button label="Textvorschlag generieren" onPress={handleGenerate} fullWidth />
      </Card>

      {result ? (
        <Card className="gap-3">
          <Text className="text-sm text-ink-800 dark:text-ink-100">{result.caption}</Text>
          <View className="flex-row flex-wrap gap-1">
            {result.hashtags.map((h) => (
              <Text key={h} className="text-xs font-medium text-brand-600">
                {h}
              </Text>
            ))}
          </View>

          <View className="flex-row gap-2">
            <View className="flex-1">
              <Button
                label={copied ? 'Kopiert ✓' : 'Text kopieren'}
                variant="secondary"
                icon={<Ionicons name="copy" size={16} color="#1E6F5C" />}
                onPress={handleCopy}
                fullWidth
              />
            </View>
            <View className="flex-1">
              <Button
                label="Teilen"
                icon={<Ionicons name="share-social" size={16} color="white" />}
                onPress={() => shareToSocial(`${result.caption}\n\n${result.hashtags.join(' ')}`)}
                fullWidth
              />
            </View>
          </View>
          <Text className="text-xs text-ink-400">
            „Teilen" öffnet das native Share-Sheet – dort sind Instagram/TikTok (falls installiert) direkt
            wählbar. Alternativ: Text kopieren und manuell einfügen.
          </Text>
        </Card>
      ) : null}
    </Screen>
  );
}
