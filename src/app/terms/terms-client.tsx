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
            <Button variant="link" onClick={() => router.push('/profile')} className="pl-0 text-muted-foreground">
              <ChevronLeft className="mr-1 h-4 w-4" /> Back to Profile
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
              <ScrollArea className="h-[32rem] pr-6">
                <div className="space-y-6 text-sm text-muted-foreground">

                  <p>
                    Please read these Terms of Service carefully before using{' '}
                    <strong className="text-foreground">messageinabottle.sbs</strong> (the "Service"). By accessing or using the Service, you agree to be bound by these Terms.
                  </p>

                  <div className="space-y-2">
                    <h3 className="font-semibold text-foreground">1. Acceptance of Terms</h3>
                    <p>
                      By accessing or using the Service, you confirm that you are at least 13 years of age and agree to these Terms. If you do not agree, do not use the Service.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold text-foreground">2. User Content</h3>
                    <p>
                      The Service allows you to post messages, images, drawings, and other content ("User Content"). You are solely responsible for any content you submit. By posting, you grant us a non-exclusive, worldwide, royalty-free license to store and display your content in connection with operating the Service.
                    </p>
                    <p>
                      All messages are <strong className="text-foreground">publicly accessible</strong>. Do not share passwords, financial information, or other sensitive personal data through this Service.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold text-foreground">3. Prohibited Content and Conduct</h3>
                    <p>You agree not to post or transmit content that:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Is illegal, harmful, threatening, abusive, harassing, defamatory, or obscene.</li>
                      <li>Infringes any patent, trademark, copyright, or other proprietary rights.</li>
                      <li>Contains sexual content involving minors.</li>
                      <li>Promotes hate speech, discrimination, or violence based on race, ethnicity, gender, religion, sexual orientation, or disability.</li>
                      <li>Constitutes spam, unsolicited advertising, or chain messages.</li>
                      <li>Impersonates any person or entity.</li>
                      <li>Violates any applicable local, national, or international law.</li>
                    </ul>
                    <p>
                      We reserve the right to remove any content that violates these Terms without notice.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold text-foreground">4. Advertising</h3>
                    <p>
                      The Service displays advertisements served by Google AdSense. We do not control the content of these advertisements. By using the Service, you acknowledge that advertisements may be displayed alongside user-generated content.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold text-foreground">5. Intellectual Property</h3>
                    <p>
                      The Service and its original content (excluding User Content) are the property of the developer. You may not copy, modify, distribute, or create derivative works without explicit written permission.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold text-foreground">6. Disclaimer of Warranties</h3>
                    <p>
                      The Service is provided "as is" and "as available" without warranties of any kind, express or implied. We do not warrant that the Service will be uninterrupted, error-free, or free of harmful components.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold text-foreground">7. Limitation of Liability</h3>
                    <p>
                      To the fullest extent permitted by law, we shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of, or inability to use, the Service.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold text-foreground">8. Termination</h3>
                    <p>
                      We may suspend or terminate your access to the Service at any time, with or without notice, for any reason including violation of these Terms.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold text-foreground">9. Changes to Terms</h3>
                    <p>
                      We reserve the right to modify these Terms at any time. Continued use of the Service after changes constitutes acceptance of the updated Terms. We will update the date at the top of this page when changes are made.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold text-foreground">10. Governing Law</h3>
                    <p>
                      These Terms are governed by the laws of the Republic of the Philippines, without regard to conflict of law provisions.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold text-foreground">11. Contact</h3>
                    <p>
                      For questions about these Terms, contact us at{' '}
                      <a href="mailto:mikefernandex227@gmail.com" className="underline text-foreground">mikefernandex227@gmail.com</a>.
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
