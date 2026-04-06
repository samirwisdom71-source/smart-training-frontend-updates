/**
 * Production configuration. Used when building with --configuration=production.
 */
export const appConfig = {
  apiUrl: 'https://smart-training-management.gate-digital.com',
  supportedLocales: ['en', 'ar'],
  defaultLocale: 'en',
} as const;
