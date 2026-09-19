'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function PrivacyPolicyPage() {
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
              <CardTitle>Privacy Policy</CardTitle>
              <CardDescription>
                Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[32rem] pr-6">
                <div className="space-y-6 text-sm text-muted-foreground">

                  <p>
                    Welcome to Message in a Bottle ("we", "us", or "our"), accessible at{' '}
                    <strong className="text-foreground">messageinabottle.sbs</strong>. We are committed to protecting your privacy.
                    This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our application.
                  </p>

                  <div className="space-y-2">
                    <h3 className="font-semibold text-foreground">1. Information We Collect</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><strong className="text-foreground">Account Data:</strong> If you register, we collect your name and email address.</li>
                      <li><strong className="text-foreground">Message Data:</strong> All messages, recipient names, and attached media (photos, drawings, songs) you submit are stored. Registered users have their user ID associated with their content. Anonymous users have no persistent identifier linked to their content.</li>
                      <li><strong className="text-foreground">Usage Data:</strong> We automatically collect your IP address, browser type, operating system, pages visited, and access times for analytics and security purposes.</li>
                      <li><strong className="text-foreground">Location Data:</strong> We collect approximate country and city information derived from your IP address for analytics. We do not collect precise GPS location.</li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold text-foreground">2. Cookies and Tracking Technologies</h3>
                    <p>
                      We use cookies and similar tracking technologies to operate the Service. This includes:
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><strong className="text-foreground">Essential cookies:</strong> Required for authentication and session management via Firebase Authentication.</li>
                      <li><strong className="text-foreground">Analytics cookies:</strong> We use Vercel Analytics to understand how users interact with the Service. This data is aggregated and anonymized.</li>
                      <li><strong className="text-foreground">Advertising cookies:</strong> We use Google AdSense to display advertisements. Google may use cookies to personalize ads based on your browsing history and interests. You can opt out of personalized advertising by visiting{' '}
                        <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="underline text-foreground">Google Ad Settings</a>.
                      </li>
                    </ul>
                    <p>
                      By using this Service, you consent to our use of cookies as described above.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold text-foreground">3. Third-Party Services</h3>
                    <p>We use the following third-party services that may collect data:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li><strong className="text-foreground">Firebase (Google):</strong> Authentication, database storage. <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline">Privacy Policy</a></li>
                      <li><strong className="text-foreground">Google AdSense:</strong> Advertising. Google uses cookies to serve ads based on your visits. <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" className="underline">Ad Policy</a></li>
                      <li><strong className="text-foreground">Spotify:</strong> Song search and embedded music playback. <a href="https://www.spotify.com/legal/privacy-policy/" target="_blank" rel="noopener noreferrer" className="underline">Privacy Policy</a></li>
                      <li><strong className="text-foreground">Vercel:</strong> Hosting and analytics. <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="underline">Privacy Policy</a></li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold text-foreground">4. How We Use Your Information</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>To operate and maintain the Service.</li>
                      <li>To deliver messages and display them to intended recipients.</li>
                      <li>To serve relevant advertisements via Google AdSense.</li>
                      <li>To monitor usage trends and improve the user experience.</li>
                      <li>To detect and prevent abuse, spam, or illegal activity.</li>
                      <li>To respond to user inquiries and provide support.</li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold text-foreground">5. Public Nature of Messages</h3>
                    <p>
                      All messages submitted through this Service are <strong className="text-foreground">publicly accessible</strong>. Anyone who knows or guesses a recipient's name can read messages addressed to that person. Do not include sensitive personal information in messages.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold text-foreground">6. Data Retention</h3>
                    <p>
                      We retain message data indefinitely unless deleted by the sender. Registered users may delete their own messages. Anonymous messages cannot be deleted by the sender after posting.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold text-foreground">7. Children's Privacy</h3>
                    <p>
                      This Service is not directed to children under the age of 13. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold text-foreground">8. Security</h3>
                    <p>
                      We use reasonable administrative, technical, and physical security measures to protect your information. However, no method of transmission over the internet is 100% secure.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold text-foreground">9. Your Rights</h3>
                    <p>
                      You may request deletion of your account and associated data by contacting us. Note that public messages may remain visible until manually removed by an administrator.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold text-foreground">10. Changes to This Policy</h3>
                    <p>
                      We may update this Privacy Policy from time to time. We will notify users of significant changes by updating the date at the top of this page.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold text-foreground">11. Contact Us</h3>
                    <p>
                      If you have questions about this Privacy Policy, please contact us at{' '}
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
