import type { HubspotConfig } from '@/types';
import type { HubspotClient } from './types';
import { createHubspotMockClient } from './hubspotMock';
import { createHubspotLiveClient } from './hubspotLive';

export function createHubspotClient(config: HubspotConfig): HubspotClient {
  if (!config.enabled || !config.apiKey) return createHubspotMockClient();
  return createHubspotLiveClient(config);
}

export * from './types';
