'use client';

import { useEffect, useState } from 'react';

export interface FeaturesConfig {
  spotifyEnabled: boolean;
  imageUploadEnabled: boolean;
  homeMediaSectionVisible: boolean;
}

const DEFAULTS: FeaturesConfig = {
  spotifyEnabled: true,
  imageUploadEnabled: true,
  homeMediaSectionVisible: true,
};

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const FS_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/config/features`;

let cachedConfig: FeaturesConfig | null = null;
let cacheExpiresAt = 0;
const CACHE_TTL = 60_000; // 1 min

async function fetchFeatures(): Promise<FeaturesConfig> {
  if (cachedConfig && Date.now() < cacheExpiresAt) return cachedConfig;
  try {
    const res = await fetch(FS_URL, { cache: 'no-store' });
    if (!res.ok) return DEFAULTS;
    const data = await res.json();
    const f = data?.fields ?? {};
    const bool = (k: string, def: boolean) => f[k]?.booleanValue ?? def;
    cachedConfig = {
      spotifyEnabled: bool('spotifyEnabled', true),
      imageUploadEnabled: bool('imageUploadEnabled', true),
      homeMediaSectionVisible: bool('homeMediaSectionVisible', true),
    };
    cacheExpiresAt = Date.now() + CACHE_TTL;
    return cachedConfig;
  } catch {
    return DEFAULTS;
  }
}

/**
 * Hook that returns the current feature flags from Firestore.
 * Defaults to all-enabled while loading so UI doesn't flash.
 */
export function useFeatures(): FeaturesConfig & { isLoading: boolean } {
  const [config, setConfig] = useState<FeaturesConfig>(cachedConfig ?? DEFAULTS);
  const [isLoading, setIsLoading] = useState(!cachedConfig);

  useEffect(() => {
    fetchFeatures().then((c) => {
      setConfig(c);
      setIsLoading(false);
    });
  }, []);

  return { ...config, isLoading };
}
