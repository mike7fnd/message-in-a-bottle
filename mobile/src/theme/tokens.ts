/**
 * Design tokens, ported 1:1 from the web app.
 *
 * The web defines these as HSL CSS variables in src/app/globals.css and
 * consumes them through Tailwind. React Native has neither, so each value is
 * converted to hex here — the conversions are exact, not approximations, and
 * the original HSL triplet is kept in a comment so the two can be diffed by
 * eye when the web theme changes.
 *
 * Source of truth remains globals.css. If a colour changes there, change it
 * here in the same commit.
 */

/**
 * Colour.
 *
 * The app is flat — there are no shadows anywhere (see the note where `shadow`
 * used to live). Cards separate from the page by tone alone, which drives two
 * departures from the web palette:
 *
 *   backgroundGrouped  A faint off-white, used *only* on screens built from
 *                      cards, so a white card reads as its own surface. Screens
 *                      with no cards — Home and Browse — stay on `background`
 *                      (pure white); tinting those would just look grubby with
 *                      nothing to lift off it. Same split as iOS's
 *                      systemBackground vs systemGroupedBackground.
 *   muted              A step darker than the web's. It fills shapes both
 *                      *inside* white cards (the link box, the avatar circle)
 *                      and *on* the page (the theme and sign-in switch tracks),
 *                      so it has to stay visible against both.
 *
 * Dark mode has no grouped variant: `card` already lifts off pure black, and a
 * lighter page behind it would only muddy the separation.
 */
export const palette = {
  light: {
    background: '#FFFFFF', // plain screens: Home, Browse
    backgroundGrouped: '#F7F7F9', // card screens only
    foreground: '#0A0A0A', // 0 0% 3.9%
    card: '#FFFFFF', // pure white, lifts off the page
    cardForeground: '#0A0A0A', // 0 0% 3.9%
    popover: '#FFFFFF',
    popoverForeground: '#0A0A0A',
    primary: '#171717', // 0 0% 9%
    primaryForeground: '#FAFAFA', // 0 0% 98%
    secondary: '#E4E4E9',
    secondaryForeground: '#171717', // 0 0% 9%
    muted: '#E4E4E9',
    // Darker than the web's #737373. Secondary text sits on three different
    // surfaces here — card, page background and `muted` — and `muted` is the
    // worst case. Measured: 4.63:1 on muted, 5.11:1 on background, 5.86:1 on
    // card, so it clears AA on all three. #737373 would be 3.6:1 on muted.
    mutedForeground: '#64646C',
    accent: '#E4E4E9',
    accentForeground: '#171717', // 0 0% 9%
    destructive: '#EF4444', // 0 84.2% 60.2%
    destructiveForeground: '#FAFAFA', // 0 0% 98%
    border: '#D7D7DE',
    input: '#D7D7DE',
    ring: '#0A0A0A', // 0 0% 3.9%
  },
  dark: {
    background: '#000000', // 0 0% 0%
    // Pure black on card screens too — see the note above.
    backgroundGrouped: '#000000',
    foreground: '#FAFAFA', // 0 0% 98%
    // Lifted from the web's #0D0D0D: with no shadow, the card needs a little
    // more tone to separate from pure black.
    card: '#141417',
    cardForeground: '#FAFAFA', // 0 0% 98%
    popover: '#141417',
    popoverForeground: '#FAFAFA',
    primary: '#FAFAFA', // 0 0% 98%
    primaryForeground: '#171717', // 0 0% 9%
    secondary: '#26262B',
    secondaryForeground: '#FAFAFA', // 0 0% 98%
    muted: '#26262B',
    mutedForeground: '#A3A3A3', // 0 0% 63.9%
    accent: '#26262B',
    accentForeground: '#FAFAFA', // 0 0% 98%
    destructive: '#7F1D1D', // dark-mode destructive
    destructiveForeground: '#FAFAFA', // 0 0% 98%
    border: '#33333A',
    input: '#33333A',
    ring: '#D4D4D4', // 0 0% 83.1%
  },
} as const;

export type ColorScheme = keyof typeof palette;

/**
 * Widened to `string` on purpose. `palette` is `as const`, so each value has a
 * literal type — which makes the light and dark objects mutually unassignable
 * and `palette[scheme]` unusable. Mapping over the keys keeps the shape (so a
 * token missing from one theme is still a compile error) while letting either
 * theme satisfy it.
 */
export type ThemeColors = { [K in keyof (typeof palette)['light']]: string };

/**
 * Border radii. The web design language is aggressively rounded — `rounded-30px`
 * on anything interactive (see DESIGN-SYSTEM.md).
 */
export const radius = {
  xs: 4, // sm  — calc(--radius - 4px)
  sm: 6, // md  — calc(--radius - 2px)
  md: 8, // lg  — var(--radius), 0.5rem
  chip: 15,
  container: 20,
  sheet: 25,
  /** The default for buttons, cards and inputs. */
  pill: 30,
  full: 9999,
} as const;

/** 4px scale, matching Tailwind's spacing steps as used across the web app. */
export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
} as const;

/*
 * There is deliberately no `shadow` token.
 *
 * The app is flat: cards separate from the page by tone (white on off-white in
 * light mode, #141417 on black in dark), not by elevation. If you are tempted
 * to add a shadow back, change the palette instead — mixing the two gives a
 * card two competing edges, and Android would diverge anyway since `elevation`
 * ignores offset, radius and opacity.
 */

/** Font families, keyed to the @expo-google-fonts names loaded in _layout. */
export const fonts = {
  /** Manrope — body text, UI labels, buttons. */
  body: 'Manrope_400Regular',
  bodyLight: 'Manrope_300Light',
  bodyBold: 'Manrope_700Bold',
  /** Manrope again — headings are the same family, differentiated by weight. */
  headline: 'Manrope_700Bold',
  /** Playfair Display — editorial italics, recipient names, quotes. */
  playfair: 'PlayfairDisplay_400Regular',
  playfairItalic: 'PlayfairDisplay_400Regular_Italic',
  /** Abril Fatface — display numerals and hero statements. */
  abril: 'AbrilFatface_400Regular',
} as const;

/** Type scale mirroring the Tailwind classes the web app actually uses. */
export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
  '7xl': 72,
} as const;

