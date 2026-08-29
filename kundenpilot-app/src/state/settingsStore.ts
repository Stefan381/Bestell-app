import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  DEFAULT_AI_SETTINGS,
  DEFAULT_EVENDO_CONFIG,
  DEFAULT_GEOFENCE_CONFIG,
  DEFAULT_HUBSPOT_CONFIG,
  DEFAULT_NOTIFICATION_TEMPLATES,
} from '@/constants/config';
import type { AiGeneratorSettings, EvendoConfig, GeofenceConfig, HubspotConfig, NotificationTemplate } from '@/types';

export const SETTINGS_STORAGE_KEY = 'kundenpilot.settings';

interface SettingsState {
  geofenceConfig: GeofenceConfig;
  evendoConfig: EvendoConfig;
  hubspotConfig: HubspotConfig;
  aiSettings: AiGeneratorSettings;
  notificationTemplates: NotificationTemplate[];
  geofencingActive: boolean;

  updateGeofenceConfig: (patch: Partial<GeofenceConfig>) => void;
  updateEvendoConfig: (patch: Partial<EvendoConfig>) => void;
  updateHubspotConfig: (patch: Partial<HubspotConfig>) => void;
  updateAiSettings: (patch: Partial<AiGeneratorSettings>) => void;
  upsertNotificationTemplate: (template: NotificationTemplate) => void;
  setGeofencingActive: (active: boolean) => void;
  markHubspotSynced: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      geofenceConfig: DEFAULT_GEOFENCE_CONFIG,
      evendoConfig: DEFAULT_EVENDO_CONFIG,
      hubspotConfig: DEFAULT_HUBSPOT_CONFIG,
      aiSettings: DEFAULT_AI_SETTINGS,
      notificationTemplates: DEFAULT_NOTIFICATION_TEMPLATES,
      geofencingActive: false,

      updateGeofenceConfig: (patch) =>
        set((state) => ({ geofenceConfig: { ...state.geofenceConfig, ...patch } })),
      updateEvendoConfig: (patch) =>
        set((state) => ({ evendoConfig: { ...state.evendoConfig, ...patch } })),
      updateHubspotConfig: (patch) =>
        set((state) => ({ hubspotConfig: { ...state.hubspotConfig, ...patch } })),
      updateAiSettings: (patch) => set((state) => ({ aiSettings: { ...state.aiSettings, ...patch } })),
      upsertNotificationTemplate: (template) =>
        set((state) => {
          const exists = state.notificationTemplates.some((t) => t.id === template.id);
          return {
            notificationTemplates: exists
              ? state.notificationTemplates.map((t) => (t.id === template.id ? template : t))
              : [...state.notificationTemplates, template],
          };
        }),
      setGeofencingActive: (active) => set({ geofencingActive: active }),
      markHubspotSynced: () =>
        set((state) => ({
          hubspotConfig: { ...state.hubspotConfig, lastSyncedAt: new Date().toISOString() },
        })),
    }),
    {
      name: SETTINGS_STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
