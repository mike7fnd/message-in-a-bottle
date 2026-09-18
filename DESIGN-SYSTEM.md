# Design System — Message in a Bottle

A reusable UI/UX design language built on Next.js 15, Tailwind CSS v3, shadcn/ui, and Radix UI primitives. The aesthetic is **soft, minimal, and organic** — rounded everything, no harsh borders, subtle shadows, clean typography.

---

## Stack

| Layer | Tool |
|---|---|
| Framework | Next.js 15 (App Router) |
| Styling | Tailwind CSS v3 |
| Components | shadcn/ui + Radix UI |
| Fonts | `next/font/google` (self-hosted) |
| Animations | GSAP, tailwindcss-animate, CSS |
| Icons | Lucide React |
| Theme | next-themes (light/dark) |

---

## Color System

All colors are defined as HSL CSS variables and consumed via Tailwind semantic tokens. Never use raw hex — always use the token names.

### Light Mode

```css
:root {
  --background:         0 0% 100%;      /* pure white */
  --foreground:         0 0% 3.9%;      /* near black */
  --card:               0 0% 100%;      /* same as background */
  --card-foreground:    0 0% 3.9%;
  --popover:            0 0% 100%;
  --popover-foreground: 0 0% 3.9%;
  --primary:            0 0% 9%;        /* dark charcoal */
  --primary-foreground: 0 0% 98%;       /* near white */
  --secondary:          0 0% 96.1%;     /* light grey */
  --secondary-foreground: 0 0% 9%;
  --muted:              0 0% 96.1%;     /* same as secondary */
  --muted-foreground:   0 0% 45.1%;     /* mid grey for labels */
  --accent:             0 0% 96.1%;
  --accent-foreground:  0 0% 9%;
  --destructive:        0 84.2% 60.2%;  /* red */
  --destructive-foreground: 0 0% 98%;
  --border:             0 0% 89.8%;     /* very light grey */
  --input:              0 0% 89.8%;
  --ring:               0 0% 3.9%;
  --radius:             0.5rem;
}
```

### Dark Mode

```css
.dark {
  --background:         0 0% 0%;        /* pure black */
  --foreground:         0 0% 98%;
  --card:               0 0% 5%;        /* very dark grey */
  --card-foreground:    0 0% 98%;
  --primary:            0 0% 98%;       /* near white (inverted) */
  --primary-foreground: 0 0% 9%;
  --secondary:          0 0% 14.9%;
  --muted:              0 0% 14.9%;
  --muted-foreground:   0 0% 63.9%;
  --border:             0 0% 20%;
  --input:              0 0% 20%;
  --ring:               0 0% 83.1%;
}
```

### Tailwind token usage

```tsx
// Backgrounds
bg-background       // page background
bg-card             // card/panel surfaces
bg-muted            // subtle fill (chips, inputs, secondary buttons)

// Text
text-foreground     // primary body text
text-muted-foreground  // secondary/label text
text-primary        // brand accent (same as foreground in this scheme)

// Borders
border-border       // default border color
border-input        // form input borders
```

---

## Typography

Three font families, all self-hosted via `next/font/google`, injected as CSS variables on `<html>`.

```ts
// next/font setup
const manrope = Manrope({
  subsets: ['latin'],
  weight: ['300', '400', '700'],
  variable: '--font-manrope',
  display: 'swap',
});

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
  display: 'swap',
});

const abrilFatface = Abril_Fatface({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-abril',
  display: 'swap',
});
```

### Tailwind font classes

```tsx
font-body       // Manrope — default body text, UI labels, buttons
font-headline   // Manrope — headings (same family, weight differentiated)
font-playfair   // Playfair Display — editorial, italic quotes, recipient names
font-abril      // Abril Fatface — display numbers, hero counters
```

### Usage patterns

```tsx
// Page heading
<h1 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl">

// Display / hero stat
<h2 className="font-abril text-7xl md:text-8xl tracking-tighter text-primary">

// Editorial / message content
<blockquote className="font-playfair italic text-foreground">

// Recipient name inline
<span className="font-playfair italic">{name}</span>

// Body / default — no class needed, font-body is set on <body>
<p className="text-muted-foreground text-sm">
```

---

## Border Radius

The design uses **aggressively rounded** corners. The base `--radius` is `0.5rem` but most elements use custom named values.

```ts
// tailwind.config.ts additions
borderRadius: {
  '30px': '30px',   // cards, buttons, inputs — primary radius
  '25px': '25px',   // modals, sheets
  '20px': '20px',   // secondary containers
  '15px': '15px',   // smaller chips, tags
  lg:  'var(--radius)',              // 0.5rem
  md:  'calc(var(--radius) - 2px)', // 0.375rem
  sm:  'calc(var(--radius) - 4px)', // 0.25rem
}
```

Rule of thumb: use `rounded-30px` for everything interactive (buttons, cards, inputs). Use smaller values only for nested elements within those containers.

---

## Shadow

One named shadow used consistently. No drop shadows on borders — the shadow replaces the border to create depth.

```ts
boxShadow: {
  subtle: '0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
}
```

```tsx
// Usage
<div className="shadow-subtle">   // cards, elevated panels
```

**Cards have no border** — the `shadow-subtle` provides the visual separation. `border border-border` is used only on form inputs and functional outlines.

---

## Components

### Button

All buttons use `rounded-30px`. Variants:

```tsx
// Primary — dark fill
<Button>Send Message</Button>

// Secondary / grey — no border, flat muted fill
<Button variant="outline">Cancel</Button>
// Note: "outline" here is actually bg-muted, not a real border

// Ghost — no background, hover only
<Button variant="ghost" size="icon"><Icon /></Button>

// Link — inline text style
<Button variant="link">Forgot Password?</Button>

// Destructive
<Button variant="destructive">Delete</Button>
```

Base classes on all buttons:
- `rounded-30px` — pill-like shape
- `active:scale-95` — tactile press feedback
- `transition-all duration-200 ease-in-out`
- `text-sm font-medium`

Sizes: `default` (h-10), `sm` (h-9), `lg` (h-11), `icon` (h-10 w-10)

---

### Card

No border. Rounded. Subtle shadow. Matches page background in light mode.

```tsx
<Card>                          // rounded-30px bg-card shadow-subtle
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Subtitle</CardDescription>
  </CardHeader>
  <CardContent>
    {/* content */}
  </CardContent>
  <CardFooter>
    {/* actions */}
  </CardFooter>
</Card>
```

---

### Input

Full-width pill shape. Border on focus only (ring, not persistent border).

```tsx
<Input
  type="text"
  placeholder="Search..."
  className="pl-10"   // add left padding when there's an icon
/>
```

Base: `rounded-30px border border-input bg-background h-10 px-3 focus-visible:ring-2`

For search inputs, add a positioned icon:
```tsx
<div className="relative">
  <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
  <Input className="pl-10" placeholder="Search..." />
</div>
```

---

## Layout Patterns

### App Shell (Desktop)

```
┌─────┬──────────────────────────────────┐
│ 64px│                                  │
│side │   main content (overflow-y-auto) │
│ bar │                                  │
│     │   [footer inside scroll area]    │
└─────┴──────────────────────────────────┘
```

- Outer: `flex h-screen w-full overflow-hidden`
- Sidebar: `sticky top-0 h-screen w-16` (icon-only)
- Main: `flex-1 overflow-y-auto flex flex-col`
- Footer: last child inside main, `shrink-0`

This prevents double scrollbars — the footer lives inside the scrollable column, not outside the `h-screen` container.

### App Shell (Mobile)

```
┌─────────────────────┐
│  Header (h-8+py-3)  │
├─────────────────────┤
│                     │
│  Page content       │
│                     │
│  [padded for nav]   │
├─────────────────────┤
│  Bottom Nav (h-16)  │
│  + safe area inset  │
└─────────────────────┘
```

- Main: `flex-1 flex` with `paddingBottom: calc(4rem + max(env(safe-area-inset-bottom), 12px))`
- Bottom nav: `fixed bottom-0 left-0 right-0` with `paddingBottom: max(env(safe-area-inset-bottom), 12px)` for PWA safe area support

### Page content width

```tsx
<div className="container mx-auto max-w-2xl px-4 py-8 md:py-16">
```

Max content width: `672px` (`max-w-2xl`). Centered. Comfortable reading width for content-heavy pages.

---

## Navigation

### Desktop Sidebar

Icon-only vertical sidebar. `w-16`, sticky. Active state: `bg-muted text-primary` with `fill-current` on the icon.

```tsx
// Active icon — filled style
<item.icon className={cn("h-6 w-6", isActive && "fill-current")} />
```

### Mobile Bottom Nav

Standard fixed bottom bar. No floating pill. No labels.

```tsx
// Active: thicker stroke, primary color
// Inactive: thin stroke, muted color
<item.icon className={cn(
  'h-7 w-7 transition-all',
  isActive ? '[stroke-width:1.75]' : '[stroke-width:1.25]',
)} />
```

Active routes use `text-primary`. Inactive use `text-muted-foreground`.

---

## Animations

### GSAP — used for navigation indicator and sending animation

```ts
// Elastic spring for pill/indicator movement
gsap.to(element, {
  duration: 0.8,
  ease: 'elastic.out(1, 0.75)',
});

// Fluid hover/bounce for illustrations
gsap.to(element, {
  y: '+=40',
  rotation: '+=10',
  duration: 3,
  repeat: -1,
  yoyo: true,
  ease: 'sine.inOut',
});
```

### Tailwind keyframe animations

```tsx
// Page entry — used on cards and list items
className="animate-in fade-in-0 slide-in-from-bottom-5 duration-500 fill-mode-both"

// Staggered list items
style={{ animationDelay: `${index * 150}ms` }}

// Bottle rock animation (custom keyframe)
animation: 'bottle-sent 1s ease-in-out'
// 0%→25%: scale(1.1) rotate(5deg), 75%: rotate(-5deg), 100%: back to normal

// Sending float loop
animation: 'sending-bottle 4s ease-in-out infinite'
// translateY ±10px + rotate ±5deg, yoyo

// Subtle pulse for loading states
animation: 'fade-in-out 1.5s ease-in-out infinite'
// opacity 0.7 → 1 → 0.7
```

### Hover interactions

```tsx
// Scale + rotate on hover (bottle cards in browse)
className="transform transition-transform duration-200 group-hover:scale-110 group-hover:rotate-6"

// Scale only (sent message bottles in profile)
className="transform transition-transform duration-200 group-hover:scale-110"

// Swap image on hover (bottle glow effect)
// Default image: opacity-100, hover image: opacity-0 → opacity-100
className="opacity-0 transition-opacity duration-300 group-hover:opacity-100"
```

---

## Special UI Patterns

### Lined Paper Texture

Used for drawing/sketch surfaces.

```css
.lined-paper {
  background-color: hsl(30 50% 98%);
  background-image: repeating-linear-gradient(
    to bottom,
    hsl(30 50% 98%),
    hsl(30 50% 98%) 23px,
    #e0e0e0 24px
  );
  background-size: 100% 24px;
  line-height: 24px;
}
```

### Fade gradient overlay (truncated content)

Used to hint at more content below a card.

```tsx
<div className="absolute bottom-0 right-6 left-6 h-16 bg-gradient-to-t from-card to-transparent pointer-events-none" />
```

### Frosted glass / backdrop blur (overlays, modals)

```tsx
// Bottom nav
className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"

// Loading overlays
className="bg-background/95 backdrop-blur-sm"
```

### Skeleton loading pattern

```tsx
// Always use Skeleton from shadcn/ui, never custom shimmer
<Skeleton className="h-4 w-full" />
<Skeleton className="h-6 w-48" />
<Skeleton className="h-40 w-40 rounded-full" />  // circular avatar/image
```

### Ripple effect

```css
.ripple {
  position: absolute;
  border-radius: 50%;
  background: hsla(var(--primary), 0.2);
  transform: scale(0);
  animation: ripple-effect 600ms linear;
  pointer-events: none;
}
@keyframes ripple-effect {
  to { transform: scale(4); opacity: 0; }
}
```

---

## Dark Mode Implementation

- Uses `next-themes` with `attribute="class"`
- Default: `light`, system detection enabled
- Toggle is triggered by theme switch in Settings, or double-click gesture on home page
- All colors defined as CSS variables — dark mode swaps automatically via `.dark` class on `<html>`
- Images swap manually: `resolvedTheme === 'dark' ? darkImage : lightImage`
- Font colors invert automatically through the semantic token system

```tsx
// Theme toggle pattern
const { theme, setTheme } = useTheme();
setTheme(theme === 'dark' ? 'light' : 'dark');

// Image swap pattern
const heroImage = resolvedTheme === 'dark' ? content.homeHeroImageDark : content.homeHeroImageLight;
```

---

## Responsive Breakpoints

Standard Tailwind. The app has two distinct layouts:

| Breakpoint | Layout |
|---|---|
| `< md` (< 768px) | Mobile: header + bottom nav, full-width content |
| `≥ md` (≥ 768px) | Desktop: icon sidebar, scrollable main column |

Detection:

```tsx
// hooks/use-mobile.ts
const isMobile = useIsMobile(); // returns boolean, SSR-safe
```

---

## Page Structure Template

```tsx
export default function SomePage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <main className="flex-1">
        <div className="container mx-auto max-w-2xl px-4 py-8 md:py-16">

          {/* Back button */}
          <div className="mb-4">
            <Button variant="link" onClick={() => router.back()} className="pl-0 text-muted-foreground">
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
          </div>

          {/* Page heading */}
          <h1 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl">
            Page Title
          </h1>

          {/* Content */}
          <div className="mt-8 space-y-8">
            <Card>
              <CardContent className="p-6">
                {/* ... */}
              </CardContent>
            </Card>
          </div>

        </div>
      </main>
    </div>
  );
}
```

---

## Guiding Principles

1. **No visible borders on surfaces** — cards and containers use shadow instead of border for separation
2. **Everything rounded** — `rounded-30px` is the default for all interactive elements
3. **Borders only on inputs** — form fields keep `border-input` for clarity
4. **Shadows are subtle** — one named shadow (`shadow-subtle`) used consistently, never multiple layers
5. **Typography contrast** — `text-foreground` for primary content, `text-muted-foreground` for supporting text. Never invent custom grey values
6. **Monochromatic palette** — primary color is near-black (light) / near-white (dark). No brand color beyond that. Accent is the same grey scale
7. **Motion is purposeful** — animations communicate state changes (sending, loading, active tab). Never purely decorative loops on UI chrome
8. **Mobile-first layout thinking** — design the mobile bottom nav + header pattern first, then adapt for desktop sidebar
9. **Safe area awareness** — always use `env(safe-area-inset-bottom)` with a `max()` fallback for PWA bottom nav
10. **Semantic tokens always** — never hardcode `#ffffff` or `rgba(0,0,0,0.5)`. Use `bg-background`, `text-muted-foreground` etc.
