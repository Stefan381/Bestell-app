import { Text, View } from 'react-native';

import { POINTS_PER_EURO_VOUCHER } from '@/services/loyalty/loyaltyEngine';

export function PointsSummary({ pointsBalance, multiplier }: { pointsBalance: number; multiplier: number }) {
  const voucherValue = (Math.floor(pointsBalance / POINTS_PER_EURO_VOUCHER) * 1).toFixed(0);
  const progress = (pointsBalance % POINTS_PER_EURO_VOUCHER) / POINTS_PER_EURO_VOUCHER;

  return (
    <View className="rounded-3xl bg-brand-500 p-5 gap-3">
      <View className="flex-row items-end justify-between">
        <View>
          <Text className="text-brand-50 text-sm">Dein Punktestand</Text>
          <Text className="text-white text-4xl font-extrabold">{pointsBalance}</Text>
        </View>
        <View className="items-end">
          <Text className="text-brand-50 text-sm">entspricht</Text>
          <Text className="text-white text-xl font-bold">{voucherValue} €</Text>
        </View>
      </View>

      <View className="h-2 rounded-full bg-white/25 overflow-hidden">
        <View className="h-2 rounded-full bg-white" style={{ width: `${Math.round(progress * 100)}%` }} />
      </View>
      <Text className="text-brand-50 text-xs">
        Noch {POINTS_PER_EURO_VOUCHER - (pointsBalance % POINTS_PER_EURO_VOUCHER)} Punkte bis zum nächsten Euro
        Gutscheinwert
      </Text>

      {multiplier > 1 ? (
        <View className="self-start rounded-full bg-accent-500 px-3 py-1 mt-1">
          <Text className="text-xs font-bold text-white">{multiplier}x Punkte aktuell aktiv</Text>
        </View>
      ) : null}
    </View>
  );
}
