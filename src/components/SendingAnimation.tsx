
'use client';

import Image from 'next/image';
import { useTheme } from 'next-themes';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export const SendingAnimation = () => {
  const { resolvedTheme } = useTheme();

  const bottleLight = PlaceHolderImages.find(p => p.id === 'bottle-light-mode');
  const bottleGlowDark = PlaceHolderImages.find(p => p.id === 'bottle-glow-dark');

  const sendingImage = resolvedTheme === 'dark' ? bottleGlowDark : bottleLight;

  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in-0">
      <div className="relative h-32 w-32">
        {sendingImage && (
            <Image
                src={sendingImage.imageUrl}
                alt={sendingImage.description}
                width={128}
                height={128}
                className="animate-sending-bottle"
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

    
    