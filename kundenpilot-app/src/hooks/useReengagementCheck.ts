import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { isReengagementDue } from '@/services/geofencing/geofenceService';
import { requestNotificationPermissions, sendReengagementNotification } from '@/services/notifications/pushService';
import { useSettingsStore } from '@/state/settingsStore';
import type { Customer } from '@/types';

const NOTIFIED_KEY_PREFIX = 'kundenpilot.lastReengagementNotifiedAt.';

/**
 * Smart Re-Engagement: prüft beim App-Start, ob der Kunde seit x Tagen
 * (Einstellungen → Geofencing) nicht mehr eingekauft hat, und löst dann
 * höchstens einmal pro Tag eine lokale Erinnerung mit Lock-Angebot aus.
 */
export function useReengagementCheck(customer: Customer | undefined) {
  const geofenceConfig = useSettingsStore((s) => s.geofenceConfig);

  useEffect(() => {
    if (!customer) return;
    if (!isReengagementDue(customer.lastPurchaseAt, geofenceConfig)) return;

    const storageKey = `${NOTIFIED_KEY_PREFIX}${customer.id}`;
    let cancelled = false;

    (async () => {
      const lastNotified = await AsyncStorage.getItem(storageKey);
      const today = new Date().toDateString();
      if (lastNotified === today || cancelled) return;

      const granted = await requestNotificationPermissions();
      if (!granted || cancelled) return;

      await sendReengagementNotification(geofenceConfig, customer.firstName);
      await AsyncStorage.setItem(storageKey, today);
    })();

    return () => {
      cancelled = true;
    };
  }, [customer, geofenceConfig]);
}
