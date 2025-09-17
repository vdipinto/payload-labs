// app/routes/$.tsx
import type {LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {useLoaderData} from 'react-router';
import {StoryblokComponent, useStoryblokState} from '@storyblok/react';
import {storyblokInit as sbInitJS, apiPlugin} from '@storyblok/js';

export const headers = () => ({
  'Content-Security-Policy':
    "frame-ancestors 'self' https://app.storyblok.com https://*.storyblok.com;",
  'X-Frame-Options': 'ALLOWALL',
});

type LoaderData = {
  story: any | null;
  slug: string;
  version: 'draft' | 'published';
};

export async function loader({request, params, context}: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const slug = (params['*'] ?? '').replace(/^\//, '') || 'home';

  const wantsDraft = url.searchParams.has('_storyblok');
  const previewEnabled =
    String(context.env.STORYBLOK_PREVIEW || '').toLowerCase() === 'true';
  const version: 'draft' | 'published' =
    wantsDraft && previewEnabled ? 'draft' : 'published';

  const token = context.env.NEXT_PUBLIC_STORYBLOK_CONTENT_API_ACCESS_TOKEN;
  if (!token) throw new Response('Missing Storyblok token', {status: 500});

  const {storyblokApi} = sbInitJS({accessToken: token, use: [apiPlugin]});

  const {data} = await storyblokApi!.get(`cdn/stories/${slug}`, {
    version,
    resolve_links: 'url',
    ...(version === 'draft' ? {cv: Date.now()} : {}),
  });

  return {story: data.story ?? null, slug, version};
}

export default function CatchAllStoryblokPage() {
  const data = useLoaderData<LoaderData>();
  if (!data?.story) {
    return (
      <pre style={{padding: 16, background: '#fee', color: '#900'}}>
        No Story found for slug: {data?.slug} (version: {data?.version})
      </pre>
    );
  }
  // ✅ Only render child when story exists; hooks live inside child
  return <StoryblokRenderer story={data.story} />;
}

// ⬇️ Hooks are called unconditionally inside this component
function StoryblokRenderer({story}: {story: any}) {
  const state = useStoryblokState(story); // hook always runs when this component renders
  if (!state) return null;
  return <StoryblokComponent blok={state.content} />;
}
