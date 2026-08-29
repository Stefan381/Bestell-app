import { useState } from 'react';
import { Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';

interface ScannerFieldProps {
  onResult: (code: string) => void;
}

export function ScannerField({ onResult }: ScannerFieldProps) {
  const [manualCode, setManualCode] = useState('');
  const [cameraOpen, setCameraOpen] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  async function handleOpenCamera() {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) return;
    }
    setScanned(false);
    setCameraOpen(true);
  }

  return (
    <View className="gap-3">
      {cameraOpen ? (
        <View className="overflow-hidden rounded-2xl aspect-square bg-black">
          <CameraView
            style={{ flex: 1 }}
            barcodeScannerSettings={{ barcodeTypes: ['qr', 'code128', 'ean13'] }}
            onBarcodeScanned={
              scanned
                ? undefined
                : ({ data }) => {
                    setScanned(true);
                    setCameraOpen(false);
                    onResult(data);
                  }
            }
          />
          <View className="absolute bottom-3 left-0 right-0 items-center">
            <Button label="Abbrechen" variant="secondary" size="sm" onPress={() => setCameraOpen(false)} />
          </View>
        </View>
      ) : (
        <Button
          label="Kamera-Scanner starten"
          icon={<Ionicons name="camera" size={18} color="#1E6F5C" />}
          variant="secondary"
          onPress={handleOpenCamera}
          fullWidth
        />
      )}

      <View className="flex-row items-center gap-2">
        <View className="h-px flex-1 bg-ink-200 dark:bg-ink-800" />
        <Text className="text-xs text-ink-400">oder manuell</Text>
        <View className="h-px flex-1 bg-ink-200 dark:bg-ink-800" />
      </View>

      <View className="flex-row gap-2">
        <View className="flex-1">
          <TextField
            placeholder="Kundennummer, z.B. CK-100000"
            autoCapitalize="characters"
            value={manualCode}
            onChangeText={setManualCode}
            onSubmitEditing={() => manualCode.trim() && onResult(manualCode.trim())}
          />
        </View>
        <Button label="Suchen" onPress={() => manualCode.trim() && onResult(manualCode.trim())} />
      </View>
    </View>
  );
}
