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

/**
 * 6 hours, persisted.
 *
 * This was 60 seconds and memory-only, which meant roughly one Firestore read
 * per visitor per tab per minute — for three booleans an admin changes maybe
 * once a month. On the free tier those reads compete with the ones that
 * actually show people content, and when the daily quota runs out every read in
 * the project starts failing.
 *
 * The cost of a longer TTL is that a flag flip takes up to six hours to reach
 * everyone, which is the right trade for what these flags do.
 */
const CACHE_TTL = 6 * 60 * 60 * 1000;
const STORAGE_KEY = 'mitb_features';

/** Survives reloads, so a returning visitor costs nothing. */
function readPersisted(): FeaturesConfig | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const { value, expiresAt } = JSON.parse(raw) as {
      value: FeaturesConfig;
      expiresAt: number;
    };
    if (Date.now() >= expiresAt) return null;
    return value;
  } catch {
    return null;
  }
}

function persist(value: FeaturesConfig) {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ value, expiresAt: Date.now() + CACHE_TTL })
    );
  } catch {
    /* private mode or full quota — the memory tier still applies */
  }
}

async function fetchFeatures(): Promise<FeaturesConfig> {
  if (cachedConfig && Date.now() < cacheExpiresAt) return cachedConfig;

  const stored = readPersisted();
  if (stored) {
    cachedConfig = stored;
    cacheExpiresAt = Date.now() + CACHE_TTL;
    return stored;
  }

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
    persist(cachedConfig);
    return cachedConfig;
  } catch {
    // Offline, or the project is over its read quota. Defaults keep every
    // flag on, which is the safe direction — a flag failing closed would hide
    // working parts of the site.
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
