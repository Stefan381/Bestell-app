import { useCallback, useRef } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as Brightness from 'expo-brightness';
import QRCode from 'react-native-qrcode-svg';

interface QRCodeCardProps {
  customerNumber: string;
  displayName: string;
}

/** Erhöht kurzzeitig die Displayhelligkeit, solange der Kunden-Code sichtbar ist. */
function useHighBrightnessWhileFocused() {
  const previousBrightness = useRef<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        try {
          const { status } = await Brightness.requestPermissionsAsync();
          if (status !== 'granted' || !active) return;
          previousBrightness.current = await Brightness.getBrightnessAsync();
          await Brightness.setBrightnessAsync(1);
        } catch {
          // Helligkeitssteuerung ist optional – Scan funktioniert auch ohne.
        }
      })();

      return () => {
        active = false;
        if (previousBrightness.current !== null) {
          Brightness.setBrightnessAsync(previousBrightness.current).catch(() => {});
        }
      };
    }, []),
  );
}

export function QRCodeCard({ customerNumber, displayName }: QRCodeCardProps) {
  useHighBrightnessWhileFocused();

  return (
    <View className="items-center gap-4 rounded-3xl bg-white p-6">
      <View className="rounded-2xl bg-white p-3">
        <QRCode value={customerNumber} size={220} backgroundColor="#FFFFFF" color="#000000" />
      </View>
      <View className="items-center gap-1">
        <Text className="text-lg font-bold tracking-widest text-ink-900">{customerNumber}</Text>
        <Text className="text-sm text-ink-400">{displayName}</Text>
      </View>
    </View>
  );
}
