
'use client';

import Image from 'next/image';

export const SendingAnimation = () => {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in-0">
      <div className="relative h-24 w-24">
        <Image
          src="https://i.pinimg.com/736x/a1/56/af/a156af8443bb4dfdafee2e0d4bd67098.jpg"
          alt="Sending message"
          width={96}
          height={96}
          className="animate-sending-bottle"
        />
      </div>
      <div className="mt-4 flex items-center gap-2">
        <p className="font-semibold text-foreground animate-fade-in-out">Sending your bottle...</p>
      </div>
    </div>
  );
};

    