
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function TermsOfServicePage() {
  const router = useRouter();

  return (
    <div className="flex min-h-dvh flex-col bg-background">
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
              <CardTitle>Terms of Service</CardTitle>
              <CardDescription>
                Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-96 pr-6">
                    <div className="space-y-6 text-sm text-muted-foreground">
                        <p>
                            Please read these Terms of Service ("Terms", "Terms of Service") carefully before using the Message in a Bottle application (the "Service") operated by us.
                        </p>

                        <div className="space-y-2">
                            <h3 className="font-semibold text-foreground">1. Acceptance of Terms</h3>
                            <p>
                                By accessing or using our Service, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the Service.
                            </p>
                        </div>
                        
                        <div className="space-y-2">
                            <h3 className="font-semibold text-foreground">2. User Content</h3>
                            <p>
                                Our Service allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material ("Content"). You are responsible for the Content that you post to the Service, including its legality, reliability, and appropriateness.
                            </p>
                             <p>
                                You represent and warrant that: (i) the Content is yours (you own it) or you have the right to use it and grant us the rights and license as provided in these Terms, and (ii) the posting of your Content on or through the Service does not violate the privacy rights, publicity rights, copyrights, contract rights or any other rights of any person.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <h3 className="font-semibold text-foreground">3. Prohibited Uses</h3>
                            <p>
                                You may use the Service only for lawful purposes. You agree not to use the Service:
                            </p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>In any way that violates any applicable national or international law or regulation.</li>
                                <li>To send any advertising or promotional material, including any "junk mail", "chain letter," "spam," or any other similar solicitation.</li>
                                <li>To impersonate or attempt to impersonate the Company, a Company employee, another user, or any other person or entity.</li>
                                <li>To engage in any other conduct that restricts or inhibits anyone's use or enjoyment of the Service, or which, as determined by us, may harm the Company or users of the Service or expose them to liability.</li>
                            </ul>
                        </div>

                        <div className="space-y-2">
                            <h3 className="font-semibold text-foreground">4. Termination</h3>
                            <p>
                                We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <h3 className="font-semibold text-foreground">5. Changes to Terms</h3>
                            <p>
                                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
                            </p>
                        </div>
                         <div className="space-y-2">
                            <h3 className="font-semibold text-foreground">6. Contact Us</h3>
                            <p>
                                If you have any questions about these Terms, please contact us.
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
