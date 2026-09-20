import { fonts, fontSize } from '../theme/tokens';

/**
 * How a letter's body is set, everywhere it appears.
 *
 * One treatment, no variation. Two earlier versions of this file did vary it —
 * first by message length, then by a per-letter paper tint — and both were
 * wrong for the same reason: they made the app look like it was ranking
 * letters, with a two-word note shouting over a carefully written paragraph.
 * Every letter here is somebody's, and they all get the same voice and the
 * same white page.
 *
 * Playfair italic at body size is the app's letter voice — the share card and
 * the web's message view use it too, so a letter reads identically wherever it
 * turns up. The generous line height is for the italic face, which needs more
 * air than the body font at the same size.
 */
export const LETTER_TYPE = {
  fontFamily: fonts.playfairItalic,
  fontSize: fontSize.base,
  lineHeight: 26,
  italic: true,
} as const;
