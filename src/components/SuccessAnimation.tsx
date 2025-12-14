
'use client';

import { Check } from 'lucide-react';

export const SuccessAnimation = () => {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in-0">
      <div className="relative h-24 w-24">
        <svg
          className="h-full w-full"
          viewBox="0 0 52 52"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="26"
            cy="26"
            r="25"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            className="animate-draw-circle"
          />
          <path
            d="M14 27l8 8 16-16"
            stroke="hsl(var(--primary))"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-draw-check"
          />
        </svg>
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
