import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { BonusPeriod } from '@/types';
import { formatDate } from '@/utils/date';

export function OfferCard({ period }: { period: BonusPeriod }) {
  return (
    <View className="flex-row items-center gap-3 rounded-2xl bg-white dark:bg-ink-800 border border-ink-100 dark:border-ink-800/60 p-4">
      <View className="h-11 w-11 items-center justify-center rounded-xl bg-accent-500/15">
        <Ionicons name="flash" size={22} color="#E8A33D" />
      </View>
      <View className="flex-1">
        <Text className="font-semibold text-ink-900 dark:text-ink-50">{period.label}</Text>
        <Text className="text-xs text-ink-400">
          {formatDate(period.startAt)} – {formatDate(period.endAt)}
        </Text>
      </View>
      <View className="rounded-full bg-brand-500 px-3 py-1.5">
        <Text className="text-xs font-bold text-white">{period.multiplier}x Punkte</Text>
      </View>
    </View>
  );
}
