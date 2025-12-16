
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
    async function fetchReviews() {
        setIsLoadingReviews(true);
        try {
            const fetchedReviews = await getReviews();
            setReviews(fetchedReviews);
        } catch (error) {
            console.error("Failed to fetch reviews:", error);
        } finally {
            setIsLoadingReviews(false);
        }
    }
    fetchReviews();
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
                <CardTitle>Support the Developers</CardTitle>
                <CardDescription>
                  Your contribution helps us maintain and improve this
                  application. Every little bit helps!
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center p-6 pt-0">
                <Button asChild size="lg">
                  <Link href="https://buymeacoffee.com/dvbmike" target="_blank" rel="noopener noreferrer">Donate Now</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex flex-col items-center text-center">
                        <CardTitle>Community Reviews</CardTitle>
                        <CardDescription>See what others are saying about the app.</CardDescription>
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
                                {averageRating.toFixed(1)} average from {reviews.length} reviews
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
                        <p className="text-center text-muted-foreground py-8">No reviews yet. Be the first!</p>
                    )}
                </CardContent>
                 <CardFooter className="flex-col sm:flex-row justify-center gap-2 p-6">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="w-full sm:w-auto" disabled={reviews.length === 0}>
                                <Eye className="mr-2 h-4 w-4" /> View All Reviews
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="w-[90vw] max-w-lg">
                            <DialogHeader>
                                <DialogTitle>All Community Reviews</DialogTitle>
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
                                <Star className="mr-2 h-4 w-4"/> Review Now
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="w-[90vw] max-w-md">
                            <DialogHeader>
                                <DialogTitle>Rate the App</DialogTitle>
                                <DialogDescription>Share your experience by leaving a review.</DialogDescription>
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
                                    <Label htmlFor="review-content-modal">Your Review</Label>
                                    <Textarea 
                                        id="review-content-modal"
                                        placeholder="What did you like or dislike?"
                                        value={review}
                                        onChange={(e) => setReview(e.target.value)}
                                        required
                                        className="min-h-[120px]"
                                    />
                                </div>
                                <Button type="submit" disabled={isReviewPending || !user} className="w-full">
                                    {isReviewPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Submit Review
                                </Button>
                                {!user && <p className="text-center text-sm text-muted-foreground">You must be logged in to submit a review.</p>}
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
                        Feedback
                    </CardTitle>
                    <CardDescription>
                        Have a suggestion or found a bug? Let us know!
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center p-6 pt-0">
                    <Dialog open={isFeedbackModalOpen} onOpenChange={setIsFeedbackModalOpen}>
                        <DialogTrigger asChild>
                            <Button size="lg">Leave Feedback</Button>
                        </DialogTrigger>
                        <DialogContent className="w-[90vw] max-w-md">
                            <DialogHeader>
                                <DialogTitle>Submit Feedback</DialogTitle>
                                <DialogDescription>What's on your mind? Let us know how we can improve.</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                                <Tabs value={feedbackType} onValueChange={setFeedbackType}>
                                    <TabsList className="grid w-full grid-cols-3">
                                        <TabsTrigger value="suggestion">Suggestion</TabsTrigger>
                                        <TabsTrigger value="bug">Bug</TabsTrigger>
                                        <TabsTrigger value="other">Other</TabsTrigger>
                                    </TabsList>
                                </Tabs>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="feedback-content-modal">Your Feedback</Label>
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
