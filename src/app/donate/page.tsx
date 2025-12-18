
'use client';

import { Header } from '@/components/Header';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, CreditCard } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { getContent, type SiteContent } from '@/lib/content';
import { Skeleton } from '@/components/ui/skeleton';

const PayPalIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className="mr-2" fill="currentColor"><path d="M7.44,2.338H18.335l-2.658,16.632H5.021L7.44,2.338M22.016,8.23l-1.12,6.974a2.52,2.52,0,0,1-2.46,2.155H10.551l-.392,2.445-.052.327a.627.627,0,0,0,.623.73H13.6l.248,1.456H9.132a2.46,2.46,0,0,1-2.459-2.19l3.96-24.639h7.44l.248,1.456H11.2l-.248,1.545h6.3a2.52,2.52,0,0,1,2.459,2.83Z"/></svg>
)

export default function DonatePage() {
  const [content, setContent] = useState<SiteContent | null>(null);

  useEffect(() => {
    getContent().then(setContent);
  }, []);

  if (!content) {
    return (
       <div className="flex min-h-dvh flex-col bg-background">
        <Header />
        <main className="flex flex-1 items-center justify-center">
            <div className="container w-full max-w-md px-4 py-8 md:py-16">
                <Card>
                    <CardHeader className="items-center text-center">
                        <Skeleton className="h-16 w-16 rounded-full" />
                        <Skeleton className="h-8 w-48 mt-2" />
                        <Skeleton className="h-4 w-full mt-1" />
                        <Skeleton className="h-4 w-3/4 mt-1" />
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center gap-4">
                        <Skeleton className="h-12 w-full" />
                    </CardContent>
                    <CardFooter className="justify-center">
                        <Skeleton className="h-10 w-32" />
                    </CardFooter>
                </Card>
            </div>
        </main>
       </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Header />
      <main className="flex flex-1 items-center justify-center">
        <div className="container w-full max-w-md px-4 py-8 md:py-16">
          <Card>
            <CardHeader className="items-center text-center">
                <CreditCard className="h-16 w-16 text-primary" />
              <CardTitle className="flex items-center gap-2 text-2xl font-bold pt-2">
                {content.donateTitle}
              </CardTitle>
              <CardDescription className="pt-1">
                {content.donateDescription}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center gap-4">
              <Button asChild size="lg">
                <Link
                  href="https://paypal.me/MikeFernandez255"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full"
                >
                  <PayPalIcon />
                  {content.donateWithPaypal}
                </Link>
              </Button>
            </CardContent>
            <CardFooter className="justify-center">
              <Button variant="outline" asChild>
                <Link href="/about">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {content.donateBackButton}
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
}
