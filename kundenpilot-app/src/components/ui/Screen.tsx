import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { cn } from '@/utils/cn';

interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  className?: string;
  contentClassName?: string;
}

export function Screen({ children, scroll = true, className, contentClassName }: ScreenProps) {
  const Wrapper = scroll ? ScrollView : View;
  return (
    <SafeAreaView className={cn('flex-1 bg-ink-50 dark:bg-ink-900', className)} edges={['top', 'left', 'right']}>
      <Wrapper
        className="flex-1"
        {...(scroll
          ? { contentContainerClassName: cn('p-4 gap-4 pb-10', contentClassName), keyboardShouldPersistTaps: 'handled' as const }
          : {})}
      >
        {scroll ? children : <View className={cn('flex-1 p-4 gap-4', contentClassName)}>{children}</View>}
      </Wrapper>
    </SafeAreaView>
  );
}
