
'use server';

import { promises as fs } from 'fs';
import path from 'path';
import { cache } from 'react';

export interface SiteContent {
  // Home Page
  homeSubtitle: string;
  homeDarkModeTitle: string;
  homeDarkModeSubtitle: string;
  homeSendButton: string;
  homeBrowseButton: string;
  homeHeroImageLight: string;
  homeHeroImageDark: string;
  homeHintImageLight: string;
  homeHintImageDark: string;
  // Send Page
  sendTitle: string;
  sendSubtitle: string;
  sendRecipientLabel: string;
  sendRecipientPlaceholder: string;
  sendMessageLabel: string;
  sendMessagePlaceholder: string;
  sendAddSomethingButton: string;
  sendAttachPhotoButton: string;
  sendDrawButton: string;
  sendAddSongButton: string;
  sendMessageButton: string;
  sendSuccessTitle: string;
  sendSuccessDescription: string;
  sendCopyLinkButton: string;
  sendAnotherButton: string;
  sendDrawingTitle: string;
  sendMusicTitle: string;
  sendMusicPlaceholder: string;
  sendFeaturedSongs: string;
  sendNote: string;
  sendSuccessImageLight: string;
  sendSuccessImageDark: string;
  sendSendingImageLight: string;
  sendSendingImageDark: string;
  // Browse Page
  browseTitle: string;
  browseSubtitle: string;
  browseSearchPlaceholder: string;
  browseNewMessages: string; // "New Message(s)"
  browseLoadMore: string;
  browseEnd: string;
  browseNoResults: string;
  browseBottleImageLight: string;
  browseBottleImageDark: string;
  browseBottleHoverImageLight: string;
  browseBottleHoverImageDark: string;
  // Bottle Page
  bottleBackButton: string;
  bottleTitle: string; // "letter's for"
  bottleSubtitle: string;
  bottleNoMessages: string;
  // Message Page
  messageBackButton: string;
  messageFor: string;
  // About Page
  aboutSupportTitle: string;
  aboutSupportDescription:string;
  aboutDonateButton: string;
  aboutReviewsTitle: string;
  aboutReviewsDescription: string;
  aboutReviewsAverage: string; // "{avg} average from {count} reviews"
  aboutNoReviews: string;
  aboutViewAllButton: string;
  aboutAllReviewsTitle: string;
  aboutReviewNowButton: string;
  aboutRateAppTitle: string;
  aboutRateAppDescription: string;
  aboutYourReviewLabel: string;
  aboutYourReviewPlaceholder: string;
  aboutSubmitReviewButton: string;
  aboutMustBeLoggedIn: string;
  aboutFeedbackTitle: string;
  aboutFeedbackDescription: string;
  aboutLeaveFeedbackButton: string;
  aboutSubmitFeedbackTitle: string;
  aboutSubmitFeedbackDescription: string;
  aboutFeedbackSuggestion: string;
  aboutFeedbackBug: string;
  aboutFeedbackOther: string;
  aboutYourFeedbackLabel: string;
  // Donate Page
  donateTitle: string;
  donateDescription: string;
  donateWithPaypal: string;
  donateBackButton: string;
}


const contentFilePath = path.join(process.cwd(), 'src', 'lib', 'site-content.json');

// Using React's `cache` to deduplicate requests within a single render pass
export const getContent = cache(async (): Promise<SiteContent> => {
  try {
    const fileContent = await fs.readFile(contentFilePath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error('Failed to read site content:', error);
    // Return default content as a fallback
    return {
      homeSubtitle: "Send anonymous messages into the digital ocean.",
      homeDarkModeTitle: "Reading at Night?",
      homeDarkModeSubtitle: "It's bad for the eyes. Double-click the lamp to activate dark mode.",
      homeSendButton: "Send a Message",
      homeBrowseButton: "Browse Messages",
      homeHeroImageLight: "https://images.pexels.com/photos/35230228/pexels-photo-35230228.png",
      homeHeroImageDark: "https://i.ibb.co/cXVXsHjJ/Fsw-GESQo.jpg",
      homeHintImageLight: "https://i.ibb.co/rGWKNLgw/Gemini-Generated-Image-abs8y5abs8y5abs8.png",
      homeHintImageDark: "https://i.ibb.co/rGXHyCpy/wfn66enk.jpg",
      sendTitle: "Cast a Message into the Ocean",
      sendSubtitle: "Your message will be delivered anonymously.",
      sendRecipientLabel: "This letter is for:",
      sendRecipientPlaceholder: "e.g., Mike",
      sendMessageLabel: "Your Anonymous Message",
      sendMessagePlaceholder: "Write Something...",
      sendAddSomethingButton: "Add Something",
      sendAttachPhotoButton: "Attach a Photo",
      sendDrawButton: "Draw",
      sendAddSongButton: "Add a Song",
      sendMessageButton: "Send Message",
      sendSuccessTitle: "Message Sent!",
      sendSuccessDescription: "Your message is now floating in the digital ocean. Share the link with your recipient.",
      sendCopyLinkButton: "Copy Link",
      sendAnotherButton: "Send Another",
      sendDrawingTitle: "Create a Sketch",
      sendMusicTitle: "Search for a Song",
      sendMusicPlaceholder: "Search for a song or artist...",
      sendFeaturedSongs: "Featured Songs",
      sendNote: "Note: Once a message is sent into the ocean, it cannot be unsent.",
      sendSuccessImageLight: "https://i.ibb.co/GvX9XMwm/bottle-default.png",
      sendSuccessImageDark: "https://i.ibb.co/pkBNQZv/bottle-glow-dark-mode.png",
      sendSendingImageLight: "https://i.ibb.co/GvX9XMwm/bottle-default.png",
      sendSendingImageDark: "https://i.ibb.co/pkBNQZv/bottle-glow-dark-mode.png",
      browseTitle: "Browse Bottles",
      browseSubtitle: "Select a recipient to view their messages.",
      browseSearchPlaceholder: "Search for a recipient...",
      browseNewMessages: "New Message", // Singular, will add 's' in component
      browseLoadMore: "Load More",
      browseEnd: "You've reached the end.",
      browseNoResults: "No bottles found for",
      browseBottleImageLight: "https://i.ibb.co/GvX9XMwm/bottle-default.png",
      browseBottleImageDark: "https://i.ibb.co/nKmq0gc/Gemini-Generated-Image-5z3cjz5z3cjz5z3c-removebg-preview.png",
      browseBottleHoverImageLight: "https://i.ibb.co/3mRwMGRq/bottle-glow.png",
      browseBottleHoverImageDark: "https://i.ibb.co/pkBNQZv/bottle-glow-dark-mode.png",
      bottleBackButton: "Back to all bottles",
      bottleTitle: "letter's for",
      bottleSubtitle: "Click each message to open.",
      bottleNoMessages: "No messages in this bottle yet.",
      messageBackButton: "Back to", // e.g., "Back to {recipient}'s bottle"
      messageFor: "for",
      aboutSupportTitle: "Support the Developers",
      aboutSupportDescription: "Your contribution helps us maintain and improve this application. Every little bit helps!",
      aboutDonateButton: "Donate Now",
      aboutReviewsTitle: "Community Reviews",
      aboutReviewsDescription: "See what others are saying about the app.",
      aboutReviewsAverage: "{avg} average from {count} reviews",
      aboutNoReviews: "No reviews yet. Be the first!",
      aboutViewAllButton: "View All Reviews",
      aboutAllReviewsTitle: "All Community Reviews",
      aboutReviewNowButton: "Review Now",
      aboutRateAppTitle: "Rate the App",
      aboutRateAppDescription: "Share your experience by leaving a review.",
      aboutYourReviewLabel: "Your Review",
      aboutYourReviewPlaceholder: "What did you like or dislike?",
      aboutSubmitReviewButton: "Submit Review",
      aboutMustBeLoggedIn: "You must be logged in to submit a review.",
      aboutFeedbackTitle: "Feedback",
      aboutFeedbackDescription: "Have a suggestion or found a bug? Let us know!",
      aboutLeaveFeedbackButton: "Leave Feedback",
      aboutSubmitFeedbackTitle: "Submit Feedback",
      aboutSubmitFeedbackDescription: "What's on your mind? Let us know how we can improve.",
      aboutFeedbackSuggestion: "Suggestion",
      aboutFeedbackBug: "Bug",
      aboutFeedbackOther: "Other",
      aboutYourFeedbackLabel: "Your Feedback",
      donateTitle: "Support the Project",
      donateDescription: "If you find this application useful, please consider supporting its development. Every donation helps!",
      donateWithPaypal: "Donate with PayPal",
      donateBackButton: "Back to About",
    };
  }
});

export async function getRawContent(): Promise<string> {
    try {
        return await fs.readFile(contentFilePath, 'utf-8');
    } catch (error) {
        console.error('Failed to read raw site content:', error);
        return "{}";
    }
}

export async function saveContent(newContent: SiteContent | string): Promise<{ success: boolean; error?: string }> {
  try {
    const contentString = typeof newContent === 'string' ? newContent : JSON.stringify(newContent, null, 2);
    // Validate if the content is valid JSON before saving
    JSON.parse(contentString);
    await fs.writeFile(contentFilePath, contentString, 'utf-8');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to save site content:', error);
    if (error instanceof SyntaxError) {
        return { success: false, error: 'Invalid JSON format. Please check your syntax.' };
    }
    return { success: false, error: 'Failed to save content file.' };
  }
}
