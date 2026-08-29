import { useState } from 'react';
import { Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { TextField } from '@/components/ui/TextField';
import { findActiveBonusPeriod } from '@/services/loyalty/loyaltyEngine';
import { useLoyaltyStore } from '@/state/loyaltyStore';
import { daysAgo, formatDate } from '@/utils/date';

export default function BonusControlScreen() {
  const bonusPeriods = useLoyaltyStore((s) => s.bonusPeriods);
  const addBonusPeriod = useLoyaltyStore((s) => s.addBonusPeriod);
  const updateBonusPeriod = useLoyaltyStore((s) => s.updateBonusPeriod);
  const removeBonusPeriod = useLoyaltyStore((s) => s.removeBonusPeriod);

  const [label, setLabel] = useState('');
  const [multiplier, setMultiplier] = useState('2');
  const [startInDays, setStartInDays] = useState('0');
  const [durationDays, setDurationDays] = useState('2');

  const active = findActiveBonusPeriod(bonusPeriods);

  function handleCreate() {
    const m = parseFloat(multiplier.replace(',', '.'));
    const start = parseInt(startInDays, 10) || 0;
    const duration = parseInt(durationDays, 10) || 1;
    if (!label.trim() || !Number.isFinite(m) || m <= 1) return;

    addBonusPeriod({
      label: label.trim(),
      multiplier: m,
      startAt: daysAgo(-start),
      endAt: daysAgo(-(start + duration)),
      active: true,
    });
    setLabel('');
    setMultiplier('2');
    setStartInDays('0');
    setDurationDays('2');
  }

  return (
    <Screen>
      <SectionHeader title="Bonuspunkte-Steuerung" />

      {active ? (
        <Card className="gap-1 border-brand-200 bg-brand-50 dark:bg-brand-900">
          <View className="flex-row items-center gap-2">
            <Ionicons name="flash" size={16} color="#1E6F5C" />
            <Text className="font-semibold text-brand-700 dark:text-brand-200">
              Aktiv: {active.label} ({active.multiplier}x)
            </Text>
          </View>
          <Text className="text-xs text-brand-600 dark:text-brand-300">
            Alle Käufe in der App und im Schnell-Scan werden aktuell mit {active.multiplier}x Punkten
            gutgeschrieben.
          </Text>
        </Card>
      ) : (
        <Card>
          <Text className="text-sm text-ink-500">Kein Bonus-Zeitraum aktuell aktiv – Basis-Rate 1 Punkt/€.</Text>
        </Card>
      )}

      <SectionHeader title="Neuen Zeitraum anlegen" />
      <Card className="gap-3">
        <TextField label="Bezeichnung" value={label} onChangeText={setLabel} placeholder="z.B. Doppelte Punkte am Wochenende" />
        <TextField label="Multiplikator" keyboardType="decimal-pad" value={multiplier} onChangeText={setMultiplier} />
        <View className="flex-row gap-3">
          <View className="flex-1">
            <TextField label="Start in (Tagen)" keyboardType="number-pad" value={startInDays} onChangeText={setStartInDays} />
          </View>
          <View className="flex-1">
            <TextField label="Dauer (Tage)" keyboardType="number-pad" value={durationDays} onChangeText={setDurationDays} />
          </View>
        </View>
        <Button label="Zeitraum aktivieren" onPress={handleCreate} fullWidth />
      </Card>

      <SectionHeader title="Alle Zeiträume" />
      {bonusPeriods.length === 0 ? (
        <EmptyState icon="trophy-outline" title="Noch keine Aktionen" message="Lege oben eine neue an." />
      ) : (
        <View className="gap-2">
          {bonusPeriods.map((period) => (
            <Card key={period.id} className="flex-row items-center justify-between">
              <View className="flex-1 pr-2">
                <Text className="font-semibold text-ink-900 dark:text-ink-50">{period.label}</Text>
                <Text className="text-xs text-ink-400">
                  {formatDate(period.startAt)} – {formatDate(period.endAt)} · {period.multiplier}x
                </Text>
              </View>
              <Switch value={period.active} onValueChange={(v) => updateBonusPeriod(period.id, { active: v })} />
              <Button
                label=""
                variant="ghost"
                size="sm"
                icon={<Ionicons name="trash-outline" size={18} color="#DC2626" />}
                onPress={() => removeBonusPeriod(period.id)}
              />
            </Card>
          ))}
        </View>
      )}
      <Badge tone="neutral" label="Basis-Logik: 1 € Umsatz = 1 Punkt · 100 Punkte = 1 € Gutscheinwert" />
    </Screen>
  );
}
