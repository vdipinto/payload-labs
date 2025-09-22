// app/root.tsx
/**
 * Hydrogen root:
 * - Shopify analytics & perf
 * - Storyblok init (client) and Storyblok CDN fetch (server)
 * - Fetches Shopify header/footer + Storyblok "global" (or env override)
 */

import {Analytics, getShopAnalytics, useNonce} from '@shopify/hydrogen';
import type {LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {
  Outlet,
  useRouteError,
  isRouteErrorResponse,
  type ShouldRevalidateFunction,
  Links,
  Meta,
  Scripts,
  ScrollRestoration,
  useRouteLoaderData,
} from 'react-router';
import {useMemo, useEffect, useState} from 'react';

import favicon from '~/assets/favicon.svg';
import {FOOTER_QUERY, HEADER_QUERY} from '~/lib/fragments';

// link tags
import tailwindCss from '~/styles/tailwind.css?url';
import resetStyles from '~/styles/reset.css?url';
import appStyles from '~/styles/app.css?url';

import {PageLayout} from './components/PageLayout';

// Storyblok
import {initStoryblok} from '~/lib/storyblok';
import StoryblokClient from 'storyblok-js-client';
import type {HeaderBlok} from '~/types/storyblok';

export type RootLoader = typeof loader;

/** Only revalidate when needed */
export const shouldRevalidate: ShouldRevalidateFunction = ({
  formMethod,
  currentUrl,
  nextUrl,
}) => {
  if (formMethod && formMethod !== 'GET') return true;
  if (currentUrl.toString() === nextUrl.toString()) return true;
  return false;
};

/** Static <link> tags */
export function links() {
  return [
    {rel: 'preconnect', href: 'https://cdn.shopify.com'},
    {rel: 'preconnect', href: 'https://shop.app'},
    {rel: 'icon', type: 'image/svg+xml', href: favicon},
    // — Adobe Fonts project stylesheet —
    {rel: 'stylesheet', href: 'https://use.typekit.net/sus7ruw.css'},
  ];
}

/** Top-level loader */
export async function loader(args: LoaderFunctionArgs) {
  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args);

  const {storefront, env} = args.context;

  return {
    ...deferredData,
    ...criticalData, // { header, sbHeaderBlok }
    publicStoreDomain: env.PUBLIC_STORE_DOMAIN,
    shop: getShopAnalytics({
      storefront,
      publicStorefrontId: env.PUBLIC_STOREFRONT_ID,
    }),
    consent: {
      checkoutDomain: env.PUBLIC_CHECKOUT_DOMAIN,
      storefrontAccessToken: env.PUBLIC_STOREFRONT_API_TOKEN,
      withPrivacyBanner: false,
      country: storefront.i18n.country,
      language: storefront.i18n.language,
    },
  };
}

/** CRITICAL data (above-the-fold) */
async function loadCriticalData({context}: LoaderFunctionArgs) {
  const {storefront, env} = context;

  // Decide draft vs published (uses STORYBLOK_PREVIEW; supports import.meta.env fallback)
  const previewFlag = String(
    env.STORYBLOK_PREVIEW ?? import.meta.env.STORYBLOK_PREVIEW ?? '',
  ).toLowerCase();
  const version: 'draft' | 'published' =
    previewFlag === 'true' || previewFlag === '1' ? 'draft' : 'published';

  // Token & region (support context, import.meta.env, and process.env)
  const token =
    env.VITE_STORYBLOK_TOKEN ||
    import.meta.env.VITE_STORYBLOK_TOKEN ||
    process.env.VITE_STORYBLOK_TOKEN ||
    '';
  const region: 'eu' | 'us' =
    (
      env.STORYBLOK_API_REGION ||
      import.meta.env.STORYBLOK_API_REGION ||
      process.env.STORYBLOK_API_REGION ||
      'eu'
    ).toLowerCase() === 'us'
      ? 'us'
      : 'eu';

  // Base slug to fetch (env override → default "global")
  const baseSlug = (
    env.STORYBLOK_HEADER_SLUG ||
    process.env.STORYBLOK_HEADER_SLUG ||
    'global'
  )
    .toString()
    .replace(/^\/+|\/+$/g, '');

  // Try a few likely candidates to be resilient to "default/" prefixes, etc.
  const candidates = Array.from(
    new Set<string>([
      baseSlug, // e.g. "global" or "settings/global"
      baseSlug.startsWith('default/')
        ? baseSlug.replace(/^default\//, '')
        : `default/${baseSlug}`,
      'global',
    ]),
  );

  console.log(
    `[SB][HEADER] token=${token ? 'ok' : 'missing'} version=${version} region=${region} candidates=${JSON.stringify(
      candidates,
    )}`,
  );

  // Shopify header (for starter footer, predictive search domain)
  const shopifyHeaderPromise = storefront.query(HEADER_QUERY, {
    cache: storefront.CacheLong(),
    variables: {headerMenuHandle: 'main-menu'},
  });

  let sbHeaderBlok: HeaderBlok | null = null;
  if (token) {
    const sb = new StoryblokClient({accessToken: token, region});
    for (const slug of candidates) {
      try {
        console.log(
          `[SB][HEADER] fetch slug="${slug}" version=${version} region=${region}`,
        );
        const res = await sb.get(`cdn/stories/${slug}`, {version});
        const content = res?.data?.story?.content ?? null;

        // Fast-path common fields
        sbHeaderBlok =
          (content?.header?.[0] as HeaderBlok | undefined) ??
          (content?.Header?.[0] as HeaderBlok | undefined) ??
          null;

        // Deep scan for a blok with component === "header"
        if (!sbHeaderBlok && content) {
          const findHeader = (v: unknown): any | null => {
            if (!v) return null;
            if (Array.isArray(v)) {
              for (const x of v) {
                const f = findHeader(x);
                if (f) return f;
              }
              return null;
            }
            if (typeof v === 'object') {
              const o = v as Record<string, unknown>;
              if ((o as any).component === 'header') return o;
              for (const val of Object.values(o)) {
                const f = findHeader(val);
                if (f) return f;
              }
            }
            return null;
          };
          sbHeaderBlok = findHeader(content) as HeaderBlok | null;
        }

        if (sbHeaderBlok) {
          console.log('[SB] Header blok found:', (sbHeaderBlok as any)?._uid);
          break;
        } else {
          console.warn(`[SB] Story "${slug}" found but no header blok inside.`);
        }
      } catch (e: any) {
        const status = e?.response?.status ?? e?.status ?? 'ERR';
        console.warn(`[SB] ${status} for header slug candidate "${slug}"`);
        if (status !== 404) {
          // Non-404 errors should surface
          throw e;
        }
      }
    }
  } else {
    console.warn('[SB][HEADER] No VITE_STORYBLOK_TOKEN — header skipped.');
  }

  return {header: await shopifyHeaderPromise, sbHeaderBlok};
}

/** Deferred (below-the-fold) */
function loadDeferredData({context}: LoaderFunctionArgs) {
  const {storefront, customerAccount, cart} = context;

  const footer = storefront
    .query(FOOTER_QUERY, {
      cache: storefront.CacheLong(),
      variables: {footerMenuHandle: 'footer'},
    })
    .catch((error) => {
      console.error(error);
      return null;
    });

  const cartPromise = cart?.get ? cart.get() : Promise.resolve(null);
  const isLoggedInPromise = customerAccount?.isLoggedIn
    ? customerAccount.isLoggedIn()
    : Promise.resolve(false);

  return {cart: cartPromise, isLoggedIn: isLoggedInPromise, footer};
}

/** 🔎 visible hydration probe */
function HydrationProbe() {
  const [n, setN] = useState(0);
  useEffect(() => {
    console.log('✅ root hydrated');
  }, []);
  return (
    <button
      type="button"
      onClick={() => setN((x) => x + 1)}
      className="fixed bottom-4 right-4 z-[99999] rounded border px-2 py-1 text-xs bg-white shadow"
    >
      hydrated clicks: {n}
    </button>
  );
}

/** App HTML shell */
export function Layout({children}: {children?: React.ReactNode}) {
  const nonce = useNonce();
  const data = useRouteLoaderData<RootLoader>('root');

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links /> {/* Hydrogen virtual styles (Inter) load here */}
        {/* your globals LAST */}
        <link rel="stylesheet" href={tailwindCss} />
        <link rel="stylesheet" href={resetStyles} />
        <link rel="stylesheet" href={appStyles} />
      </head>
      <body className="font-sans">
        {data ? (
          <Analytics.Provider
            cart={data.cart}
            shop={data.shop}
            consent={data.consent}
          >
            <PageLayout {...(data as any)}>{children}</PageLayout>
          </Analytics.Provider>
        ) : (
          children
        )}

        {/* visible hydration counter */}
        <HydrationProbe />

        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
      </body>
    </html>
  );
}

/** Router outlet + client Storyblok init */
export default function App() {
  useMemo(() => {
    initStoryblok(); // idempotent init on the client; bridge only in editor
  }, []);
  return <Outlet />;
}

/** Error boundary */
export function ErrorBoundary() {
  const error = useRouteError();
  let errorMessage = 'Unknown error';
  let errorStatus = 500;

  if (isRouteErrorResponse(error)) {
    errorMessage = (error as any)?.data?.message ?? (error as any).data;
    errorStatus = (error as any).status;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  return (
    <div className="route-error">
      <h1>Oops</h1>
      <h2>{errorStatus}</h2>
      {errorMessage && (
        <fieldset>
          <pre>{errorMessage}</pre>
        </fieldset>
      )}
    </div>
  );
}
