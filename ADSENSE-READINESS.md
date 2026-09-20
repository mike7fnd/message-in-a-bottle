# AdSense Readiness — Audit & Implementation Report

Site: `https://messageinabottle.sbs` · Audited and updated 19 September 2026

Google alone decides approval. This report states what was changed, what was
verified and how, what only you can do, and what still carries risk. Nothing
below is marked done unless it was actually checked.

---

## The headline finding

**Your home page was serving Google a blank page.**

`/` rendered nothing but a loading skeleton in its server HTML — zero `<h1>`,
zero `<h2>`, no body text — because the whole page was held behind a `mounted`
flag while the colour theme resolved. Verified against production before any
changes:

```
$ curl -A Googlebot https://messageinabottle.sbs/ | grep -o '<h[12][^>]*>'
(no output)
```

Worse, the current `main` branch added a crash on top of it:
`home-client.tsx` referenced `homeMediaSectionVisible`, a variable never
declared or imported in that file. `next.config.ts` sets
`typescript.ignoreBuildErrors: true`, so it compiled fine and would have thrown
a `ReferenceError` at render on the next deploy. The live site is running an
older commit, which is the only reason it isn't broken right now.

For a site whose own content is written by anonymous strangers, an entry page
with no readable text is close to a guaranteed rejection. Both are fixed; `/`
now serves its full content as HTML.

---

## A. Completed and verified

### Crawlability and rendering

| Change | How it was verified |
|---|---|
| `/` renders full content server-side | `curl` on a local production build: `h1=1`, 3 × `h2`, `animate-pulse` count `0` (was 2, with no headings) |
| Theme artwork swapped in CSS (`dark:` variant) instead of JS, removing the render gate | Same as above; no hydration warning in build |
| `homeMediaSectionVisible` crash fixed — now wired to the real `useFeatures()` hook | Production build succeeds; flag drives the section |
| `/bottle/[name]` renders its heading and recipient name server-side | `curl /bottle/mike` → `<h1>letter's for <span>mike</span></h1>` (was a skeleton) |
| Every public route returns HTTP 200; 404s return a real 404 | Route sweep below |

### Essential pages

- **`/contact` created** — previously a 404. Server-rendered, with the real
  address, what to write about, and a working form.
- **`/privacy` rewritten** from scratch to describe what the code actually does:
  anonymous Firebase sign-in, the exact browser-storage keys, the ip-api geo
  lookup, Vercel Analytics, AdSense, Spotify, retention, and rights under GDPR
  and the Philippine Data Privacy Act. Includes Google's required
  personalised-advertising and third-party-vendor disclosures with links to
  Google Ads Settings and aboutads.info.
- **`/terms` rewritten** to match reality — including that nothing is delivered
  to anyone, that anonymous senders cannot delete their own messages, and how
  removal actually works.
- **`/about`** now opens with server-rendered text explaining what the site is,
  how bottles work, and who runs it. The existing support/reviews section is
  untouched below it.
- Privacy and Terms are no longer trapped in a 32rem scrolling box, and both are
  now static HTML (`/terms` ships **166 B** of JS, down from a full client
  bundle).

### Footer and navigation

A real `SiteFooter` now renders on **mobile and desktop** with Home, Browse,
Send, About, Contact, Privacy, Terms and Cookie settings. Previously mobile had
no footer at all and desktop had only a copyright line — the legal pages were
reachable only by digging through the Profile menu.

### Privacy and consent

- `ConsentProvider` with a three-category model (necessary / analytics /
  advertising). Accept and Reject are the same size and variant — no dark
  pattern.
- **Google Consent Mode v2** defaults are pushed to `denied` before any Google
  tag can load, then updated on choice.
- **Nothing non-essential loads before consent.** Verified on a production
  build: `grep -c pagead2.googlesyndication.com` on `/` returns **0** before
  consent. Vercel Analytics and the geo visit ping are gated the same way.
- The AdSense **ownership meta tag is still always present** server-side, so
  consent gating cannot break your site verification. Verified.
- ~~**Spotify embeds are now click-to-load.**~~ **Reverted at the owner's
  request.** The player again loads with the message, so Spotify receives the
  reader's IP and may set its own cookies on any message that has a song
  attached, whether or not the reader presses play. This is a deliberate
  product decision, not an oversight; `/privacy` states it plainly under
  "Third parties". `loading="lazy"` still defers the request until the player
  is near the viewport. If you re-gate it, that privacy paragraph must change
  back with it.
- The geo API key was **hardcoded in source** (`F3hV8B0sD6pE1kS` in
  `track-visit/route.ts`); it now comes from `IPAPI_KEY`, and geo analytics
  switch off entirely when unset.

### Content policy violations removed

You confirmed these were not real numbers:

- `100,000+ Users and Messages` on the home page → replaced with honest copy.
- `Over 100,000 messages sent` in the site metadata → replaced.
- `Over 100,000 messages` and the `100K+ Messages Sent` tile on About → replaced.
- **A hardcoded `aggregateRating` of 4.8 from 100 ratings in the home page
  JSON-LD** → deleted. Fabricated review markup is both a structured-data
  violation and an AdSense content violation, and was the most serious of the
  four.

### User-generated content safety

The site publishes unmoderated writing from anonymous strangers, which is the
category Google scrutinises hardest. Added:

- A **Report control on every message**, covering harassment, private
  information, sexual content involving minors, hate speech, spam and "this is
  about me". Reports land in the Firestore `feedback` collection you already
  read at `/admin/feedback`.
- Removal and reporting routes documented in Terms, About and Contact, and
  reachable without an account.
- React escapes all message content and there is no `dangerouslySetInnerHTML`
  on user data, so stored XSS is not a live risk.

### SEO

- `robots.txt` and `ads.txt` moved to route handlers driven by the same config,
  so the publisher ID can't drift. `ads.txt` verified byte-identical to what is
  live, `200`, `text/plain; charset=utf-8`.
- **Root-layout `canonical: '/'` removed.** It cascaded to every page that
  didn't override it, so `/donate`, `/auth`, `/profile`, `/history` and
  `/settings` were all telling Google they were duplicates of the homepage.
  Every page now declares its own canonical — verified across 14 routes.
- `noindex` added to `/auth`, `/profile`, `/history`, `/settings`, all of
  `/admin/*`, and `/message/[id]`.
- Missing `<h1>` added to `/`, `/send` and `/donate`.
- `/bottle/[name]` gained per-page titles and descriptions; every bottle
  previously shared the sitewide one.
- Sitemap: `/auth` removed, `/contact` and `/donate` added.

### Security

`X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`,
`X-Frame-Options` and a strengthened `Strict-Transport-Security` now ship on
every response — verified in the response headers. Production previously sent
**only** HSTS.

A `www` → apex 308 redirect was added: both hosts were answering `200`, so every
page existed at two URLs.

### Ad architecture

`AdUnit` / `AdBanner` / `AdInArticle` / `AdInFeed` in `src/components/ads/`.
They render **nothing at all** — no container, no placeholder — unless a
publisher ID and slot ID are configured and consent is given. Each pushes to
`adsbygoogle` exactly once per mount: no timers, no refresh, no manufactured
impressions. Units carry a visible "Advertisement" label and are placed after
content, never between browse items or beside navigation, so no click can be
mistaken for a site control. Placed on `/browse` (after the feed),
`/message/[id]` (below an unlocked message) and `/about` (footer).

### Bugs found and fixed along the way

- `data.ts` read `data.lastMessageTimestamp` from a map that only ever stored
  `latestTimestamp`, so every recipient came back with an undefined timestamp
  and **the browse page was never actually sorted by recency** — the comparator
  was comparing 0 to 0.
- `RecipientContext` imported `invalidateNamespace` from a module that doesn't
  export it (it lives in `./cache`), resolving to `undefined`.
- Duplicate `viewport` meta tag removed from `<head>` (Next already emits it).
- `ThemeProvider` imported types from `next-themes/dist/types`, a path that no
  longer resolves in v0.4.

---

## B. Owner action required

Only you can do these.

1. **Rotate the leaked secrets, then scrub git history.** `.env` is tracked by
   git despite being in `.gitignore` — it was committed before being ignored.
   `SPOTIFY_CLIENT_SECRET`, `GEMINI_API_KEY` and the geo key are in the history
   in at least `4682070`, `020c13f` and `39e42b8`. **Deleting the file now does
   not remove it from past commits.** Rotate each key at its provider first,
   move the values into Vercel environment variables, then rewrite history with
   `git filter-repo` or BFG. I have not run any of this — it rewrites your
   history and needs your judgement.
2. **Enable Google's certified CMP.** AdSense → Privacy & messaging → GDPR.
   Google requires a Google-certified, IAB TCF-integrated CMP to serve
   personalised ads in the EEA, UK and Switzerland. The consent manager I built
   is a first-party control: it correctly denies by default and reports through
   Consent Mode v2, but **it is not TCF-certified and does not emit a TC
   string**, so it does not by itself satisfy that requirement. Turning
   Google's message on is the fix and needs no code.
3. **Create the ad units and set the slot IDs.** AdSense → Ads → By ad unit,
   then set `NEXT_PUBLIC_ADSENSE_SLOT_BROWSE_FEED`,
   `NEXT_PUBLIC_ADSENSE_SLOT_MESSAGE_BELOW` and
   `NEXT_PUBLIC_ADSENSE_SLOT_ABOUT_FOOTER` in Vercel. Until then the ad
   components render nothing, which is intended.
4. **Set `IPAPI_KEY` in Vercel** or leave it unset to keep geo analytics off.
   Without it, visit tracking silently stops — the value is in your local `.env`.
5. **Decide the www redirect's home.** I added it in `next.config.ts`; doing it
   at Vercel → Domains is marginally faster. Don't do both.
6. **Submit for review**, and afterwards confirm in Search Console that
   `/message/*` is being dropped from the index as intended.

---

## C. Could not be verified from here

- **Real browser rendering.** No browser was available in this environment. All
  route checks were `curl` against a local production build, which tests server
  HTML, status codes, headers and metadata — not paint, layout or JS console
  errors. **Please click through the site once before submitting**, in
  particular the consent banner, the contact form and the report dialog.
- **Mobile responsiveness at the listed breakpoints.** Not measured. The layout
  is Tailwind-responsive and unchanged except for the new footer and consent
  banner, both of which are built mobile-first with safe-area padding, but I
  did not put a device emulator on them.
- **Live production behaviour.** Everything above was verified locally; the
  changes are not deployed. The production checks in this report describe the
  site *before* the changes.
- **Whether your content is "original and useful enough"** — that is Google's
  judgement, not something a check can answer.
- Anything inside your AdSense, Search Console or Vercel accounts.

---

## D. Remaining risks

1. ~~The home page advertises features that no longer exist.~~ **Resolved.** The
   "with songs, photos, and sketch" heading, the "over a 100M songs from
   Spotify available" line and the accompanying image were removed at your
   request, along with the same claim in the page description, the Open Graph
   and Twitter cards, and the JSON-LD — those feed the snippet Google shows in
   search results, so leaving them would have kept the claim alive where it
   matters most. The send page subtitle also said messages would be
   "delivered anonymously"; it now says nothing is sent to the person you name,
   which matches the Terms. Verified: `songs, photos`, `100M songs` and
   `100,000` all return 0 occurrences on the rendered home page.

   Update: the **song picker has since been restored** to
   `SendMessageForm.tsx`, gated behind the `spotifyEnabled` admin toggle, and
   `sendAddSongButton` / `sendMusicTitle` / `sendMusicPlaceholder` /
   `sendFeaturedSongs` are rendered again. Photo and sketch remain absent —
   `photo` is still passed as `undefined` — so `sendAttachPhotoButton` and
   `sendDrawButton` are still unused copy in `site-content.json`.

   Also fixed while restoring it: `/api/spotify/featured` called
   `GET /v1/tracks?ids=…`, which answers **403 Forbidden** for this Spotify
   app while `GET /v1/tracks/{id}` and `/v1/search` both answer 200 with the
   same token — verified directly against the API. It now fetches each track
   individually. Separately, both routes called `response.json()` on bodies
   that were not always JSON, which replaced real upstream errors with
   `Unexpected token …`; they now read the body as text first and report the
   actual status.
2. **Site content is thin and user-generated by nature.** Short anonymous notes
   are exactly what reviewers treat as low-value. `/about`, `/contact`,
   `/privacy` and `/terms` now carry substantial original text, which helps, but
   this remains the core judgement call on approval.
3. **Browse shows only the last 100 messages.** `getRecipientsByFallback` pulls
   100 messages and groups them client-side, so displayed message counts are
   counts-within-that-window, not totals.
4. **Ads load only after consent.** Correct for the EEA, but a reviewer who
   rejects consent sees no ad code. Your ownership meta tag is always present so
   verification is unaffected. If you want ads on by default outside the EEA,
   that needs geo-detection — say the word.
5. **No Content-Security-Policy.** Deliberate: AdSense pulls scripts, frames and
   images from a broad, changing set of Google origins, and a CSP written by
   guesswork would silently break ad serving. Roll one out in
   `Content-Security-Policy-Report-Only` first.
6. **Rate limiting is localStorage-only**, both for sending and for the new
   contact/report forms. A private window defeats it. Real protection needs
   server-side enforcement or App Check.
7. **Two divergent copies of `firestore.rules`** still exist (root vs `src/`).
   The deployed root copy's `update` rule does not restrict which fields a
   sender may change. Out of scope here, worth fixing.
8. **8 pre-existing TypeScript errors remain** (down from 11), all type-only, in
   `next.config.ts`, shadcn UI components and a legacy unused `data.ts` helper.
   None affect runtime. `ignoreBuildErrors: true` is still on — I left it, since
   turning it off would block your deploys until all 8 are cleared.

---

## E. Route audit

Verified against a local production build (`next build && next start`).

| Route | Status | h1 | Canonical | Robots |
|---|---|---|---|---|
| `/` | 200 | ✓ | `/` | index, follow |
| `/send` | 200 | ✓ *(added)* | `/send` | index, follow |
| `/browse` | 200 | ✓ | `/browse` | index, follow |
| `/bottle/[name]` | 200 | ✓ *(fixed)* | per-name | index, follow |
| `/about` | 200 | ✓ | `/about` | index, follow |
| `/contact` | 200 | ✓ | `/contact` | index, follow |
| `/privacy` | 200 | ✓ | `/privacy` | index, follow |
| `/terms` | 200 | ✓ | `/terms` | index, follow |
| `/donate` | 200 | ✓ *(added)* | `/donate` *(was `/`)* | index, follow |
| `/message/[id]` | 200 | — | per-id | **noindex**, follow |
| `/auth` | 200 | — | `/auth` *(was `/`)* | **noindex, nofollow** |
| `/profile` | 200 | — | `/profile` *(was `/`)* | **noindex, nofollow** |
| `/history` | 200 | — | `/history` *(was `/`)* | **noindex, nofollow** |
| `/settings` | 200 | — | `/settings` *(was `/`)* | **noindex, nofollow** |
| `/admin/*` | 200 | — | — | **noindex, nofollow** |
| `/robots.txt` | 200 | — | — | `text/plain` |
| `/ads.txt` | 200 | — | — | `text/plain` |
| `/sitemap.xml` | 200 | — | — | 8 public URLs |
| unknown path | **404** | ✓ | — | — |

`/message/[id]` has no `h1` by design — it is `noindex`, and its content is one
short note inside a card.

---

## F. Build and test results

```
npm run build      ✓ compiled, 25/25 static pages generated, exit 0
npx tsc --noEmit   8 errors, all pre-existing and type-only (was 11)
npm test           no test suite exists in this project
npm run lint       not run — next.config.ts sets ignoreDuringBuilds
```

No test suite exists, so none was run. Nothing in this report is backed by
automated tests; it is backed by the build, the typecheck, and the `curl`
sweeps quoted above.

---

## Configuration reference

`src/lib/site-config.ts` centralises the site name, canonical URL, operator,
contact address, AdSense IDs and ad slots. `.env.example` documents every
variable. `NEXT_PUBLIC_ADSENSE_CLIENT_ID` defaults to your existing published
publisher ID so an unset variable can't silently drop your verification; set it
to `none` on preview deployments to omit all ad code.
