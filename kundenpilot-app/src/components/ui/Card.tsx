import type { ReactNode } from 'react';
import { View } from 'react-native';

import { cn } from '@/utils/cn';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <View
      className={cn(
        'rounded-2xl bg-white dark:bg-ink-800 p-4 border border-ink-100 dark:border-ink-800/60 shadow-sm',
        className,
      )}
    >
      {children}
    </View>
  );
}
