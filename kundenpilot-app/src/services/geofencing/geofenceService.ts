import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

import { SETTINGS_STORAGE_KEY } from '@/state/settingsStore';
import { sendApproachNotification } from '@/services/notifications/pushService';
import type { GeofenceConfig } from '@/types';

export const GEOFENCE_TASK_NAME = 'kundenpilot-store-geofence';

async function readGeofenceConfig(): Promise<GeofenceConfig | null> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: { geofenceConfig?: GeofenceConfig } };
    return parsed.state?.geofenceConfig ?? null;
  } catch {
    return null;
  }
}

export function isWithinOpeningHours(config: GeofenceConfig, at: Date = new Date()): boolean {
  const weekday = at.getDay();
  const hhmm = `${String(at.getHours()).padStart(2, '0')}:${String(at.getMinutes()).padStart(2, '0')}`;
  return config.openingHours.some(
    (slot) => slot.weekday === weekday && hhmm >= slot.opensAt && hhmm <= slot.closesAt,
  );
}

export function daysSinceLastPurchase(lastPurchaseAt: string | null, at: Date = new Date()): number {
  if (!lastPurchaseAt) return Number.POSITIVE_INFINITY;
  return Math.floor((at.getTime() - new Date(lastPurchaseAt).getTime()) / (1000 * 60 * 60 * 24));
}

export function isReengagementDue(
  lastPurchaseAt: string | null,
  config: GeofenceConfig,
  at: Date = new Date(),
): boolean {
  return daysSinceLastPurchase(lastPurchaseAt, at) >= config.reengagementInactivityDays;
}

// Muss im Modul-Scope registriert werden (nicht in einer Komponente), damit
// Expo den Task auch nach einem Kaltstart im Hintergrund erneut findet.
if (!TaskManager.isTaskDefined(GEOFENCE_TASK_NAME)) {
  TaskManager.defineTask(GEOFENCE_TASK_NAME, async ({ data, error }) => {
    if (error) {
      console.warn('[Geofencing] Task-Fehler', error.message);
      return;
    }
    const { eventType } = (data ?? {}) as { eventType?: Location.GeofencingEventType };
    if (eventType !== Location.GeofencingEventType.Enter) return;

    const config = await readGeofenceConfig();
    if (!config) return;
    if (!isWithinOpeningHours(config)) return;

    await sendApproachNotification(config);
  });
}

/**
 * Fordert zuerst Vordergrund-, dann Hintergrund-Standortrechte an.
 * Hinweis: Hintergrund-Geofencing benötigt einen Development Build
 * (in Expo Go seit SDK 53 nicht mehr unterstützt) – siehe README.
 */
export async function requestGeofencingPermissions(): Promise<boolean> {
  const foreground = await Location.requestForegroundPermissionsAsync();
  if (foreground.status !== 'granted') return false;
  const background = await Location.requestBackgroundPermissionsAsync();
  return background.status === 'granted';
}

export async function startGeofencing(config: GeofenceConfig): Promise<void> {
  const granted = await requestGeofencingPermissions();
  if (!granted) {
    throw new Error('Standortzugriff ("immer erlauben") wurde nicht erteilt.');
  }
  await Location.startGeofencingAsync(GEOFENCE_TASK_NAME, [
    {
      identifier: 'citykauf-store',
      latitude: config.latitude,
      longitude: config.longitude,
      radius: config.radiusMeters,
      notifyOnEnter: true,
      notifyOnExit: false,
    },
  ]);
}

export async function stopGeofencing(): Promise<void> {
  const registered = await TaskManager.isTaskRegisteredAsync(GEOFENCE_TASK_NAME);
  if (registered) {
    await Location.stopGeofencingAsync(GEOFENCE_TASK_NAME);
  }
}
