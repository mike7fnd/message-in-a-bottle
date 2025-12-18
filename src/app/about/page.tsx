
'use client';
import { useState, useTransition, useEffect } from 'react';
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
import { Heart, MessageSquare, AlertCircle, CheckCircle, Loader2, Star, Eye } from 'lucide-react';
import Link from 'next/link';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { addFeedback, addReview, getReviews, type Review } from '@/lib/data';
import { useUser } from '@/firebase';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getContent, type SiteContent } from '@/lib/content';


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

export default function AboutPage() {
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

  useEffect(() => {
    async function fetchData() {
        setIsLoadingReviews(true);
        try {
            const [fetchedReviews, fetchedContent] = await Promise.all([getReviews(), getContent()]);
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
            setRating(0);
            setReview('');
            // Keep the modal open to show the success message
            // setIsReviewModalOpen(false); 
        } catch (error) {
            console.error("Failed to submit review:", error);
            setReviewFormState({ success: false, message: "Failed to submit review. Please try again."});
        }
    });
  }

  const averageRating = reviews.length > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 0;
  
  if (!content) {
    return (
         <div className="flex min-h-dvh flex-col bg-background">
            <Header />
            <main className="flex-1">
                <div className="container mx-auto max-w-2xl px-4 py-8 md:py-16">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-64 w-full mt-8" />
                    <Skeleton className="h-48 w-full mt-8" />
                </div>
            </main>
        </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto max-w-2xl px-4 py-8 md:py-16">
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
                <CardContent className="space-y-6">
                    {isLoadingReviews ? (
                        Array.from({ length: 3 }).map((_, i) => (
                           <div key={i} className="space-y-2 border-b pb-4">
                                <Skeleton className="h-5 w-24" />
                                <Skeleton className="h-4 w-48" />
                                <Skeleton className="h-12 w-full" />
                           </div>
                        ))
                    ) : reviews.length > 0 ? (
                        reviews.slice(0, 3).map((r) => (
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
                        ))
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
                                <Star className="mr-2 h-4 w-4"/> {content.aboutReviewNowButton}
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

          </section>
        </div>
      </main>
    </div>
  );
}
