'use client';

import { useEffect, useRef } from 'react';

const SESSION_STORAGE_KEY = 'mitb_visitor_tracked';

export function VisitorTracker() {
  const hasTracked = useRef(false);

  useEffect(() => {
    // Only run this logic on the client side
    if (typeof window === 'undefined' || hasTracked.current) {
      return;
    }

    // Check if a visit has already been tracked in this session
    const sessionTracked = sessionStorage.getItem(SESSION_STORAGE_KEY);

    if (!sessionTracked) {
      hasTracked.current = true; // Mark as attempting to track

      // Call our own API route which will securely call the geo IP service.
      fetch('/api/track-visit', { method: 'POST' })
        .then(response => {
          if (response.ok) {
            // If the server successfully tracked the visit, mark it in the session.
            sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
          } else {
            // If our server failed, allow a retry on the next page load.
            hasTracked.current = false;
          }
        })
        .catch(error => {
          console.error('Error calling /api/track-visit:', error);
          hasTracked.current = false; // Allow retry if the fetch itself fails.
        });
    } else {
      hasTracked.current = true; // Acknowledge that session is already tracked
    }

  }, []);

  return null; // This component does not render anything
}
