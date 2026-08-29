import { Text, View } from 'react-native';

import { cn } from '@/utils/cn';

type Tone = 'brand' | 'accent' | 'neutral' | 'danger' | 'success';

const TONE_CLASSES: Record<Tone, string> = {
  brand: 'bg-brand-50 dark:bg-brand-900 text-brand-700 dark:text-brand-200',
  accent: 'bg-accent-500/15 text-accent-600',
  neutral: 'bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-200',
  danger: 'bg-red-50 text-red-600',
  success: 'bg-emerald-50 text-emerald-600',
};

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: Tone }) {
  return (
    <View className={cn('self-start rounded-full px-2.5 py-1', TONE_CLASSES[tone].split(' ')[0])}>
      <Text className={cn('text-xs font-semibold', TONE_CLASSES[tone].split(' ').slice(1).join(' '))}>
        {label}
      </Text>
    </View>
  );
}
