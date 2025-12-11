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
import { ArrowLeft } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

declare global {
  interface Window {
    paypal?: any;
  }
}

const PayPalIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    className="mr-2"
  >
    <path
      fill="#009cde"
      d="M20.92,8.4H9.52c-0.21,0-0.4,0.14-0.46,0.34l-2.4,10.19c-0.05,0.22,0.1,0.44,0.33,0.44h4.48c0.21,0,0.4-0.14,0.46-0.34l0.42-1.76c0.05-0.22-0.1-0.44-0.33-0.44H10.5l0.6-2.52h3.33c4.6,0,7.03-2.27,7.42-6.52C21.9,7.66,21.47,8.4,20.92,8.4z"
    />
    <path
      fill="#002f86"
      d="M21.73,6.33C21.23,2.95,18.73,1,15.1,1H7.26c-0.21,0-0.4,0.14-0.46,0.34L3.1,14.53c-0.05,0.22,0.1,0.44,0.33,0.44h4.48c0.21,0,0.4-0.14,0.46-0.34l0.69-2.91c0.05-0.22-0.1-0.44-0.33-0.44H6.26l0.6-2.52h4.59c4.22,0,6.53,2.05,6.99,5.77C18.66,10.22,19.38,6.85,21.73,6.33z"
    />
  </svg>
);

export default function DonatePage() {
  const [loading, setLoading] = useState(true);
  const payPalContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Prevent script from running multiple times
    if (document.getElementById('paypal-sdk-script')) {
      if (window.paypal) {
        renderButton();
      }
      return;
    }

    const script = document.createElement('script');
    script.id = 'paypal-sdk-script';
    script.src =
      'https://www.paypal.com/sdk/js?client-id=BAADLMgwdnlvARLbuxsTH5_Nhwo7AR8VTjuSiVkBSGCRGe0nOkS2VnN8SX-UvQXAKNuzRPhQ2YFnVcdoD8&components=hosted-buttons&disable-funding=venmo&currency=PHP';
    script.setAttribute('data-sdk-integration-source', 'developer-studio');

    script.onload = () => {
      renderButton();
    };

    script.onerror = () => {
      console.error('Failed to load PayPal SDK script.');
      setLoading(false); // Stop loading on error
    };

    document.body.appendChild(script);

    function renderButton() {
      const container = payPalContainerRef.current;
      if (container && window.paypal && window.paypal.HostedButtons) {
        container.innerHTML = '';
        try {
          window.paypal
            .HostedButtons({
              hostedButtonId: 'B6PNF57J7SZ4J',
            })
            .render(container); // Pass the container element directly
          setLoading(false);
        } catch (e) {
          console.error('PayPal button rendering error:', e);
          setLoading(false);
        }
      }
    }
  }, []);

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Header />
      <main className="flex flex-1 items-center justify-center">
        <div className="container w-full max-w-md px-4 py-8 md:py-16">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl font-bold">
                <PayPalIcon />
                Complete Your Donation
              </CardTitle>
              <CardDescription className="pt-1">
                Your generous contribution will be processed securely through
                PayPal. Thank you for your support!
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading && (
                <div className="flex flex-col items-center justify-center min-h-[250px] space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-8 w-3/4" />
                </div>
              )}
              <div
                id="paypal-container-B6PNF57J7SZ4J"
                ref={payPalContainerRef}
                className={`mx-auto transition-opacity duration-500 ${
                  loading ? 'opacity-0 h-0' : 'opacity-100 min-h-[250px]'
                }`}
              >
                {/* PayPal button will render here */}
              </div>
              <p className="mt-4 text-center text-xs text-muted-foreground">
                If the button does not appear, please try disabling your
                ad-blocker for this site.
              </p>
            </CardContent>
            <CardFooter className="justify-center">
              <Button variant="outline" asChild>
                <Link href="/support">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Support
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
}
