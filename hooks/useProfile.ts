'use client';

import { useSyncExternalStore } from 'react';
import { getProfile, subscribeToProfile, defaultProfile } from '@/lib/profile/store';
import type { Profile } from '@/lib/profile/types';

// Stable server snapshot (frozen at module load) so React's snapshot identity
// check doesn't loop on hydration. defaultProfile() allocates a fresh object,
// which would fail the Object.is comparison on every render.
const SERVER_SNAPSHOT: Profile = defaultProfile();
const getServerSnapshot = (): Profile => SERVER_SNAPSHOT;

export function useProfile(): Profile {
  return useSyncExternalStore(subscribeToProfile, getProfile, getServerSnapshot);
}
