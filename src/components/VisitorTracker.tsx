'use client';

import { useEffect, useRef } from 'react';
import { addVisit } from '@/lib/data';

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
      
      fetch('https://pro.ip-api.com/json/?key=F3hV8B0sD6pE1kS&fields=status,message,country,city')
        .then(response => response.json())
        .then(data => {
          if (data.status === 'success') {
            addVisit(data.country || 'Unknown', data.city || 'Unknown')
              .then(() => {
                sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
              })
              .catch(error => {
                // This might fail if the user is offline or due to security rules,
                // which is acceptable. We don't want to bother the user about it.
                console.error('Could not log visit:', error);
                hasTracked.current = false; // Allow retry on next page load if DB write fails
              });
          } else {
            console.warn('Could not determine visitor location:', data.message);
            hasTracked.current = false; // Allow retry
          }
        })
        .catch(error => {
          console.error('Error fetching visitor location:', error);
          hasTracked.current = false; // Allow retry
        });
    } else {
      hasTracked.current = true; // Acknowledge that session is already tracked
    }

  }, []);

  return null; // This component does not render anything
}
