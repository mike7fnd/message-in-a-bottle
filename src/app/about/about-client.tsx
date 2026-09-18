
'use client';
import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, MessageSquare, AlertCircle, CheckCircle, Loader2, Star, Eye, ChevronLeft, Code2, TrendingUp, Users } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { addFeedback, addReview, type Review } from '@/lib/data';
import { getCachedReviews, optimisticAddReview } from '@/lib/cached-data';
import { useUser } from '@/firebase';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getContent, type SiteContent } from '@/lib/content';
import { getCachedContent } from '@/lib/cached-data';


function ReviewStars({ rating, className }: { rating: number, className?: string }) {
  return (
    <div className={cn("flex space-x-0.5", className)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            'h-5 w-5',
            rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30'
          )}
        />
      ))}
    </div>
  );
}

function AboutPageContent() {
  const [content, setContent] = useState<SiteContent | null>(null);
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState('suggestion');
  const [formState, setFormState] = useState<{ success: boolean; message?: string; errors?: any }>({ success: false });
  const [isPending, startTransition] = useTransition();
  const { user } = useUser();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState('');
  const [reviewFormState, setReviewFormState] = useState<{ success: boolean; message?: string }>({ success: false });
  const [isReviewPending, startReviewTransition] = useTransition();
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  const router = useRouter();


  useEffect(() => {
    async function fetchData() {
      setIsLoadingReviews(true);
      try {
        const [fetchedReviews, fetchedContent] = await Promise.all([
          getCachedReviews((fresh) => setReviews(fresh)),
          getCachedContent((fresh) => setContent(fresh)),
        ]);
        setReviews(fetchedReviews);
        setContent(fetchedContent);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoadingReviews(false);
      }
    }
    fetchData();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) {
      setFormState({ success: false, message: "Feedback content cannot be empty." });
      return;
    }
    startTransition(async () => {
      try {
        await addFeedback(feedback, feedbackType, user?.uid);
        setFormState({ success: true, message: "Thank you! Your feedback has been sent." });
        setFeedback('');
      } catch (error) {
        console.error(error);
        setFormState({ success: false, message: "Failed to send feedback. Please try again." });
      }
    });
  }

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setReviewFormState({ success: false, message: "Please select a rating." });
      return;
    }
    if (!review.trim()) {
      setReviewFormState({ success: false, message: "Please write a review." });
      return;
    }
    if (!user) {
      setReviewFormState({ success: false, message: "You must be logged in to leave a review." });
      return;
    }
    startReviewTransition(async () => {
      try {
        const senderName = user.displayName || 'Anonymous';
        await addReview(rating, review, user.uid, senderName);
        setReviewFormState({ success: true, message: "Thank you for your review! You can now close this window." });
        // Optimistically add the new review to the list
        const newReview: Review = {
          id: Date.now().toString(), // temporary ID
          rating,
          content: review,
          senderId: user.uid,
          senderName,
          timestamp: new Date(),
        };
        setReviews(prev => [newReview, ...prev]);
        optimisticAddReview(newReview);
        setRating(0);
        setReview('');
        // Keep the modal open to show the success message
        // setIsReviewModalOpen(false);
      } catch (error) {
        console.error("Failed to submit review:", error);
        setReviewFormState({ success: false, message: "Failed to submit review. Please try again." });
      }
    });
  }

  const averageRating = reviews.length > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 0;

  if (!content) {
    return (
      <div className="flex min-h-dvh flex-col bg-background">
        <main className="flex-1">
          <div className="container mx-auto max-w-2xl px-4 py-8 md:py-16 space-y-8">
            <Card>
              <CardHeader className="items-center text-center">
                <Skeleton className="h-12 w-12 rounded-full" />
                <Skeleton className="h-7 w-48 mt-2" />
                <Skeleton className="h-4 w-64 mt-2" />
              </CardHeader>
              <CardContent className="flex justify-center p-6 pt-0">
                <Skeleton className="h-12 w-32" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="items-center text-center">
                <Skeleton className="h-7 w-40" />
                <Skeleton className="h-4 w-56 mt-2" />
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="items-center text-center">
                <Skeleton className="h-12 w-12 rounded-full" />
                <Skeleton className="h-7 w-48 mt-2" />
                <Skeleton className="h-4 w-64 mt-2" />
              </CardHeader>
              <CardContent className="flex justify-center p-6 pt-0">
                <Skeleton className="h-12 w-40" />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

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
          <section
            id="about"
            className="animate-in fade-in-0 duration-500 space-y-8"
            aria-labelledby="about-heading"
          >
            <Card>
              <CardHeader className="items-center text-center">
                <Heart className="h-12 w-12 text-primary" />
                <CardTitle>{content.aboutSupportTitle}</CardTitle>
                <CardDescription>
                  {content.aboutSupportDescription}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center p-6 pt-0">
                <Button asChild size="lg">
                  <Link href="https://paypal.me/MikeFernandez255" target="_blank" rel="noopener noreferrer">{content.aboutDonateButton}</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex flex-col items-center text-center">
                  <CardTitle>{content.aboutReviewsTitle}</CardTitle>
                  <CardDescription>{content.aboutReviewsDescription}</CardDescription>
                </div>
                {isLoadingReviews ? (
                  <div className="flex items-center justify-center gap-2 pt-4">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 pt-4">
                    <ReviewStars rating={averageRating} />
                    <p className="text-sm text-muted-foreground">
                      {content.aboutReviewsAverage
                        .replace('{avg}', averageRating.toFixed(1))
                        .replace('{count}', reviews.length.toString())
                      }
                    </p>
                  </div>
                )}
              </CardHeader>
              <CardContent className="relative space-y-6">
                {isLoadingReviews ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="space-y-2 border-b pb-4">
                      <div className="flex justify-between items-center">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-5 w-24" />
                      </div>
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ))
                ) : reviews.length > 0 ? (
                  <div className="relative">
                    {reviews.slice(0, 3).map((r) => (
                      <div key={r.id} className="space-y-2 border-b pb-4 mb-4 last:border-b-0 last:mb-0">
                        <div className="flex justify-between items-center">
                          <p className="font-semibold">{r.senderName}</p>
                          <ReviewStars rating={r.rating} />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {r.timestamp ? format(new Date(r.timestamp), "MMMM d, yyyy") : 'Just now'}
                        </p>
                        <p className="text-foreground pt-2">{r.content}</p>
                      </div>
                    ))}
                    {reviews.length > 3 && (
                      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-card to-transparent pointer-events-none"></div>
                    )}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">{content.aboutNoReviews}</p>
                )}
              </CardContent>
              <CardFooter className="flex-col sm:flex-row justify-center gap-2 p-6">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-auto" disabled={reviews.length === 0}>
                      <Eye className="mr-2 h-4 w-4" /> {content.aboutViewAllButton}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-[90vw] max-w-lg">
                    <DialogHeader>
                      <DialogTitle>{content.aboutAllReviewsTitle}</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="max-h-[60vh] pr-4">
                      <div className="space-y-6 py-4">
                        {reviews.map((r) => (
                          <div key={r.id} className="space-y-2 border-b pb-4 last:border-b-0">
                            <div className="flex justify-between items-center">
                              <p className="font-semibold">{r.senderName}</p>
                              <ReviewStars rating={r.rating} />
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {r.timestamp ? format(new Date(r.timestamp), "MMMM d, yyyy") : 'Just now'}
                            </p>
                            <p className="text-foreground pt-2">{r.content}</p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>

                <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full sm:w-auto">
                      <Star className="mr-2 h-4 w-4" /> {content.aboutReviewNowButton}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-[90vw] max-w-md">
                    <DialogHeader>
                      <DialogTitle>{content.aboutRateAppTitle}</DialogTitle>
                      <DialogDescription>{content.aboutRateAppDescription}</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleReviewSubmit} className="space-y-6 py-4">
                      <div className="flex justify-center space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={cn(
                              'h-8 w-8 cursor-pointer transition-colors',
                              (hoverRating >= star || rating >= star) ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/50'
                            )}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => setRating(star)}
                          />
                        ))}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="review-content-modal">{content.aboutYourReviewLabel}</Label>
                        <Textarea
                          id="review-content-modal"
                          placeholder={content.aboutYourReviewPlaceholder}
                          value={review}
                          onChange={(e) => setReview(e.target.value)}
                          required
                          className="min-h-[120px]"
                        />
                      </div>
                      <Button type="submit" disabled={isReviewPending || !user} className="w-full">
                        {isReviewPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {content.aboutSubmitReviewButton}
                      </Button>
                      {!user && <p className="text-center text-sm text-muted-foreground">{content.aboutMustBeLoggedIn}</p>}
                    </form>
                    {reviewFormState.message && (
                      <div className={cn(
                        'mt-4 flex items-center rounded-lg p-3 text-sm',
                        reviewFormState.success ? 'bg-green-100/50 text-green-800' : 'bg-red-100/50 text-red-800'
                      )}>
                        {reviewFormState.success ? <CheckCircle className="mr-2 h-4 w-4" /> : <AlertCircle className="mr-2 h-4 w-4" />}
                        {reviewFormState.message}
                      </div>
                    )}
                  </DialogContent>
                </Dialog>

              </CardFooter>
            </Card>

            <Card>
              <CardHeader className="items-center text-center">
                <MessageSquare className="h-12 w-12 text-primary" />
                <CardTitle>
                  {content.aboutFeedbackTitle}
                </CardTitle>
                <CardDescription>
                  {content.aboutFeedbackDescription}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center p-6 pt-0">
                <Dialog open={isFeedbackModalOpen} onOpenChange={setIsFeedbackModalOpen}>
                  <DialogTrigger asChild>
                    <Button size="lg">{content.aboutLeaveFeedbackButton}</Button>
                  </DialogTrigger>
                  <DialogContent className="w-[90vw] max-w-md">
                    <DialogHeader>
                      <DialogTitle>{content.aboutSubmitFeedbackTitle}</DialogTitle>
                      <DialogDescription>{content.aboutSubmitFeedbackDescription}</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                      <Tabs value={feedbackType} onValueChange={setFeedbackType}>
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="suggestion">{content.aboutFeedbackSuggestion}</TabsTrigger>
                          <TabsTrigger value="bug">{content.aboutFeedbackBug}</TabsTrigger>
                          <TabsTrigger value="other">{content.aboutFeedbackOther}</TabsTrigger>
                        </TabsList>
                      </Tabs>

                      <div className="space-y-2">
                        <Label htmlFor="feedback-content-modal">{content.aboutYourFeedbackLabel}</Label>
                        <Textarea
                          id="feedback-content-modal"
                          placeholder="Tell us what you think..."
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                          required
                          className="min-h-[120px]"
                        />
                      </div>
                      <Button type="submit" disabled={isPending} className="w-full">
                        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Submit Feedback
                      </Button>
                    </form>
                    {formState.message && (
                      <div className={cn(
                        'flex items-center rounded-lg p-3 text-sm',
                        formState.success ? 'bg-green-100/50 text-green-800' : 'bg-red-100/50 text-red-800'
                      )}>
                        {formState.success ? <CheckCircle className="mr-2 h-4 w-4" /> : <AlertCircle className="mr-2 h-4 w-4" />}
                        {formState.message}
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            {/* ── Developer section ──────────────────────────────────────── */}
            <Card>
              <CardHeader className="items-center text-center">
                <Image
                  src="https://image2url.com/images/1766356602104-3c5a46eb-6e5d-431c-88d1-c20df83cf767.jpg"
                  alt="Mike Fernandez"
                  width={80}
                  height={80}
                  className="rounded-full shadow-subtle mb-2"
                />
                <CardTitle>Meet the Developer</CardTitle>
                <CardDescription>The person behind the bottle</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 text-sm text-muted-foreground leading-relaxed">
                <p>
                  Hi, I'm <span className="font-semibold text-foreground">Mike Fernandez</span> — a developer from the Philippines.
                  Message in a Bottle started as a small hobby project, a quiet corner of the internet where
                  people could leave words for someone without the pressure of a reply or a reaction.
                </p>
                <p>
                  What began as a simple idea grew into something I didn't expect. People started using it
                  to express things they couldn't say out loud — to friends, to strangers, to people they
                  miss. Over <span className="font-semibold text-foreground">100,000 messages</span> have
                  been sent into the digital ocean, and that number still surprises me every time I look at it.
                </p>
                <p>
                  The app is built entirely by one person, maintained in spare time, and kept free for everyone.
                  There are no investors, no team, no marketing budget — just code, curiosity, and the belief
                  that sometimes people just need a place to say something.
                </p>

                <div className="grid grid-cols-3 gap-4 pt-2">
                  <div className="flex flex-col items-center gap-1 rounded-20px bg-muted p-3 text-center">
                    <Users className="h-5 w-5 text-primary" />
                    <span className="font-semibold text-foreground text-base">100K+</span>
                    <span className="text-xs">Messages Sent</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 rounded-20px bg-muted p-3 text-center">
                    <Code2 className="h-5 w-5 text-primary" />
                    <span className="font-semibold text-foreground text-base">Solo</span>
                    <span className="text-xs">Built by 1 dev</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 rounded-20px bg-muted p-3 text-center">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <span className="font-semibold text-foreground text-base">Free</span>
                    <span className="text-xs">Always free</span>
                  </div>
                </div>

                <p>
                  If you want to follow along, see what else I build, or just say hi — I'm on TikTok and
                  Instagram as <span className="font-semibold text-foreground">@dvbmke</span>.
                </p>
              </CardContent>
              <CardFooter className="flex justify-center gap-3 flex-wrap">
                <Button asChild variant="outline" size="sm">
                  <Link href="https://www.tiktok.com/@dvbmke" target="_blank" rel="noopener noreferrer">
                    TikTok
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="https://www.instagram.com/dvbmike" target="_blank" rel="noopener noreferrer">
                    Instagram
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="mailto:mikefernandex227@gmail.com">
                    Email
                  </Link>
                </Button>
              </CardFooter>
            </Card>

          </section>
        </div>
      </main>
    </div>
  );
}

export default function AboutPage() {
  return <AboutPageContent />;
}
