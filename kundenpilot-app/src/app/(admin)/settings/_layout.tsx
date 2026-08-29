import { Stack } from 'expo-router';

export default function SettingsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="geofencing" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="integrations" />
    </Stack>
  );
}
