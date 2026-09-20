import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { getCachedContent } from '../lib/cached-data';
import { FALLBACK_CONTENT, type SiteContent } from '../lib/content';

/**
 * Site copy, fetched once and shared by every screen.
 *
 * Starts from the bundled fallback so nothing ever renders blank or flashes an
 * empty string, then swaps in the live values from /api/content. The cache
 * keeps them for 24 hours, so this is a single request per day per install.
 */
interface ContentContextValue {
  content: SiteContent;
  /** False once the network copy has arrived or definitively failed. */
  isLoading: boolean;
}

const ContentContext = createContext<ContentContextValue>({
  content: FALLBACK_CONTENT,
  isLoading: true,
});

export function ContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<SiteContent>(FALLBACK_CONTENT);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getCachedContent((fresh) => {
      // Background revalidation landed.
      if (!cancelled) setContent(fresh);
    })
      .then((c) => {
        if (!cancelled) setContent(c);
      })
      .catch(() => {
        // Offline or the endpoint is down — the fallback copy stands, which is
        // why the app still works on a plane.
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(() => ({ content, isLoading }), [content, isLoading]);

  return (
    <ContentContext.Provider value={value}>{children}</ContentContext.Provider>
  );
}

export function useContent(): ContentContextValue {
  return useContext(ContentContext);
}
