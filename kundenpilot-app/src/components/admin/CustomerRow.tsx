import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Badge } from '@/components/ui/Badge';
import type { Customer } from '@/types';
import { daysBetween, formatDate } from '@/utils/date';

interface CustomerRowProps {
  customer: Customer;
  pointsBalance: number;
  selected: boolean;
  onToggleSelect: () => void;
  onPress: () => void;
}

export function CustomerRow({ customer, pointsBalance, selected, onToggleSelect, onPress }: CustomerRowProps) {
  const inactiveDays = customer.lastPurchaseAt ? daysBetween(customer.lastPurchaseAt) : null;
  const isInactive = inactiveDays === null || inactiveDays >= 30;

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-2xl bg-white dark:bg-ink-800 border border-ink-100 dark:border-ink-800/60 p-3"
    >
      <Pressable onPress={onToggleSelect} hitSlop={8}>
        <Ionicons
          name={selected ? 'checkbox' : 'square-outline'}
          size={22}
          color={selected ? '#1E6F5C' : '#8A93A0'}
        />
      </Pressable>

      <View className="flex-1">
        <Text className="font-semibold text-ink-900 dark:text-ink-50">
          {customer.firstName} {customer.lastName}
        </Text>
        <Text className="text-xs text-ink-400">{customer.email}</Text>
        <View className="flex-row flex-wrap gap-1 mt-1">
          {isInactive ? (
            <Badge
              tone="danger"
              label={inactiveDays === null ? 'Nie gekauft' : `Inaktiv seit ${inactiveDays} Tagen`}
            />
          ) : (
            <Badge tone="success" label={`Zuletzt ${formatDate(customer.lastPurchaseAt!)}`} />
          )}
          {customer.tags.map((tag) => (
            <Badge key={tag} tone="neutral" label={tag} />
          ))}
        </View>
      </View>

      <View className="items-end">
        <Text className="font-bold text-brand-600">{pointsBalance}</Text>
        <Text className="text-[10px] text-ink-400">Punkte</Text>
      </View>
    </Pressable>
  );
}
