
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useState, useTransition, useEffect } from 'react';
import { Loader2, Eye } from 'lucide-react';
import { getContent, saveContent, type SiteContent } from '@/lib/content';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ImagePreviewInput } from './ImagePreviewInput';


export default function AdminSettingsPage() {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [isLoading, setIsLoading] = useState(true);
    const [content, setContent] = useState<SiteContent | null>(null);

    useEffect(() => {
        const fetchContent = async () => {
            setIsLoading(true);
            const fetchedContent = await getContent();
            setContent(fetchedContent);
            setIsLoading(false);
        };
        fetchContent();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (!content) return;
        const { name, value } = e.target;
        setContent(prev => prev ? { ...prev, [name]: value } : null);
    };

    const handleSave = async () => {
        if (!content) return;

        startTransition(async () => {
            const result = await saveContent(content);
            if (result.success) {
                toast({
                    title: "Settings Saved!",
                    description: "Your changes are now live.",
                });
            } else {
                toast({
                    variant: 'destructive',
                    title: "Save Failed",
                    description: result.error || "Could not save settings. Please try again.",
                });
            }
        });
    };
    
    if (isLoading || !content) {
        return (
            <>
                <div className="flex items-center">
                    <h1 className="text-lg font-semibold md:text-2xl">Site Contents</h1>
                </div>
                <div className="grid gap-6">
                    {/* Skeleton for multiple cards */}
                    {Array.from({ length: 4 }).map((_, i) => (
                         <Card key={i}>
                            <CardHeader>
                                <CardTitle><Skeleton className="h-7 w-32" /></CardTitle>
                                <CardDescription><Skeleton className="h-4 w-48" /></CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2"><Skeleton className="h-10 w-full" /></div>
                                <div className="space-y-2"><Skeleton className="h-10 w-full" /></div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </>
        )
    }

  return (
    <>
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Site Contents</h1>
      </div>
      <div>
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Home Page</CardTitle>
                    <CardDescription>Edit the static text and images content on the main landing page.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="homeSubtitle">Subtitle</Label>
                        <Textarea id="homeSubtitle" name="homeSubtitle" value={content.homeSubtitle} onChange={handleChange} disabled={isPending} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="homeDarkModeTitle">Dark Mode Title</Label>
                        <Input id="homeDarkModeTitle" name="homeDarkModeTitle" value={content.homeDarkModeTitle} onChange={handleChange} disabled={isPending} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="homeDarkModeSubtitle">Dark Mode Subtitle</Label>
                        <Textarea id="homeDarkModeSubtitle" name="homeDarkModeSubtitle" value={content.homeDarkModeSubtitle} onChange={handleChange} disabled={isPending} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="homeSendButton">Send Button Text</Label>
                        <Input id="homeSendButton" name="homeSendButton" value={content.homeSendButton} onChange={handleChange} disabled={isPending} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="homeBrowseButton">Browse Button Text</Label>
                        <Input id="homeBrowseButton" name="homeBrowseButton" value={content.homeBrowseButton} onChange={handleChange} disabled={isPending} />
                    </div>
                    <ImagePreviewInput
                        id="homeHeroImageLight"
                        label="Hero Image (Light Mode)"
                        value={content.homeHeroImageLight}
                        onChange={handleChange}
                        disabled={isPending}
                    />
                    <ImagePreviewInput
                        id="homeHeroImageDark"
                        label="Hero Image (Dark Mode)"
                        value={content.homeHeroImageDark}
                        onChange={handleChange}
                        disabled={isPending}
                    />
                    <ImagePreviewInput
                        id="homeHintImageLight"
                        label="Hint Image (Light Mode)"
                        value={content.homeHintImageLight}
                        onChange={handleChange}
                        disabled={isPending}
                    />
                     <ImagePreviewInput
                        id="homeHintImageDark"
                        label="Hint Image (Dark Mode)"
                        value={content.homeHintImageDark}
                        onChange={handleChange}
                        disabled={isPending}
                    />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Send Message Page</CardTitle>
                    <CardDescription>Edit the text and images on the "Send Message" page.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="sendTitle">Page Title</Label>
                        <Input id="sendTitle" name="sendTitle" value={content.sendTitle} onChange={handleChange} disabled={isPending} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="sendSubtitle">Page Subtitle</Label>
                        <Input id="sendSubtitle" name="sendSubtitle" value={content.sendSubtitle} onChange={handleChange} disabled={isPending} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="sendRecipientLabel">Recipient Label</Label>
                        <Input id="sendRecipientLabel" name="sendRecipientLabel" value={content.sendRecipientLabel} onChange={handleChange} disabled={isPending} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="sendRecipientPlaceholder">Recipient Placeholder</Label>
                        <Input id="sendRecipientPlaceholder" name="sendRecipientPlaceholder" value={content.sendRecipientPlaceholder} onChange={handleChange} disabled={isPending} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="sendMessageLabel">Message Label</Label>
                        <Input id="sendMessageLabel" name="sendMessageLabel" value={content.sendMessageLabel} onChange={handleChange} disabled={isPending} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="sendMessagePlaceholder">Message Placeholder</Label>
                        <Input id="sendMessagePlaceholder" name="sendMessagePlaceholder" value={content.sendMessagePlaceholder} onChange={handleChange} disabled={isPending} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="sendAddSomethingButton">"Add Something" Button</Label>
                        <Input id="sendAddSomethingButton" name="sendAddSomethingButton" value={content.sendAddSomethingButton} onChange={handleChange} disabled={isPending} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="sendAttachPhotoButton">"Attach Photo" Button</Label>
                        <Input id="sendAttachPhotoButton" name="sendAttachPhotoButton" value={content.sendAttachPhotoButton} onChange={handleChange} disabled={isPending} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="sendDrawButton">"Draw" Button</Label>
                        <Input id="sendDrawButton" name="sendDrawButton" value={content.sendDrawButton} onChange={handleChange} disabled={isPending} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="sendAddSongButton">"Add Song" Button</Label>
                        <Input id="sendAddSongButton" name="sendAddSongButton" value={content.sendAddSongButton} onChange={handleChange} disabled={isPending} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="sendMessageButton">Send Button Text</Label>
                        <Input id="sendMessageButton" name="sendMessageButton" value={content.sendMessageButton} onChange={handleChange} disabled={isPending} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="sendSuccessTitle">Success Title</Label>
                        <Input id="sendSuccessTitle" name="sendSuccessTitle" value={content.sendSuccessTitle} onChange={handleChange} disabled={isPending} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="sendSuccessDescription">Success Description</Label>
                        <Textarea id="sendSuccessDescription" name="sendSuccessDescription" value={content.sendSuccessDescription} onChange={handleChange} disabled={isPending} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="sendCopyLinkButton">"Copy Link" Button</Label>
                        <Input id="sendCopyLinkButton" name="sendCopyLinkButton" value={content.sendCopyLinkButton} onChange={handleChange} disabled={isPending} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="sendAnotherButton">"Send Another" Button</Label>
                        <Input id="sendAnotherButton" name="sendAnotherButton" value={content.sendAnotherButton} onChange={handleChange} disabled={isPending} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="sendDrawingTitle">Drawing Modal Title</Label>
                        <Input id="sendDrawingTitle" name="sendDrawingTitle" value={content.sendDrawingTitle} onChange={handleChange} disabled={isPending} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="sendMusicTitle">Music Modal Title</Label>
                        <Input id="sendMusicTitle" name="sendMusicTitle" value={content.sendMusicTitle} onChange={handleChange} disabled={isPending} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="sendMusicPlaceholder">Music Search Placeholder</Label>
                        <Input id="sendMusicPlaceholder" name="sendMusicPlaceholder" value={content.sendMusicPlaceholder} onChange={handleChange} disabled={isPending} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="sendFeaturedSongs">Featured Songs Label</Label>
                        <Input id="sendFeaturedSongs" name="sendFeaturedSongs" value={content.sendFeaturedSongs} onChange={handleChange} disabled={isPending} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="sendNote">Footer Note</Label>
                        <Textarea id="sendNote" name="sendNote" value={content.sendNote} onChange={handleChange} disabled={isPending} />
                    </div>
                    <ImagePreviewInput
                        id="sendSuccessImageLight"
                        label="Success Image (Light Mode)"
                        value={content.sendSuccessImageLight}
                        onChange={handleChange}
                        disabled={isPending}
                    />
                    <ImagePreviewInput
                        id="sendSuccessImageDark"
                        label="Success Image (Dark Mode)"
                        value={content.sendSuccessImageDark}
                        onChange={handleChange}
                        disabled={isPending}
                    />
                    <ImagePreviewInput
                        id="sendSendingImageLight"
                        label="Sending Animation Image (Light Mode)"
                        value={content.sendSendingImageLight}
                        onChange={handleChange}
                        disabled={isPending}
                    />
                    <ImagePreviewInput
                        id="sendSendingImageDark"
                        label="Sending Animation Image (Dark Mode)"
                        value={content.sendSendingImageDark}
                        onChange={handleChange}
                        disabled={isPending}
                    />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Browse Page</CardTitle>
                    <CardDescription>Edit the text and images on the "Browse Bottles" page.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="browseTitle">Page Title</Label>
                        <Input id="browseTitle" name="browseTitle" value={content.browseTitle} onChange={handleChange} disabled={isPending} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="browseSubtitle">Page Subtitle</Label>
                        <Input id="browseSubtitle" name="browseSubtitle" value={content.browseSubtitle} onChange={handleChange} disabled={isPending} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="browseSearchPlaceholder">Search Placeholder</Label>
                        <Input id="browseSearchPlaceholder" name="browseSearchPlaceholder" value={content.browseSearchPlaceholder} onChange={handleChange} disabled={isPending} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="browseNewMessages">"New Messages" Text</Label>
                        <Input id="browseNewMessages" name="browseNewMessages" value={content.browseNewMessages} onChange={handleChange} disabled={isPending} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="browseLoadMore">Load More Button</Label>
                        <Input id="browseLoadMore" name="browseLoadMore" value={content.browseLoadMore} onChange={handleChange} disabled={isPending} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="browseEnd">End of List Text</Label>
                        <Input id="browseEnd" name="browseEnd" value={content.browseEnd} onChange={handleChange} disabled={isPending} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="browseNoResults">No Results Text</Label>
                        <Input id="browseNoResults" name="browseNoResults" value={content.browseNoResults} onChange={handleChange} disabled={isPending} />
                    </div>
                    <ImagePreviewInput
                        id="browseBottleImageLight"
                        label="Bottle Image (Light Mode)"
                        value={content.browseBottleImageLight}
                        onChange={handleChange}
                        disabled={isPending}
                    />
                    <ImagePreviewInput
                        id="browseBottleImageDark"
                        label="Bottle Image (Dark Mode)"
                        value={content.browseBottleImageDark}
                        onChange={handleChange}
                        disabled={isPending}
                    />
                    <ImagePreviewInput
                        id="browseBottleHoverImageLight"
                        label="Bottle Hover Image (Light Mode)"
                        value={content.browseBottleHoverImageLight}
                        onChange={handleChange}
                        disabled={isPending}
                    />
                    <ImagePreviewInput
                        id="browseBottleHoverImageDark"
                        label="Bottle Hover Image (Dark Mode)"
                        value={content.browseBottleHoverImageDark}
                        onChange={handleChange}
                        disabled={isPending}
                    />
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle>Bottle & Message Pages</CardTitle>
                    <CardDescription>Edit text for viewing messages.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="bottleBackButton">"Back to all" Button</Label>
                        <Input id="bottleBackButton" name="bottleBackButton" value={content.bottleBackButton} onChange={handleChange} disabled={isPending} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="bottleTitle">Bottle Page Title</Label>
                        <Input id="bottleTitle" name="bottleTitle" value={content.bottleTitle} onChange={handleChange} disabled={isPending} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="bottleSubtitle">Bottle Page Subtitle</Label>
                        <Input id="bottleSubtitle" name="bottleSubtitle" value={content.bottleSubtitle} onChange={handleChange} disabled={isPending} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="bottleNoMessages">No Messages Text</Label>
                        <Input id="bottleNoMessages" name="bottleNoMessages" value={content.bottleNoMessages} onChange={handleChange} disabled={isPending} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="messageBackButton">Message Page "Back" Text</Label>
                        <Input id="messageBackButton" name="messageBackButton" value={content.messageBackButton} onChange={handleChange} disabled={isPending} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="messageFor">Message "For" text</Label>
                        <Input id="messageFor" name="messageFor" value={content.messageFor} onChange={handleChange} disabled={isPending} />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>About Page</CardTitle>
                    <CardDescription>Edit the text on the "About" page.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                     <div className="space-y-2">
                        <Label htmlFor="aboutSupportTitle">Support Title</Label>
                        <Input id="aboutSupportTitle" name="aboutSupportTitle" value={content.aboutSupportTitle} onChange={handleChange} disabled={isPending} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="aboutSupportDescription">Support Description</Label>
                        <Textarea id="aboutSupportDescription" name="aboutSupportDescription" value={content.aboutSupportDescription} onChange={handleChange} disabled={isPending} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="aboutDonateButton">Donate Button Text</Label>
                        <Input id="aboutDonateButton" name="aboutDonateButton" value={content.aboutDonateButton} onChange={handleChange} disabled={isPending} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="aboutReviewsTitle">Reviews Title</Label>
                        <Input id="aboutReviewsTitle" name="aboutReviewsTitle" value={content.aboutReviewsTitle} onChange={handleChange} disabled={isPending} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="aboutReviewsDescription">Reviews Description</Label>
                        <Input id="aboutReviewsDescription" name="aboutReviewsDescription" value={content.aboutReviewsDescription} onChange={handleChange} disabled={isPending} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="aboutReviewsAverage">Reviews Average Text</Label>
                        <Input id="aboutReviewsAverage" name="aboutReviewsAverage" value={content.aboutReviewsAverage} onChange={handleChange} disabled={isPending} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="aboutNoReviews">No Reviews Text</Label>
                        <Input id="aboutNoReviews" name="aboutNoReviews" value={content.aboutNoReviews} onChange={handleChange} disabled={isPending} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="aboutViewAllButton">"View All" Button</Label>
                        <Input id="aboutViewAllButton" name="aboutViewAllButton" value={content.aboutViewAllButton} onChange={handleChange} disabled={isPending} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="aboutAllReviewsTitle">"All Reviews" Modal Title</Label>
                        <Input id="aboutAllReviewsTitle" name="aboutAllReviewsTitle" value={content.aboutAllReviewsTitle} onChange={handleChange} disabled={isPending} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="aboutReviewNowButton">"Review Now" Button</Label>
                        <Input id="aboutReviewNowButton" name="aboutReviewNowButton" value={content.aboutReviewNowButton} onChange={handleChange} disabled={isPending} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="aboutRateAppTitle">Rate App Modal Title</Label>
                        <Input id="aboutRateAppTitle" name="aboutRateAppTitle" value={content.aboutRateAppTitle} onChange={handleChange} disabled={isPending} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="aboutRateAppDescription">Rate App Modal Description</Label>
                        <Input id="aboutRateAppDescription" name="aboutRateAppDescription" value={content.aboutRateAppDescription} onChange={handleChange} disabled={isPending} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="aboutYourReviewLabel">"Your Review" Label</Label>
                        <Input id="aboutYourReviewLabel" name="aboutYourReviewLabel" value={content.aboutYourReviewLabel} onChange={handleChange} disabled={isPending} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="aboutYourReviewPlaceholder">Review Placeholder</Label>
                        <Input id="aboutYourReviewPlaceholder" name="aboutYourReviewPlaceholder" value={content.aboutYourReviewPlaceholder} onChange={handleChange} disabled={isPending} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="aboutSubmitReviewButton">"Submit Review" Button</Label>
                        <Input id="aboutSubmitReviewButton" name="aboutSubmitReviewButton" value={content.aboutSubmitReviewButton} onChange={handleChange} disabled={isPending} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="aboutMustBeLoggedIn">"Must be logged in" Text</Label>
                        <Input id="aboutMustBeLoggedIn" name="aboutMustBeLoggedIn" value={content.aboutMustBeLoggedIn} onChange={handleChange} disabled={isPending} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="aboutFeedbackTitle">Feedback Title</Label>
                        <Input id="aboutFeedbackTitle" name="aboutFeedbackTitle" value={content.aboutFeedbackTitle} onChange={handleChange} disabled={isPending} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="aboutFeedbackDescription">Feedback Description</Label>
                        <Input id="aboutFeedbackDescription" name="aboutFeedbackDescription" value={content.aboutFeedbackDescription} onChange={handleChange} disabled={isPending} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="aboutLeaveFeedbackButton">Leave Feedback Button</Label>
                        <Input id="aboutLeaveFeedbackButton" name="aboutLeaveFeedbackButton" value={content.aboutLeaveFeedbackButton} onChange={handleChange} disabled={isPending} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="aboutSubmitFeedbackTitle">Submit Feedback Modal Title</Label>
                        <Input id="aboutSubmitFeedbackTitle" name="aboutSubmitFeedbackTitle" value={content.aboutSubmitFeedbackTitle} onChange={handleChange} disabled={isPending} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="aboutSubmitFeedbackDescription">Submit Feedback Modal Description</Label>
                        <Textarea id="aboutSubmitFeedbackDescription" name="aboutSubmitFeedbackDescription" value={content.aboutSubmitFeedbackDescription} onChange={handleChange} disabled={isPending} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="aboutFeedbackSuggestion">"Suggestion" Tab</Label>
                        <Input id="aboutFeedbackSuggestion" name="aboutFeedbackSuggestion" value={content.aboutFeedbackSuggestion} onChange={handleChange} disabled={isPending} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="aboutFeedbackBug">"Bug" Tab</Label>
                        <Input id="aboutFeedbackBug" name="aboutFeedbackBug" value={content.aboutFeedbackBug} onChange={handleChange} disabled={isPending} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="aboutFeedbackOther">"Other" Tab</Label>
                        <Input id="aboutFeedbackOther" name="aboutFeedbackOther" value={content.aboutFeedbackOther} onChange={handleChange} disabled={isPending} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="aboutYourFeedbackLabel">"Your Feedback" Label</Label>
                        <Input id="aboutYourFeedbackLabel" name="aboutYourFeedbackLabel" value={content.aboutYourFeedbackLabel} onChange={handleChange} disabled={isPending} />
                    </div>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Donate Page</CardTitle>
                    <CardDescription>Edit the text on the "Donate" page.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                     <div className="space-y-2">
                        <Label htmlFor="donateTitle">Page Title</Label>
                        <Input id="donateTitle" name="donateTitle" value={content.donateTitle} onChange={handleChange} disabled={isPending} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="donateDescription">Page Description</Label>
                        <Textarea id="donateDescription" name="donateDescription" value={content.donateDescription} onChange={handleChange} disabled={isPending} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="donateWithPaypal">"Donate with PayPal" Button</Label>
                        <Input id="donateWithPaypal" name="donateWithPaypal" value={content.donateWithPaypal} onChange={handleChange} disabled={isPending} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="donateBackButton">"Back" Button</Label>
                        <Input id="donateBackButton" name="donateBackButton" value={content.donateBackButton} onChange={handleChange} disabled={isPending} />
                    </div>
                </CardContent>
            </Card>


            <div className="flex justify-end gap-2">
                 <Button variant="outline" asChild>
                    <Link href="/" target="_blank">
                        <Eye className="mr-2 h-4 w-4" />
                        View Public Site
                    </Link>
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirm Changes</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to save these changes? This will immediately update the live content on the public site.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleSave}>Confirm & Save</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
      </div>
    </>
  );
}
