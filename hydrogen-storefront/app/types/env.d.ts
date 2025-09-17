export {};

declare global {
  interface Env {
    NEXT_PUBLIC_STORYBLOK_CONTENT_API_ACCESS_TOKEN: string;
    STORYBLOK_API_REGION: string;
    STORYBLOK_PREVIEW: string;
  }
}
