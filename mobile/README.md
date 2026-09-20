# Message in a Bottle — Mobile

React Native (Expo + expo-router) client for the same backend the web app uses.
It is a native app, not a WebView wrapper: every screen is built from native
components against the web app's design tokens.

> **Status: feature-complete against the web app, but never run.** Every
> user-facing screen exists. See [Verification status](#verification-status) for
> exactly what has and has not been checked.

---

## How it relates to `../` (the web app)

The web app at the repository root stays the source of truth. This app does not
duplicate it — it shares it.

| Concern | Shared how |
|---|---|
| Database | The same Firestore project, same collections, same security rules. `src/lib/data.ts` is a port of the web's, not a second schema. |
| Site copy & imagery | Fetched from `GET /api/content` on the deployed web app, which serves `src/lib/site-content.json`. Edit copy in the admin panel and both apps change. |
| Spotify | Calls the web app's `/api/spotify/*`, so the client secret stays on the server. |
| Feedback & reports | Written to the same Firestore `feedback` collection the operator already reads at `/admin/feedback`. Nothing new to check, so nothing gets missed. |
| Privacy & Terms | Open the live web pages. A legal document that exists in two places drifts, and correcting one should never need a store release. |
| Design tokens | `src/theme/tokens.ts` is a hand-converted port of `../src/app/globals.css`. Each colour keeps its original HSL triplet in a comment so the two can be diffed. |

Changing one app cannot break the other: separate `package.json`, separate
dependency trees, no imports across the boundary.

---

## Running it

```bash
cd mobile
npm install
cp .env.example .env     # then fill in the Firebase values
npx expo start
```

Expo Go covers the whole app except ads — the AdMob native module does not exist
there, so `src/lib/ads.ts` detects its absence and ad slots simply render
nothing. For ads and Google Sign-In you need a custom dev build:

```bash
npx expo prebuild
npx expo run:android      # or run:ios
```

---

## Screens

Every user-facing route on the web has a native counterpart.

| Screen | Notes |
|---|---|
| Home | Hero, tagline, primary actions, "how it works", credit |
| Browse | Virtualised grid, debounced search, pull-to-refresh, responsive columns |
| Send | Validated form, time-capsule picker, rate limit, success state, share-to-story card |
| Bottle | Message list, pull-to-refresh, favorites |
| Message | Countdown for sealed notes, click-to-load Spotify, report, 1080×1920 share card |
| Auth | Sign in / sign up, Firebase error codes mapped to plain language |
| History | Your sent messages, inline edit, delete with confirmation |
| Favorites | Local list with in-memory search |
| About | Community reviews, star rating, submit a review, donate |
| Contact | Topic picker, validation, spam cooldown, honeypot timing check |
| Settings | Theme (light/dark/system), privacy toggles, legal links |
| Profile | Identity, sign in/out, links to everything above |
| 404 | Native equivalent of "Lost at Sea" |

**Foundation**: design tokens for both themes, the 4px spacing scale, the
`rounded-30px` radius language, `shadow-subtle`, all three fonts; a native UI kit
replacing the shadcn/Radix primitives (`Button` with 6 variants × 4 sizes,
`Card`, `Input`, `Textarea`, `Label`, `Skeleton`, `Separator`, `AppText` with 8
typographic variants); Firebase with AsyncStorage auth persistence;
stale-while-revalidate cache with memory + disk tiers, request de-duplication
and a GC sweep on cold start.

---

## What is intentionally not here

1. **Admin console.** Operator tooling belongs on the web; there is no reason to
   ship it to every phone.
2. **Google Sign-In.** Not built, because it cannot work without native
   credentials only you can generate (see Owner action). Email/password works
   today, and the dependency is already installed for when you add them.
3. **Photo and song attachment on Send.** The web send form does not have these
   either — building them here would advertise a feature the product lacks. The
   *display* side is complete: a message that already has a photo or track shows
   them.
4. **A certified consent platform.** Settings has a real personalisation toggle
   that defaults to off, but serving *personalised* ads in the EEA/UK/CH needs
   Google's UMP SDK. Until that is wired up, personalisation stays off unless
   someone opts in — the conservative position.

---

## Deliberate differences from the web

These are intentional, not oversights:

- **Queries are bounded.** `getMessagesForRecipient`, `getMessagesForUser` and
  `getReviews` take a limit; the web versions have none and read every matching
  document. Firestore bills per read, and a phone on mobile data is where that
  hurts most. Page sizes live in `PAGE_SIZE` in `src/lib/data.ts`.
- **Sealed messages never reach the render tree.** The web blurs the text in
  CSS, which still ships it to the DOM. Here a locked message renders a
  countdown and nothing else.
- **Spotify is click-to-load**, matching the web — nothing is requested from
  Spotify until the reader asks.
- **Orientation is unlocked.** The web PWA manifest is portrait-locked, but a
  native app that refuses to rotate feels broken on a tablet.
- **Share produces the designed card, not a screenshot.** 1080×1920, 9:16 —
  stories are vertical, and a 16:9 image posted to one is letterboxed into a
  strip. Colours are pinned so a dark-mode reader exports the same image as
  everyone else.

---

## Owner action required

- **Firebase values** — copy from the root `.env`, renaming `NEXT_PUBLIC_` to
  `EXPO_PUBLIC_`.
- **Google Sign-In** — register the Android SHA-1 fingerprint in the Firebase
  console and add `google-services.json`. Only you can generate these.
- **AdMob** — create an AdMob account, then set `ADMOB_ANDROID_APP_ID`,
  `ADMOB_IOS_APP_ID` and the `EXPO_PUBLIC_ADMOB_UNIT_*` ids. Until then the build
  uses Google's published sample application ids so it still compiles, and debug
  builds always request test ads.
  **AdSense and AdMob are different products** — your existing `ca-pub-…`
  publisher id does not work here.
- **App icons** — `assets/` reuses the web PWA icons. A 1284×2778 splash and a
  properly padded adaptive icon would look better.
- **`app.config.ts` uses the same Android package as the existing Capacitor
  build** (`com.messageinabottle.dvbmike`), so this replaces that app rather than
  becoming a second Play Store listing. Change it if you want both.

---

## Verification status

What has actually been checked:

| Check | Result |
|---|---|
| `npm install` | ✅ 1308 packages, exit 0 |
| `npx tsc --noEmit` across all 34 source files | ✅ **0 errors** |
| `npx expo install --check` | ✅ "Dependencies are up to date" |
| Web app still builds with the added `/api/content` route | ✅ 26/26 routes |

**What has NOT been checked: anything at runtime.** This was written with no
emulator, no device and no Metro bundler. No screen has been rendered, no
Firestore query executed, no APK produced. Types compiling and dependencies
aligning are real signals, but they are not the same as the app working.

Expect a debugging pass on first run. The likeliest places to need attention:

- **Font family names.** `useFonts` keys must match the strings in
  `src/theme/tokens.ts` exactly; a mismatch falls back to the system font
  silently rather than erroring.
- **`captureRef` on the off-screen card.** It needs a laid-out native view;
  if the capture comes back blank, the off-canvas positioning is the first
  thing to check.
- **The `getReactNativePersistence` cast** in `src/lib/firebase.ts`, which
  works around a gap in Firebase's published types.
