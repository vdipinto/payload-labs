import {storyblokInit, apiPlugin, getStoryblokApi} from '@storyblok/react';
import Page from '~/components/blocks/Page';
import Teaser from '~/components/blocks/Teaser';
import Header from '~/components/blocks/Header';

let initialized = false;

export function initStoryblok() {
  if (initialized) return;
  initialized = true;

  // Only load the visual editor bridge when inside the editor
  const inEditor =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).has('_storyblok');

  // ✅ Static Vite env read (no dynamic import.meta access)
  const token = import.meta.env.VITE_STORYBLOK_TOKEN as string | undefined;
  // Optional region via Vite env (fallback to 'eu')
  const region = (import.meta.env.VITE_STORYBLOK_REGION as 'eu' | 'us') ?? 'eu';

  if (!token) {
    if (typeof window !== 'undefined') {
      console.warn(
        '[Storyblok] Skipping init: VITE_STORYBLOK_TOKEN is missing.',
      );
    }
    return;
  }

  storyblokInit({
    accessToken: token,
    use: [apiPlugin],
    apiOptions: {region},
    bridge: inEditor,
    components: {page: Page, teaser: Teaser, header: Header},
  });

  if (typeof window !== 'undefined') {
    console.debug(
      '[Storyblok] init complete. bridge =',
      inEditor,
      'region =',
      region,
    );
  }
}

export {getStoryblokApi};
