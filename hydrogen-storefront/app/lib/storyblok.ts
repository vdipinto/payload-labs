// app/lib/storyblok.ts
import {storyblokInit, apiPlugin, getStoryblokApi} from '@storyblok/react';

// Import blocks
import Page from '~/components/blocks/Page';
import Teaser from '~/components/blocks/Teaser';

declare global {
  interface Window {
    ENV?: {
      NEXT_PUBLIC_STORYBLOK_CONTENT_API_ACCESS_TOKEN?: string;
    };
  }
}

export function initStoryblok() {
  const token =
    // On the server
    process.env.NEXT_PUBLIC_STORYBLOK_CONTENT_API_ACCESS_TOKEN ||
    // On the client (injected in root.tsx -> window.ENV)
    (typeof window !== 'undefined'
      ? window.ENV?.NEXT_PUBLIC_STORYBLOK_CONTENT_API_ACCESS_TOKEN
      : '');

  storyblokInit({
    accessToken: token,
    use: [apiPlugin],
    apiOptions: {region: 'eu'},
    components: {
      page: Page,
      teaser: Teaser, // only register the teaser blok
    },
  });
}

export {getStoryblokApi};
