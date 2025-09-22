// app/routes/$.tsx
import type {LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {useLoaderData} from 'react-router';
import {StoryblokComponent, useStoryblokState} from '@storyblok/react';
import type {SbBlokData} from '@storyblok/react';
import {storyblokInit as sbInitJS, apiPlugin} from '@storyblok/js';
import type {ISbStoryData} from 'storyblok-js-client';

export const headers = () => ({
  'Content-Security-Policy':
    "frame-ancestors 'self' https://app.storyblok.com https://*.storyblok.com;",
  'X-Frame-Options': 'ALLOWALL',
});

type LoaderData = {
  story: ISbStoryData | null;
  slug: string;
  usedSlug: string;
  version: 'draft' | 'published';
  region: 'eu' | 'us';
  tried: string[];
  tokenOk: boolean;
  tokenSrc: 'context' | 'importmeta' | 'process' | 'none';
};

export async function loader({request, params, context}: LoaderFunctionArgs) {
  const url = new URL(request.url);

  // normalize slug
  const raw = (params['*'] ?? '') as string;
  const slug = raw.replace(/^\/+|\/+$/g, '').replace(/\/{2,}/g, '/') || 'home';

  // optional language from editor
  const langParam = (url.searchParams.get('_storyblok_lang') ||
    url.searchParams.get('language') ||
    '')!.toLowerCase();

  console.log(
    `[Route $] path="${url.pathname}" -> baseSlug="${slug}" lang="${langParam || '-'}"`,
  );

  // skip noise
  const isNoise =
    slug.startsWith('.well-known') ||
    slug.startsWith('__manifest') ||
    slug.startsWith('build') ||
    slug.startsWith('assets') ||
    slug === 'favicon.ico' ||
    slug === 'robots.txt' ||
    slug === 'favicon.svg';
  if (isNoise) throw new Response('Not found', {status: 404});

  // version (same as root.tsx behavior)
  const previewFlag = String(
    context.env.STORYBLOK_PREVIEW || import.meta.env.STORYBLOK_PREVIEW || '',
  ).toLowerCase();
  const version: 'draft' | 'published' =
    previewFlag === 'true' || previewFlag === '1' ? 'draft' : 'published';

  // token & region — include import.meta.env fallback
  let tokenSrc: LoaderData['tokenSrc'] = 'none';
  const tokenFromContext = context.env.VITE_STORYBLOK_TOKEN as
    | string
    | undefined;
  const tokenFromImportMeta = import.meta.env.VITE_STORYBLOK_TOKEN as
    | string
    | undefined;
  const tokenFromProcess = process.env.VITE_STORYBLOK_TOKEN as
    | string
    | undefined;

  const envToken =
    (tokenFromContext && ((tokenSrc = 'context'), tokenFromContext)) ||
    (tokenFromImportMeta && ((tokenSrc = 'importmeta'), tokenFromImportMeta)) ||
    (tokenFromProcess && ((tokenSrc = 'process'), tokenFromProcess)) ||
    ((tokenSrc = 'none'), '');

  const region: 'eu' | 'us' =
    (context.env.STORYBLOK_API_REGION as 'eu' | 'us' | undefined) ||
    (import.meta.env.STORYBLOK_API_REGION as 'eu' | 'us' | undefined) ||
    (process.env.STORYBLOK_API_REGION as 'eu' | 'us' | undefined) ||
    'eu';

  const tokenOk = Boolean(envToken);
  console.log(
    `[SB][PAGE] token present=${tokenOk} src=${tokenSrc} len=${envToken ? envToken.length : 0}`,
  );

  if (!tokenOk) {
    return {
      story: null,
      slug,
      usedSlug: slug,
      version,
      region,
      tried: [],
      tokenOk,
      tokenSrc,
    };
  }

  const {storyblokApi} = sbInitJS({
    accessToken: envToken,
    use: [apiPlugin],
    apiOptions: {region},
  });

  // candidates: language-aware fallback
  const tried: string[] = [];
  const candidates: string[] = [];
  if (langParam && langParam !== 'default')
    candidates.push(`${langParam}/${slug}`);
  candidates.push(slug);
  if (langParam === 'default') candidates.push(`default/${slug}`);

  let story: ISbStoryData | null = null;
  let usedSlug = candidates[candidates.length - 1] || slug;

  for (const candidate of candidates) {
    tried.push(candidate);
    const cdnUrl = `https://api${region === 'us' ? '-us' : ''}.storyblok.com/v2/cdn/stories/${candidate}?version=${version}`;
    console.log(`[SB][PAGE] try slug="${candidate}" (${cdnUrl})`);
    try {
      const {data} = await storyblokApi!.get(`cdn/stories/${candidate}`, {
        version,
        resolve_links: 'url',
        ...(version === 'draft' ? {cv: Date.now()} : {}),
      });
      if (data?.story) {
        story = data.story as ISbStoryData;
        usedSlug = candidate;
        console.log(`[SB][PAGE] ✅ found story at slug="${candidate}"`);
        break;
      }
    } catch (e: unknown) {
      const status =
        (e as {response?: {status?: number}; status?: number})?.response
          ?.status ??
        (e as {status?: number})?.status ??
        'ERR';
      console.warn(`[SB][PAGE] ${status} for slug="${candidate}"`);
      if (status !== 404)
        throw new Response('Storyblok fetch failed', {status: 500});
    }
  }

  return {story, slug, usedSlug, version, region, tried, tokenOk, tokenSrc};
}

export default function CatchAllStoryblokPage() {
  const data = useLoaderData<LoaderData>();
  return (
    <>
      <div className="fixed left-2 bottom-2 z-[99999] rounded border bg-white px-2 py-1 text-[10px] shadow">
        sb usedSlug: <b>{data?.usedSlug}</b> | version: <b>{data?.version}</b> |
        region: <b>{data?.region}</b> | token:{' '}
        <b>{data?.tokenOk ? `ok (${data?.tokenSrc})` : 'missing'}</b>
        <div>tried: {data?.tried?.length ? data.tried.join(' → ') : '—'}</div>
      </div>

      {!data?.story ? (
        <pre style={{padding: 16, background: '#fee', color: '#900'}}>
          No Story found for slug: {data?.usedSlug} (version: {data?.version})
        </pre>
      ) : (
        <StoryblokRenderer story={data.story} />
      )}
    </>
  );
}

function StoryblokRenderer({story}: {story: ISbStoryData}) {
  const state = useStoryblokState(story) as ISbStoryData | null;
  const blok = state?.content as SbBlokData | undefined;
  if (!blok) return null;
  return <StoryblokComponent blok={blok} />;
}
