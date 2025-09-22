// app/types/oxygen-env.d.ts
import '@shopify/remix-oxygen';

declare module '@shopify/remix-oxygen' {
  interface Env {
    VITE_STORYBLOK_TOKEN?: string;
    STORYBLOK_API_REGION?: 'eu' | 'us';
    STORYBLOK_PREVIEW?: 'true' | 'false' | '1' | '0';
    STORYBLOK_HEADER_SLUG?: string;
  }
}
