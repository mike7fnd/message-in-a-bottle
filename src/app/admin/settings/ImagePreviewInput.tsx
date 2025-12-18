
'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface ImagePreviewInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}

export function ImagePreviewInput({ id, label, value, onChange, disabled }: ImagePreviewInputProps) {
  const [isValid, setIsValid] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Basic URL validation
    if (value && (value.startsWith('http') || value.startsWith('data:image'))) {
      setIsLoading(true);
      // We don't need to actually load the image here, just check if it's a plausible URL
      // The <Image> component will handle loading and errors.
      setIsValid(true);
    } else {
      setIsValid(false);
      setIsLoading(false);
    }
  }, [value]);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-4">
        <Input id={id} name={id} value={value} onChange={onChange} disabled={disabled} />
        <div className="w-20 h-20 flex-shrink-0 border rounded-md flex items-center justify-center bg-muted/50">
          {isValid ? (
            <>
                {isLoading && <Skeleton className="h-full w-full" />}
                <Image
                    src={value}
                    alt="Preview"
                    width={80}
                    height={80}
                    className={`object-contain transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                    onLoad={() => setIsLoading(false)}
                    onError={() => {
                        setIsValid(false);
                        setIsLoading(false);
                    }}
                    unoptimized
                />
            </>
          ) : (
            <span className="text-xs text-muted-foreground text-center p-1">Invalid URL</span>
          )}
        </div>
      </div>
    </div>
  );
}
