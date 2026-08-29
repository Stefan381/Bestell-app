import type { EvendoConfig } from '@/types';
import type { EvendoClient } from './types';
import { createEvendoMockClient } from './evendoMock';
import { createEvendoLiveClient } from './evendoLive';

export function createEvendoClient(config: EvendoConfig): EvendoClient {
  return config.mode === 'live' ? createEvendoLiveClient(config) : createEvendoMockClient();
}

export * from './types';
