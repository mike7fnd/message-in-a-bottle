import { useEffect, useState } from 'react';

/**
 * Port of the web app's use-debounce hook.
 *
 * Used by the browse search so a Firestore query is not issued on every
 * keystroke — each one is a billed read, and on a phone it is also a round trip
 * over mobile data.
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
