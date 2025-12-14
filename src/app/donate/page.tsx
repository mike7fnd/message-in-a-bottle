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
import { ArrowLeft, Coffee } from 'lucide-react';
import Image from 'next/image';

const BuyMeACoffeeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    className="mr-2 h-6 w-6"
    fill="currentColor"
  >
    <path d="M12.3,6.3c-0.2,0-0.4,0.1-0.6,0.2C11.5,6.6,11.3,6.8,11.3,7c0,0,0,0,0,0c0,0.3,0.2,0.5,0.5,0.6c0.3,0.1,0.6,0.1,0.9,0 c0.2-0.1,0.4-0.2,0.6-0.4c0.1-0.2,0.2-0.5,0.1-0.7c0-0.3-0.2-0.6-0.5-0.7C12.7,6.3,12.5,6.3,12.3,6.3z M19.4,7.6 c-0.6-0.5-1.4-0.8-2.3-0.8H8.8c-0.6,0-1,0.4-1,1v5.1c0,0.6,0.4,1,1,1h0.2c0.4,0.7,1.2,1.2,2,1.2h3.4c1.9,0,3.5-1.5,3.6-3.4 c0-0.5-0.1-1-0.3-1.4C18.6,9.5,19.3,8.5,19.4,7.6z M16.4,12.5c0,0.9-0.8,1.7-1.7,1.7h-3.4c-0.5,0-1-0.2-1.3-0.6V8.6h2.5 c0.9,0,1.7,0.8,1.7,1.7c0,0.5-0.2,0.9-0.6,1.2C14.1,11.8,14.6,12.1,15.2,12.1C15.9,12.1,16.4,12.5,16.4,12.5z M2,19h19 c0.6,0,1-0.4,1-1s-0.4-1-1-1H2c-0.6,0-1,0.4-1,1S1.4,19,2,19z" />
  </svg>
);

export default function DonatePage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Header />
      <main className="flex flex-1 items-center justify-center">
        <div className="container w-full max-w-md px-4 py-8 md:py-16">
          <Card>
            <CardHeader className="items-center text-center">
               <Image src="https://www.buymeacoffee.com/assets/img/guidelines/logo-mark-1.svg" alt="Buy Me A Coffee" width={64} height={64} className="h-16 w-16" />
              <CardTitle className="flex items-center gap-2 text-2xl font-bold pt-2">
                Buy us a Coffee
              </CardTitle>
              <CardDescription className="pt-1">
                If you find this application useful, please consider supporting
                its development. Every coffee helps!
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center gap-4">
              <Button asChild size="lg">
                <Link
                  href="https://buymeacoffee.com/dvbmike"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full"
                >
                  <BuyMeACoffeeIcon />
                  Support on Buy Me a Coffee
                </Link>
              </Button>
            </CardContent>
            <CardFooter className="justify-center">
              <Button variant="outline" asChild>
                <Link href="/about">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to About
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
}
