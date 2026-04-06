/**
 * Application configuration. Replace with environment files (environment.ts / environment.prod.ts)
 * when wiring the API client and build configurations.
 */
export const appConfig = {
  /** Base URL for the Smart Training API. */
  apiUrl: 'http://localhost:5076',
  /** Supported locales. */
  supportedLocales: ['en', 'ar'],
  defaultLocale: 'en',
} as const;
