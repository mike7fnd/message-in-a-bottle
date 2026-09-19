# App Context — Message in a Bottle (MiaB / MiTB)

> Orientation doc for anyone (human or AI) picking up this codebase.
> Written against commit `70b0230` ("latest") on `main`.

---

## 1. What this app is

A **Next.js 15 web app for sending anonymous messages**. You write a note addressed to a name
(e.g. "mike"), it gets cast into a shared "digital ocean", and you get back a public link
(`/message/<uuid>`) to share with the recipient. Anyone can browse all recipients and read
every message — there is no private inbox and no delivery mechanism. The "bottle" is the
metaphor: a name is a bottle, and everyone's messages to that name pile up inside it.

- **Live domain:** `https://messageinabottle.sbs`
- **Hosting:** Vercel (`@vercel/analytics` is wired in; `apphosting.yaml` is a leftover from
  Firebase App Hosting)
- **Author:** Mike Fernandez ("dvbmike"), admin email `mikefernandex227@gmail.com`
- **Monetization:** Google AdSense (`ca-pub-2857031207812866`) + PayPal donations
- **Also shipped as:** a PWA (`@ducanh2912/next-pwa`) and an Android shell via Capacitor
  (`com.messageinabottle.dvbmike`)

---

## 2. Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15.5.9, App Router, React 19, Turbopack in dev |
| Language | TypeScript (**build-time type & lint errors are ignored** — see §8) |
| Styling | Tailwind CSS v3 + shadcn/ui + Radix primitives |
| Fonts | `next/font/google` — Manrope (body/headline), Playfair Display (editorial italic), Abril Fatface (display numerals) |
| Animation | GSAP + `@gsap/react`, `tailwindcss-animate`, CSS keyframes |
| Icons | `lucide-react` |
| Theme | `next-themes`, class-based dark mode, default light |
| Backend | Firebase (Auth + Firestore) — **client SDK only, no Admin SDK anywhere** |
| Forms/validation | `react-hook-form` + `zod` (zod used directly in the send form) |
| Image export | `html-to-image` (`toPng`) for shareable story cards |

There is **no test suite**, no CI config, and no linter config beyond Next's defaults.

---

## 3. Data model (Firestore)

All collections live in the default database. Rules are in [firestore.rules](firestore.rules).

| Collection | Doc id | Shape | Who can read / write |
|---|---|---|---|
| `public_messages` | uuid v4 | `{ id, content, recipient (lowercased), timestamp, senderId?, photo?, spotifyTrackId?, openTimestamp? }` | **read: everyone.** Create: any signed-in user whose `senderId` matches their uid. Update/delete: original sender (or admin delete) |
| `feedback` | auto | `{ content, type, timestamp, senderId? }` | Create: any signed-in user. Read/update/delete: admin only |
| `reviews` | uuid v4 | `{ id, rating, content, senderId, senderName, timestamp }` | read: everyone. Create: sender. Update/delete: sender or admin |
| `visits` | auto | `{ country, city, timestamp }` | Create: **anyone, unauthenticated**. Read: admin only |
| `users` | uid | profile blob | owner only |
| `recipients` | — | legacy aggregate table | read-only for clients, **never written** (see below) |
| `config/features`, `config/maintenance`, `config/scheduled` | fixed | admin toggles | read via unauthenticated Firestore REST; written via REST with an admin ID token |

Two things worth internalizing:

1. **`recipients` is dead.** The "browse" list is derived on the client by pulling the latest
   100 `public_messages` and grouping them by `recipient` in memory
   ([data.ts:getRecipientsByFallback](src/lib/data.ts)). This was a deliberate workaround for a
   permission error on transactional writes — the comment `CRITICAL FIX: No more transaction` in
   [data.ts](src/lib/data.ts) marks it. Consequence: **browse only ever shows recipients from the
   most recent 100 messages**, and message counts are counts-within-that-window, not true totals.
2. **Almost all sorting and filtering happens client-side** to avoid needing composite Firestore
   indexes. Queries fetch, then `.sort()` in JS. Fine at current scale, will not scale.

`docs/backend.json` is a JSON-Schema description of the intended entities (Message, Sender,
Recipient) — it documents the *design*, not what the code does. Treat it as historical.

---

## 4. Authentication model

Everyone is signed in, always. [FirebaseProvider](src/firebase/provider.tsx) calls
`signInAnonymously()` whenever `onAuthStateChanged` reports no user. That anonymous UID is what
satisfies the Firestore create rules — it is the mechanism that lets "anonymous" messages be
written securely without spoofing.

- Anonymous users: can send, browse, read, favorite (localStorage-only).
- Upgraded users (email/password or Google popup via [/auth](src/app/auth/page.tsx)): additionally
  get `/history` (edit + delete their own sent messages), a profile with avatar/cover, and the
  ability to leave a review.
- Admin: hardcoded email allowlist in two places — `ADMIN_EMAILS` in
  [admin/layout.tsx](src/app/admin/layout.tsx) and `isAdmin()` in
  [firestore.rules](firestore.rules). Both must be edited together.

---

## 5. Routes

**Public**

| Route | Rendering | Notes |
|---|---|---|
| `/` | server (`revalidate 3600`) → [home-client](src/app/home-client.tsx) | marketing page, JSON-LD `WebApplication`, "100,000+" counter (hardcoded copy) |
| `/send` | server (3600) → [send-client](src/app/send/send-client.tsx) | form is `dynamic(..., { ssr: false })` |
| `/browse` | server (300) → [browse-client](src/app/browse/browse-client.tsx) | infinite scroll, 2 recipients per batch |
| `/bottle/[name]` | server (3600) → [bottle-client](src/app/bottle/[name]/bottle-client.tsx) | all messages for one name |
| `/message/[id]` | `revalidate 0` → [message-client](src/app/message/[id]/message-client.tsx) | single message, Spotify embed, photo, time-capsule countdown, share-as-PNG |
| `/about` | reviews + feedback submission | |
| `/profile`, `/history`, `/settings`, `/donate`, `/privacy`, `/terms`, `/auth` | client | `/history` and profile tabs require sign-in |

**API** (`src/app/api/`)

- `GET /api/spotify/search?query=` — proxies Spotify search, hides credentials, process-level
  LRU cache (200 entries / 15 min) + `s-maxage=900`, serves stale on upstream error.
- `GET /api/spotify/featured` — 22 hardcoded track IDs, 24h process cache.
- `POST /api/track-visit` — responds `200` immediately, then does geo-IP lookup
  (`pro.ip-api.com`, **key hardcoded in the source**) and writes a `visits` doc in the background.

**Admin** (`/admin/*`, blocked in `robots.txt`, client-side guard only)

- `/admin/messages` — paginated list of every message, delete
- `/admin/feedback` — read feedback
- `/admin/settings` — edits all 79 copy/image strings in
  [src/lib/site-content.json](src/lib/site-content.json) via the `saveContent` server action
- `/admin/more` — maintenance mode, scheduled "coming soon" lock, feature flags. Writes to
  `config/*` docs through the **Firestore REST API** with a fresh ID token rather than the SDK.

---

## 6. The CMS layer (important)

Nearly every user-visible string and illustration is **not in the JSX**. It lives in
[src/lib/site-content.json](src/lib/site-content.json) (79 keys), typed as `SiteContent` in
[src/lib/content.ts](src/lib/content.ts), read server-side with `fs.readFile` wrapped in React
`cache()`, and passed down as a `content` prop.

So: **to change copy or a hero image, edit the JSON (or use `/admin/settings`), not the component.**

Caveat — `saveContent` writes to the filesystem with `fs.writeFile`. On Vercel's serverless
runtime the filesystem is read-only/ephemeral, so admin content edits **will not persist in
production**; they work locally. `content.ts` has a full hardcoded fallback object if the read
fails, which masks the failure rather than surfacing it.

---

## 7. The caching system

There is a hand-rolled stale-while-revalidate cache under [src/lib/cache/](src/lib/cache/), and it
is the intended read path for all Firestore data.

```
UI → cached-data.ts → smartFetch → memory cache → localStorage cache → data.ts → Firestore
```

- [types.ts](src/lib/cache/types.ts) — `TTL` presets (STATIC 24h, SEMI_STATIC 30m, MEDIUM 5m,
  MESSAGE_LIST 3m, MESSAGE 10m, SPOTIFY_SEARCH 15m, USER_MESSAGES 2m). Entry goes STALE at 1×TTL,
  EXPIRED at 2×TTL.
- [smart-fetch.ts](src/lib/cache/smart-fetch.ts) — dedup of in-flight requests, SWR, background
  revalidation via an `onFresh` callback that components use to re-`setState`.
- [cached-data.ts](src/lib/cached-data.ts) — the public API. **Call these, not `data.ts` directly.**
  `getCachedRecipients`, `getCachedMessagesForRecipient`, `getCachedMessageById`,
  `getCachedMessagesForUser`, `getCachedReviews`, `getCachedContent`, `getCachedFeaturedTracks`,
  `getCachedSpotifySearch`, plus mutation wrappers (`addMessageCached`, `deleteMessageCached`,
  `editMessageCached`) that invalidate the right namespaces.
- Per-message and per-user caches are memory-only (`persist: false`) because the content is
  sensitive; recipients/reviews/content/spotify persist to localStorage.
- [CacheProvider](src/components/CacheProvider.tsx) runs a GC sweep and prefetches site content once
  on mount.

Admin pages deliberately bypass this and hit `data.ts` directly.

---

## 8. Known problems and loose ends

These are real, in the committed code. Flagging them so they aren't mistaken for intent.

1. **`/` throws a `ReferenceError`.** [home-client.tsx:101](src/app/home-client.tsx#L101) renders
   `{homeMediaSectionVisible && (...)}` but that identifier is never declared or imported in the
   file. The home page should call `useFeatures()` and destructure it. Because `next.config.ts` sets
   `typescript.ignoreBuildErrors: true`, this compiles and only fails at render time, after
   `mounted` flips true.
2. **`useFeatures()` has zero callers.** [use-features.ts](src/hooks/use-features.ts) exists and
   `/admin/more` writes all three flags, but nothing in the app reads them — so
   `spotifyEnabled` and `imageUploadEnabled` currently control nothing.
3. **Maintenance mode and the scheduled lock are write-only.** `/admin/more` saves
   `config/maintenance` and `config/scheduled`, but no user-facing component reads either doc.
   Flipping the switch does nothing to visitors.
4. **The send form can't attach anything.** [SendMessageForm.tsx](src/components/SendMessageForm.tsx)
   only submits text + an optional time-capsule open date; it passes `undefined` for `photo` and
   `spotifyTrackId`. Everything downstream — the `Message` type, the Spotify API routes, the embed
   and photo rendering in `/message/[id]`, and the `sendAttachPhotoButton` / `sendDrawButton` /
   `sendAddSongButton` copy keys — is still in place. The UI was removed, the plumbing wasn't.
   Existing messages with attachments still display correctly.
5. **`.env` is tracked in git** despite being listed in `.gitignore` (committed before it was
   ignored; present in at least `4682070`, `020c13f`, `39e42b8`). `SPOTIFY_CLIENT_SECRET` and
   `GEMINI_API_KEY` are in the history. Rotating those and running a history scrub is the fix —
   deleting the file now does not remove it from past commits. The ip-api key in
   [track-visit/route.ts](src/app/api/track-visit/route.ts) is hardcoded in source as well.
6. **Two divergent copies of the security rules.** [firestore.rules](firestore.rules) (root, the one
   deployed) and [src/firestore.rules](src/firestore.rules) differ — the `src/` copy is an older
   variant with no `reviews` block and a stricter update rule (`hasOnly(['content'])`). The root
   copy's `update` rule does **not** restrict which fields change. Delete the stale copy.
7. **Rate limiting is localStorage-only.** [rate-limit.ts](src/lib/rate-limit.ts) enforces one
   message per 24h per browser. Clearing site data or opening a private window bypasses it entirely;
   the file says so in its own header comment. There is no server-side limit.
8. **Duplicate / orphaned files.** `use-mobile.ts` and `use-mobile.tsx` both exist and differ (the
   `.ts` wins at resolution). Unused with zero importers: `ViewBottleForm.tsx`,
   `SuccessAnimation.tsx`, `Message-card.tsx` (lowercase twin of `MessageCard.tsx`),
   `PageCache.tsx`, `ThemeToggle.tsx`, `MessageCacheContext.tsx`. `AnnouncementBar.tsx` returns
   `null`. `src/ai/genkit.ts` and `src/ai/flows/spotify-search-flow.ts` are stubs reading
   "no longer in use" — the Genkit/AI message-polishing feature from the original blueprint was
   removed, though `GEMINI_API_KEY` is still in `.env`.
9. **`node_modules` is not installed** in this working copy, so nothing can be typechecked or built
   until `npm install` is run.

---

## 9. Conventions to follow

- **Server component fetches content, client component renders it.** The pattern is
  `page.tsx` (server, `export const revalidate`, metadata) → `*-client.tsx` (`'use client'`),
  with `content: SiteContent` passed as a prop.
- **Read data through `cached-data.ts`**, and pass the `onFresh` callback so SWR updates land in
  state. Use the `*Cached` mutation wrappers so invalidation happens.
- **Copy and imagery go in `site-content.json`**, not inline.
- **Design tokens only** — no raw hex. `bg-background`, `text-muted-foreground`, `border-border`,
  etc. Interactive surfaces use `rounded-30px`; the custom shadow is `shadow-subtle`. Full
  reference in [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md), which is accurate and worth reading before any
  UI work.
- **Mobile-first.** [MainLayout](src/components/MainLayout.tsx) branches on `useIsMobile()` and
  returns `null` until it resolves: mobile gets `Header` + fixed `BottomNav`; desktop gets
  `DesktopSidebar` + a custom bottle cursor. Respect `env(safe-area-inset-bottom)`.
- **Firestore errors** are surfaced through `errorEmitter` /
  `FirestorePermissionError` ([src/firebase/errors.ts](src/firebase/errors.ts)) and caught by
  [FirebaseErrorListener](src/components/FirebaseErrorListener.tsx). Follow that pattern in new
  mutations rather than swallowing errors.
- Remote images must have their hostname whitelisted in `next.config.ts` `images.remotePatterns`
  (currently: placehold.co, unsplash, picsum, pexels, toppng, pinimg, i.scdn.co, i.ibb.co,
  image2url.com, freepik). Most production assets are hosted on **i.ibb.co** and **image2url.com**.

---

## 10. Running it

```bash
npm install
npm run dev        # next dev --turbopack
npm run build
npm run typecheck  # tsc --noEmit — will report the errors §8 lists, build ignores them
```

`.env` must supply `NEXT_PUBLIC_FIREBASE_*` (6 keys), `NEXT_PUBLIC_GOOGLE_CLIENT_ID`,
`SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`. `GEMINI_API_KEY` is present but unused.

Other files in the repo: `.idx/` is a Firebase Studio / Project IDX workspace definition holding a
stale snapshot of `src/`; `message-in-the-bottle-ui-.../` is a folder of design mockup PNGs;
`docs/blueprint.md` is the original product brief (note that its stated AI-polishing feature and
its "Helvetica Neue Light" typography were both abandoned).
