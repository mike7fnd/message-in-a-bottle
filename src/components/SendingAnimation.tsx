
'use client';

import Image from 'next/image';

export const SendingAnimation = () => {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in-0">
      <div className="relative h-32 w-32">
        <Image
          src="
https://i.ibb.co/xKCrQVs2/bottle-default.png"
          alt="Sending message"
          width={128}
          height={128}
          className="animate-sending-bottle"
        />
      </div>
      <div className="mt-6 flex items-center gap-2">
        <p className="text-lg font-semibold text-foreground animate-fade-in-out">Sending your bottle...</p>
      </div>
    </div>
  );
};

