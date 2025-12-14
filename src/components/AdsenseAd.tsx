
'use client';

import { useEffect } from 'react';
import { Card } from './ui/card';

declare global {
  interface Window {
    adsbygoogle: any;
  }
}

interface AdsenseAdProps {
  adSlot: string;
  className?: string;
}

export function AdsenseAd({ adSlot, className }: AdsenseAdProps) {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error(err);
    }
  }, [adSlot]);

  return (
    <Card className={`container relative mx-auto my-4 flex min-h-[100px] items-center justify-center text-center text-muted-foreground ${className}`}>
        <ins
            className="adsbygoogle"
            style={{ display: 'block', width: '100%', height: '100px' }}
            data-ad-client="ca-pub-6787998625628876"
            data-ad-slot={adSlot}
            data-ad-format="auto"
            data-full-width-responsive="true"
        />
        <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-sm">Advertisement</p>
        </div>
    </Card>
  );
}
