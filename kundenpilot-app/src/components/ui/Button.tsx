import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';

import { cn } from '@/utils/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
}

const VARIANT_CONTAINER: Record<Variant, string> = {
  primary: 'bg-brand-500 active:bg-brand-600',
  secondary: 'bg-brand-50 dark:bg-brand-900 active:bg-brand-100',
  ghost: 'bg-transparent active:bg-ink-100 dark:active:bg-ink-800',
  danger: 'bg-red-50 active:bg-red-100',
};

const VARIANT_TEXT: Record<Variant, string> = {
  primary: 'text-white',
  secondary: 'text-brand-600 dark:text-brand-200',
  ghost: 'text-ink-800 dark:text-ink-100',
  danger: 'text-red-600',
};

const SIZE_CONTAINER: Record<Size, string> = {
  sm: 'px-3 py-2 rounded-lg',
  md: 'px-4 py-3 rounded-xl',
  lg: 'px-5 py-4 rounded-2xl',
};

const SIZE_TEXT: Record<Size, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  icon,
  fullWidth,
}: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={cn(
        'flex-row items-center justify-center gap-2',
        VARIANT_CONTAINER[variant],
        SIZE_CONTAINER[size],
        fullWidth && 'w-full',
        (disabled || loading) && 'opacity-50',
      )}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : '#1E6F5C'} />
      ) : (
        <>
          {icon}
          <Text className={cn('font-semibold', VARIANT_TEXT[variant], SIZE_TEXT[size])}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}
