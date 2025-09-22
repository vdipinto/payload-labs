// app/types/env.d.ts
export {};

declare module '@shopify/remix-oxygen' {
  interface Env {
    /**
     * Storyblok
     */
    VITE_STORYBLOK_TOKEN?: string; // Preview or Public token
    STORYBLOK_API_REGION?: 'eu' | 'us'; // Region of your space
    STORYBLOK_PREVIEW?: 'true' | 'false' | '1' | '0'; // draft vs published
    STORYBLOK_HEADER_SLUG?: string; // Optional override (default "global")

    /**
     * (other existing vars you already have can live here too)
     * PUBLIC_STORE_DOMAIN?: string;
     * PUBLIC_STOREFRONT_API_TOKEN?: string;
     * etc.
     */
  }
}
