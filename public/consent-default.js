/*
 * Google Consent Mode v2 defaults.
 *
 * This lives as a real file, loaded by a parser-blocking <script src> in
 * <head>, for one specific reason: React hoists every <script src> to the top
 * of <head> and leaves inline scripts where they were written. An inline
 * snippet therefore ends up *after* the AdSense tag no matter what order the
 * JSX is in, and `beforeInteractive` does not change that. Giving this a src
 * makes it hoistable too, so its position relative to the AdSense tag is
 * preserved — and being non-async it executes during parse, before the async
 * AdSense script can run.
 *
 * Everything starts denied. ConsentProvider sends the matching 'update' after
 * the visitor chooses. With ad_storage denied AdSense still serves ads, but
 * non-personalized and without writing advertising cookies.
 */
window.dataLayer = window.dataLayer || [];
function gtag() {
  dataLayer.push(arguments);
}
gtag('consent', 'default', {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
  wait_for_update: 500,
});
