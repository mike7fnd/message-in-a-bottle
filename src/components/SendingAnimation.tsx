'use client';

import Image from 'next/image';
import { useTheme } from 'next-themes';
import { type SiteContent } from '@/lib/content';
import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

export const SendingAnimation = ({ content }: { content: SiteContent }) => {
  const { resolvedTheme } = useTheme();
  const bottleRef = useRef(null);

  const sendingImage = resolvedTheme === 'dark' ? content.sendSendingImageDark : content.sendSendingImageLight;

  useGSAP(() => {
    if (bottleRef.current) {
      const tl = gsap.timeline();
      
      // 1. Start from off-screen left, slightly rotated
      gsap.set(bottleRef.current, { x: '-100vw', y: 0, rotation: -90 });

      // 2. Animate the throw: fly in and spin, landing in the center
      tl.to(bottleRef.current, {
        x: '0%',
        y: '0%',
        rotation: 360,
        duration: 1.2,
        ease: 'power2.out',
      });
      
      // 3. Continuous smooth "flying" bounce animation once it's in the center
      tl.to(bottleRef.current, {
        y: '+=40', // Bounces up and down by 40px (bigger movement)
        rotation: '+=10', // Tilts slightly more
        duration: 3, // Slower, more fluid duration
        repeat: -1, // Loop forever
        yoyo: true, // Reverses the animation smoothly
        ease: 'sine.inOut'
      }, ">"); // Start after the throw animation finishes
    }
  }, { scope: bottleRef });

  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in-0">
      <div className="relative h-32 w-32" ref={bottleRef}>
        {sendingImage && (
            <Image
                src={sendingImage}
                alt="Sending animation image"
                width={128}
                height={128}
                unoptimized
            />
        )}
      </div>
      <div className="mt-6 flex items-center gap-2">
        <p className="text-lg font-semibold text-foreground animate-fade-in-out">Sending your bottle...</p>
      </div>
    </div>
  );
};
