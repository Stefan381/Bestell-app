import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { Receipt } from '@/types';
import { formatDateTime, formatEuroFromCents } from '@/utils/date';

export function ReceiptListItem({ receipt }: { receipt: Receipt }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Pressable
      onPress={() => setExpanded((e) => !e)}
      className="rounded-2xl bg-white dark:bg-ink-800 border border-ink-100 dark:border-ink-800/60 p-4 gap-2"
    >
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="font-semibold text-ink-900 dark:text-ink-50">{receipt.storeName}</Text>
          <Text className="text-xs text-ink-400">{formatDateTime(receipt.createdAt)}</Text>
        </View>
        <View className="items-end">
          <Text className="font-bold text-ink-900 dark:text-ink-50">
            {formatEuroFromCents(receipt.totalCents)}
          </Text>
          <Text className="text-xs font-medium text-brand-600">
            +{receipt.pointsEarned} Punkte{receipt.pointsMultiplier > 1 ? ` (${receipt.pointsMultiplier}x)` : ''}
          </Text>
        </View>
      </View>

      {expanded ? (
        <View className="mt-1 gap-1 border-t border-ink-100 dark:border-ink-800 pt-2">
          {receipt.items.map((item, idx) => (
            <View key={`${item.articleId}_${idx}`} className="flex-row justify-between">
              <Text className="text-sm text-ink-600 dark:text-ink-300">
                {item.quantity} × {item.name}
              </Text>
              <Text className="text-sm text-ink-600 dark:text-ink-300">
                {formatEuroFromCents(item.unitPriceCents * item.quantity)}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <View className="flex-row items-center gap-1">
          <Ionicons name="chevron-down" size={14} color="#8A93A0" />
          <Text className="text-xs text-ink-400">{receipt.items.length} Artikel anzeigen</Text>
        </View>
      )}
    </Pressable>
  );
}
