import { siteConfig } from './site-config';

/**
 * Site copy and imagery, fetched from the web app's /api/content endpoint.
 *
 * Every user-visible string and illustration in this app comes from the same
 * site-content.json the web reads and the admin panel edits. Hard-coding them
 * into the bundle would mean a store release every time a word changes, and the
 * two apps would drift apart within a week.
 *
 * The shape mirrors the web's SiteContent interface. Only the keys this app
 * actually renders are declared; the endpoint returns all 79.
 */
export interface SiteContent {
  // Home
  homeSubtitle: string;
  homeSendButton: string;
  homeBrowseButton: string;
  homeHeroImageLight: string;
  homeHeroImageDark: string;
  // Send
  sendTitle: string;
  sendSubtitle: string;
  sendRecipientLabel: string;
  sendRecipientPlaceholder: string;
  sendMessageLabel: string;
  sendMessagePlaceholder: string;
  sendAddSomethingButton: string;
  sendMessageButton: string;
  sendSuccessTitle: string;
  sendSuccessDescription: string;
  sendCopyLinkButton: string;
  sendAnotherButton: string;
  sendNote: string;
  sendSuccessImageLight: string;
  sendSuccessImageDark: string;
  // Browse
  browseTitle: string;
  browseSubtitle: string;
  browseSearchPlaceholder: string;
  browseNewMessages: string;
  browseLoadMore: string;
  browseEnd: string;
  browseNoResults: string;
  browseBottleImageLight: string;
  browseBottleImageDark: string;
  browseBottleHoverImageLight: string;
  browseBottleHoverImageDark: string;
  // Bottle
  bottleBackButton: string;
  bottleTitle: string;
  bottleSubtitle: string;
  bottleNoMessages: string;
  // Message
  messageBackButton: string;
  messageFor: string;
}

/**
 * Offline/first-launch fallback.
 *
 * Copied from the web's getContent() fallback so the app is never blank before
 * the network answers. These are defaults, not mock data — the live values
 * replace them as soon as the fetch resolves, and the cache keeps them for 24h.
 */
export const FALLBACK_CONTENT: SiteContent = {
  homeSubtitle: 'Send anonymous messages into the digital ocean.',
  homeSendButton: 'Send a Message',
  homeBrowseButton: 'Browse Messages',
  homeHeroImageLight:
    'https://images.pexels.com/photos/35230228/pexels-photo-35230228.png',
  homeHeroImageDark: 'https://i.ibb.co/cXVXsHjJ/Fsw-GESQo.jpg',
  sendTitle: 'Cast a Message into the Ocean',
  sendSubtitle:
    'Your message is posted anonymously for anyone to read. Nothing is sent to the person you name.',
  sendRecipientLabel: 'This letter is for:',
  sendRecipientPlaceholder: 'e.g., Mike',
  sendMessageLabel: 'Your Anonymous Message',
  sendMessagePlaceholder: 'Write Something...',
  sendAddSomethingButton: 'Add Something',
  sendMessageButton: 'Send Message',
  sendSuccessTitle: 'Message Sent!',
  sendSuccessDescription:
    'Your message is now floating in the digital ocean. Share the link with your recipient.',
  sendCopyLinkButton: 'Copy Link',
  sendAnotherButton: 'Send Another',
  sendNote:
    'Note: Once a message is sent into the ocean, it cannot be unsent.',
  sendSuccessImageLight: 'https://i.ibb.co/GvX9XMwm/bottle-default.png',
  sendSuccessImageDark: 'https://i.ibb.co/pkBNQZv/bottle-glow-dark-mode.png',
  browseTitle: 'Browse Bottles',
  browseSubtitle: 'Select a recipient to view their messages.',
  browseSearchPlaceholder: 'Search for a recipient...',
  browseNewMessages: 'New Message',
  browseLoadMore: 'Load More',
  browseEnd: "You've reached the end.",
  browseNoResults: 'No bottles found for',
  browseBottleImageLight: 'https://i.ibb.co/GvX9XMwm/bottle-default.png',
  browseBottleImageDark:
    'https://i.ibb.co/nKmq0gc/Gemini-Generated-Image-5z3cjz5z3cjz5z3c-removebg-preview.png',
  browseBottleHoverImageLight: 'https://i.ibb.co/3mRwMGRq/bottle-glow.png',
  browseBottleHoverImageDark:
    'https://i.ibb.co/pkBNQZv/bottle-glow-dark-mode.png',
  bottleBackButton: 'Back to all bottles',
  bottleTitle: "letter's for",
  bottleSubtitle: 'Click each message to open.',
  bottleNoMessages: 'No messages in this bottle yet.',
  messageBackButton: 'Back to',
  messageFor: 'for',
};

export async function fetchSiteContent(): Promise<SiteContent> {
  const res = await fetch(`${siteConfig.apiBaseUrl}/api/content`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`Content request failed: ${res.status}`);
  const json = (await res.json()) as Partial<SiteContent>;
  // Merge over the fallback so a key added on the web but not yet known here —
  // or removed from the JSON — can never render as `undefined`.
  return { ...FALLBACK_CONTENT, ...json };
}
