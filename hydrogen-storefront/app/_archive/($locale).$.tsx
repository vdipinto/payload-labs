// app/routes/($locale).$.tsx
import type {LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {useLoaderData} from 'react-router';
import {StoryblokComponent, useStoryblokState} from '@storyblok/react';
import {storyblokInit as sbInitJS, apiPlugin} from '@storyblok/js';

type LoaderData = {
  story: any | null;
  slug: string;
  version: 'draft' | 'published';
};

export async function loader({request, params, context}: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const slug = (params['*'] ?? '').replace(/^\//, '') || 'home';

  // Draft inside Storyblok editor (adds `_storyblok`), published otherwise
  const wantsDraft = url.searchParams.has('_storyblok');
  const previewEnabled =
    String(context.env.STORYBLOK_PREVIEW || '').toLowerCase() === 'true';
  const version: 'draft' | 'published' =
    wantsDraft && previewEnabled ? 'draft' : 'published';

  const token = context.env.NEXT_PUBLIC_STORYBLOK_CONTENT_API_ACCESS_TOKEN;
  if (!token) {
    throw new Response('Missing Storyblok token', {status: 500});
  }

  // Initialize client (no region param; CDN v2 uses api.storyblok.com)
  const {storyblokApi} = sbInitJS({
    accessToken: token,
    use: [apiPlugin],
  });

  // ⬇️ Option 1: non-null assertion to satisfy TS
  const {data} = await storyblokApi!.get(`cdn/stories/${slug}`, {
    version,
    resolve_links: 'url',
    ...(version === 'draft' ? {cv: Date.now()} : {}),
  });

  return {story: data.story ?? null, slug, version};
}

export default function StoryPage() {
  const data = useLoaderData<LoaderData>();
  const story = data?.story;
  if (!story) return <pre>No Story found for slug: {data.slug}</pre>;

  const state = useStoryblokState(story); // enables live updates in editor
  if (!state) return null;

  return <StoryblokComponent blok={state.content} />;
}
