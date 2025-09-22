// app/lib/linkResolver.ts (Hydrogen/Remix)
import type {SbMultiLink} from '~/types/storyblok'; // use your barrel

type Options = {
  homeSlug?: string; // default "home"
  localePrefix?: string; // e.g. "/en" (must start with "/")
  basePath?: string; // e.g. "/shop" if your app lives under a subpath
};

export function resolveSbHref(
  link?: Partial<SbMultiLink> | null,
  opts: Options = {},
): string {
  const {homeSlug = 'home', localePrefix = '', basePath = ''} = opts;

  if (!link) return withPrefixes('/', {localePrefix, basePath});

  const anchor = link.anchor ? `#${link.anchor}` : '';
  const type = (link.linktype || '').toLowerCase();
  const url = (link.url || '').trim();
  const cached = (link.cached_url || '').trim();

  // If a concrete URL is provided (external, asset, mailto, tel, or "/path"), use it.
  if (url) {
    const href = normalizePath(url);
    return appendAnchor(withPrefixes(href, {localePrefix, basePath}), anchor);
  }

  // Internal stories: use cached_url
  if (type === 'story' || cached) {
    const slug = cached === homeSlug ? '/' : normalizePath(cached);
    return appendAnchor(withPrefixes(slug, {localePrefix, basePath}), anchor);
  }

  // Safe default
  return appendAnchor(withPrefixes('/', {localePrefix, basePath}), anchor);
}

function normalizePath(p: string): string {
  if (!p) return '/';
  // Leave absolute URLs / protocol-relative / mailto / tel untouched
  if (
    /^(https?:)?\/\//i.test(p) ||
    p.startsWith('mailto:') ||
    p.startsWith('tel:')
  )
    return p;
  // Ensure one leading slash for internal paths
  return p.startsWith('/') ? p : `/${p}`;
}

function appendAnchor(href: string, anchor: string): string {
  if (!anchor) return href;
  // If href already has a hash, don’t append another
  return href.includes('#') ? href : `${href}${anchor}`;
}

function withPrefixes(
  href: string,
  {localePrefix, basePath}: {localePrefix: string; basePath: string},
): string {
  // Only prefix internal paths (starting with a single "/")
  if (!href.startsWith('/') || href.startsWith('//')) return href;

  const prefix = `${trimSlash(basePath)}${trimSlash(localePrefix)}`;
  if (!prefix) return href;

  // Avoid duplicating slashes: "/en" + "/about" -> "/en/about"
  return `${prefix}${href}`;
}

function trimSlash(s: string): string {
  if (!s) return '';
  // ensure leading slash, no trailing slash (except root)
  const t = s.startsWith('/') ? s : `/${s}`;
  return t.endsWith('/') && t !== '/' ? t.slice(0, -1) : t;
}
