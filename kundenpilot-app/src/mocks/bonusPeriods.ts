import type { BonusPeriod } from '@/types';
import { daysAgo } from '@/utils/date';

export const MOCK_BONUS_PERIODS: BonusPeriod[] = [
  {
    id: 'bonus_weekend',
    label: 'Doppelte Punkte dieses Wochenende',
    multiplier: 2,
    startAt: daysAgo(1),
    endAt: daysAgo(-2), // in 2 Tagen
    active: true,
  },
  {
    id: 'bonus_past_spring',
    label: 'Frühlingsaktion (abgelaufen)',
    multiplier: 1.5,
    startAt: daysAgo(60),
    endAt: daysAgo(45),
    active: false,
  },
];
