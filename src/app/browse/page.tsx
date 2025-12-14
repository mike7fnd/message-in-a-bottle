'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { getRecipients, type Recipient } from '@/lib/data';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { AdsenseAd } from '@/components/AdsenseAd';

export default function BrowsePage() {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function fetchRecipients() {
      setIsLoading(true);
      const fetchedRecipients = await getRecipients();
      setRecipients(fetchedRecipients);
      setIsLoading(false);
    }
    fetchRecipients();
  }, []);

  const filteredRecipients = recipients.filter((recipient) =>
    recipient.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto max-w-2xl px-4 py-8 md:py-16">
          <div className="space-y-2 text-center">
            <h1 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl">
              Browse Bottles
            </h1>
            <p className="text-muted-foreground">
              Select a recipient to view their messages.
            </p>
          </div>
          <div className="sticky top-[60px] z-10 py-4">
            <div className="relative mx-auto max-w-md">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search for a recipient..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10"
              />
            </div>
          </div>
          
          <div className="my-6">
            <AdsenseAd adSlot="YOUR_AD_SLOT_ID" />
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {isLoading &&
              Array.from({ length: 4 }).map((_, index) => (
                <Card
                  key={index}
                  className="transform border-0 bg-transparent shadow-none transition-transform duration-200"
                >
                  <CardHeader>
                    <CardTitle className="flex flex-col items-center gap-2 text-center">
                      <Skeleton className="h-40 w-40 rounded-full" />
                      <Skeleton className="h-6 w-24" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="mx-auto h-4 w-16" />
                  </CardContent>
                </Card>
              ))}
            {!isLoading &&
              filteredRecipients.map((recipient: Recipient) => (
                <Link
                  href={`/bottle/${recipient.name}`}
                  key={recipient.name}
                  className="group"
                >
                  <Card className="transform border-0 bg-transparent shadow-none transition-transform duration-200 group-hover:scale-105">
                    <CardHeader>
                      <CardTitle className="flex flex-col items-center gap-2 text-center">
                        <Image
                          src="https://i.pinimg.com/736x/a1/56/af/a156af8443bb4dfdafee2e0d4bd67098.jpg"
                          alt="Message in a bottle"
                          width={160}
                          height={160}
                          className="h-40 w-40"
                        />
                        <span className="capitalize">{recipient.name}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-center text-sm text-muted-foreground">
                        {recipient.messageCount} message
                        {recipient.messageCount > 1 ? 's' : ''}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
          </div>
        </div>
      </main>
    </div>
  );
}
