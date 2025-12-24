
'use client';

import { forwardRef } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';

interface StoryPreviewProps {
  recipient: string;
  message: string;
  messageUrl: string;
}

export const StoryPreview = forwardRef<HTMLDivElement, StoryPreviewProps>(
  ({ recipient, message, messageUrl }, ref) => {
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === 'dark';

    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
      messageUrl
    )}&bgcolor=${isDark ? '0d0d0d' : 'f8f8f8'}&color=${isDark ? 'ffffff' : '000000'}&qzone=1`;

    const truncatedMessage = message.length > 200 ? message.substring(0, 200) + '...' : message;

    return (
      <div
        ref={ref}
        className={cn(
          'aspect-[9/16] w-full max-w-md rounded-30px overflow-hidden flex flex-col p-8',
          isDark ? 'bg-[#0d0d0d] text-white' : 'bg-zinc-50 text-black'
        )}
      >
        <div className="text-center">
            <Image
                src="https://image2url.com/images/1766463519278-b41cc74d-4d9f-4adf-82bd-253c257a6379.jpeg"
                alt="Logo"
                width={120}
                height={24}
                className={cn('mx-auto h-6 w-auto', isDark && 'invert')}
                unoptimized
            />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
          <p className="font-normal capitalize text-2xl">
            For <span className="font-playfair italic">{recipient}</span>,
          </p>
          <blockquote className="text-lg max-w-xs mx-auto">
            “{truncatedMessage}”
          </blockquote>
        </div>

        <div className="flex flex-col items-center justify-center space-y-3">
          <Image
            src={qrCodeUrl}
            width={100}
            height={100}
            alt="QR Code"
            className="rounded-lg"
            unoptimized
          />
          <p className="text-xs font-semibold uppercase tracking-wider">
            Scan to read the full message
          </p>
        </div>
      </div>
    );
  }
);

StoryPreview.displayName = 'StoryPreview';
