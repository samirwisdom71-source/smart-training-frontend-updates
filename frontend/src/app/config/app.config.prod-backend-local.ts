/**
 * Local dev configuration that proxies to the production backend.
 *
 * Use with `ng serve --proxy-config proxy.prod-backend.json`.
 */
export const appConfig = {
  /**
   * Keep API calls same-origin (localhost) so the dev-server proxy can forward
   * them to production without triggering browser CORS.
   */
  apiUrl: typeof window !== 'undefined' ? window.location.origin : '',
  supportedLocales: ['en', 'ar'],
  defaultLocale: 'en',
} as const;

