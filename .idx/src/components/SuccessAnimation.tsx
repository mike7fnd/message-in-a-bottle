
'use client';

import { Check } from 'lucide-react';
import Image from 'next/image';

export const SuccessAnimation = () => {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in-0">
      <div className="relative h-24 w-24">
        <Image
          src="https://i.pinimg.com/736x/a1/56/af/a156af8443bb4dfdafee2e0d4bd67098.jpg"
          alt="Message in a bottle"
          width={96}
          height={96}
          className="animate-bottle-sent"
          unoptimized
        />
      </div>
      <div className="mt-4 flex items-center gap-2 animate-in fade-in-0 slide-in-from-bottom-5 delay-1000 duration-500 fill-mode-both">
        <p className="font-semibold text-foreground">Message Sent!</p>
      </div>

      <style jsx>{`
        .animate-draw-circle {
          stroke-dasharray: 157;
          stroke-dashoffset: 157;
          animation: draw 0.7s cubic-bezier(0.65, 0, 0.45, 1) forwards;
        }

        .animate-draw-check {
          stroke-dasharray: 48;
          stroke-dashoffset: 48;
          animation: draw 0.5s cubic-bezier(0.65, 0, 0.45, 1) 0.5s forwards;
        }

        @keyframes draw {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
};

    
    