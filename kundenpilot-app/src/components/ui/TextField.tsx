import { forwardRef } from 'react';
import { Text, TextInput, type TextInputProps, View } from 'react-native';

import { cn } from '@/utils/cn';

interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  containerClassName?: string;
}

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, error, containerClassName, className, ...props },
  ref,
) {
  return (
    <View className={cn('gap-1.5', containerClassName)}>
      {label ? <Text className="text-sm font-medium text-ink-600 dark:text-ink-200">{label}</Text> : null}
      <TextInput
        ref={ref}
        placeholderTextColor="#8A93A0"
        className={cn(
          'rounded-xl border border-ink-200 dark:border-ink-800 bg-white dark:bg-ink-800 px-4 py-3 text-base text-ink-900 dark:text-ink-50',
          error && 'border-red-400',
          className,
        )}
        {...props}
      />
      {error ? <Text className="text-xs text-red-500">{error}</Text> : null}
    </View>
  );
});
