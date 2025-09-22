/**
 * Centralized enums for Storyblok Option fields and other “site-wide” constants.
 * Keep these values in sync with what you configure in the Storyblok UI.
 */

// Header max width
export const MAX_WIDTH = ['container', 'full'] as const;
export type MaxWidth = (typeof MAX_WIDTH)[number];

// Right action options (header)
export const RIGHT_ACTION = ['search', 'locale', 'bag', 'custom_link'] as const;
export type RightActionType = (typeof RIGHT_ACTION)[number];

// Currencies (for your simple toggle)
export const CURRENCIES = ['GBP', 'EUR'] as const;
export type Currency = (typeof CURRENCIES)[number];

// (Optional) locales if you add them later
export const LOCALES = ['en', 'it'] as const;
export type LocaleCode = (typeof LOCALES)[number];

/** Small type guards (optional, handy at runtime) */
export function isRightActionType(v: unknown): v is RightActionType {
  return (
    typeof v === 'string' && (RIGHT_ACTION as readonly string[]).includes(v)
  );
}
export function isMaxWidth(v: unknown): v is MaxWidth {
  return typeof v === 'string' && (MAX_WIDTH as readonly string[]).includes(v);
}
