import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-lg font-bold text-ink-900 dark:text-ink-50">{title}</Text>
      {action}
    </View>
  );
}
