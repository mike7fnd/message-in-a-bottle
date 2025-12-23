
'use client';

import { Header } from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function PrivacyPolicyPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto max-w-2xl px-4 py-8 md:py-16">
          <div className="mb-4">
            <Button
              variant="link"
              onClick={() => router.push('/profile')}
              className="pl-0 text-muted-foreground"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back to Profile
            </Button>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Privacy Policy</CardTitle>
              <CardDescription>
                Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-96 pr-6">
                    <div className="space-y-6 text-sm text-muted-foreground">
                        <p>
                            Welcome to Message in a Bottle. We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our application.
                        </p>
                        <div className="space-y-2">
                            <h3 className="font-semibold text-foreground">1. Information We Collect</h3>
                            <p>
                                We may collect information about you in a variety of ways. The information we may collect on the Service includes:
                            </p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>
                                    <strong>Personal Data:</strong> Personally identifiable information, such as your name, email address, that you voluntarily give to us when you register with the Service. Anonymous users are not required to provide this information.
                                </li>
                                <li>
                                    <strong>Message Data:</strong> All messages, recipients, and attached media (photos, drawings, songs) are collected and stored. For registered users, we associate this data with your user ID. For anonymous users, the data is stored without a persistent user ID.
                                </li>
                                <li>
                                    <strong>Usage Data:</strong> We automatically collect usage information such as your IP address, browser type, operating system, access times, and the pages you have viewed directly before and after accessing the Service. We also collect location data (country and city) for analytical purposes.
                                </li>
                            </ul>
                        </div>
                         <div className="space-y-2">
                            <h3 className="font-semibold text-foreground">2. Use of Your Information</h3>
                            <p>
                                Having accurate information permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Service to:
                            </p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Create and manage your account.</li>
                                <li>Deliver messages and display them to the intended recipients.</li>
                                <li>Monitor and analyze usage and trends to improve your experience with the Service.</li>
                                <li>Protect the security and integrity of our Service.</li>
                                <li>Respond to user inquiries and offer support.</li>
                            </ul>
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-semibold text-foreground">3. Disclosure of Your Information</h3>
                            <p>
                                We do not share, sell, rent, or trade your information with third parties for their commercial purposes. Public messages are, by design, accessible to the public and may be viewed by anyone who knows the recipient's name.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-semibold text-foreground">4. Security of Your Information</h3>
                            <p>
                                We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.
                            </p>
                        </div>
                         <div className="space-y-2">
                            <h3 className="font-semibold text-foreground">5. Contact Us</h3>
                            <p>
                                If you have questions or comments about this Privacy Policy, please contact us through the feedback form available on the "About" page.
                            </p>
                        </div>
                    </div>
                </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
