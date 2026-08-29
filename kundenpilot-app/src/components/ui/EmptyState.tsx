import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function EmptyState({ icon, title, message }: { icon: keyof typeof Ionicons.glyphMap; title: string; message: string }) {
  return (
    <View className="items-center justify-center gap-2 py-10">
      <Ionicons name={icon} size={32} color="#8A93A0" />
      <Text className="text-base font-semibold text-ink-800 dark:text-ink-100">{title}</Text>
      <Text className="text-center text-sm text-ink-400 px-6">{message}</Text>
    </View>
  );
}
