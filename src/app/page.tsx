import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Header } from '@/components/Header';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
<meta name="google-site-verification" content="YLiLJ6ExznDUcI5rOKtyZqiJwXQaPRigc-yE_jrPQJ8" />

export default function Home() {
  const heroImage = PlaceHolderImages[0];
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="flex flex-1 flex-col items-center justify-center bg-background text-center">
        <div className="space-y-4 px-4 py-8 md:py-16">
          {heroImage && (
            <Image
              src={heroImage.imageUrl}
              alt={heroImage.description}
              width={400}
              height={400}
              className="mx-auto"
              data-ai-hint={heroImage.imageHint}
            />
          )}
          <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
            Send anonymous messages into the digital ocean. A modern twist on a
            classic way to connect.
          </p>
        </div>
        <div className="flex w-full flex-col justify-center gap-4 px-4 sm:w-auto sm:flex-row">
          <Button asChild size="lg">
            <Link href="/send">Send a Message</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/browse">Browse Messages</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
