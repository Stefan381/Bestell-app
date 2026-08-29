import * as Notifications from 'expo-notifications';
import type { GeofenceConfig } from '@/types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  const existing = await Notifications.getPermissionsAsync();
  if (existing.status === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/** Push bei Annäherung ans Geschäft (nur innerhalb der Öffnungszeiten aufrufen). */
export async function sendApproachNotification(config: GeofenceConfig): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: config.approachMessageTitle,
      body: config.approachMessageBody,
    },
    trigger: null,
  });
}

/** Smart Re-Engagement: Push, wenn ein Kunde seit x Tagen nicht mehr eingekauft hat. */
export async function sendReengagementNotification(
  config: GeofenceConfig,
  firstName: string,
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: config.reengagementMessageTitle,
      body: config.reengagementMessageBody.replace('{{vorname}}', firstName),
    },
    trigger: null,
  });
}
