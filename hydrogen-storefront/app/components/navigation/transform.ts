// app/components/navigation/transform.ts
import {resolveSbHref} from '~/lib/linkResolver';
import type {
  HeaderBlok,
  NavItemBlok,
  NavGroupBlok,
  NavLinkBlok,
} from '~/types/storyblok';
import type {NavItem} from './types';

/** Preferred: pass the `nav` array from the Header blok. */
export function toTopLevelItems(items?: NavItemBlok[] | null): NavItem[] {
  const nav = Array.isArray(items) ? items : [];
  return nav.map(toNavItemFromNavItemBlok);
}

/** Convenience: accept the whole header blok. */
export function toNavItems(header: HeaderBlok): NavItem[] {
  return toTopLevelItems(header.nav);
}

/** Resolve the home href from the header’s MultiLink. */
export function getHomeHref(
  header: HeaderBlok,
  fallback: string = '/',
): string {
  return resolveSbHref(header.home_link, {homeSlug: 'home'}) || fallback;
}

/** Map a Storyblok nav_item blok → UI NavItem (supports simple + mega) */
function toNavItemFromNavItemBlok(ni: NavItemBlok): NavItem {
  const base: NavItem = {
    id: ni._uid,
    label: ni.label ?? 'Link',
    href: ni.link ? resolveSbHref(ni.link, {homeSlug: 'home'}) : undefined,
    highlight: !!(ni as any).highlight,
  };

  const sub = Array.isArray(ni.subnav) ? ni.subnav : [];
  if (!sub.length) return base;

  if (sub.every((c) => c.component === 'nav_link')) {
    return {
      ...base,
      children: (sub as NavLinkBlok[]).map(toNavItemFromNavLinkBlok),
    };
  }

  const groups: NonNullable<NavItem['groups']> = [];
  for (const child of sub as (NavGroupBlok | NavLinkBlok)[]) {
    if (child.component === 'nav_group') {
      const g = child as NavGroupBlok;
      groups.push({
        id: g._uid,
        title: g.title,
        items: (g.items ?? []).map(toNavItemFromNavLinkBlok),
      });
    } else {
      if (!groups.length || groups[0].title !== undefined) {
        groups.unshift({id: `loose-${ni._uid}`, title: undefined, items: []});
      }
      groups[0].items.push(toNavItemFromNavLinkBlok(child as NavLinkBlok));
    }
  }
  return {...base, groups};
}

/** Map a Storyblok nav_link blok → UI leaf NavItem */
function toNavItemFromNavLinkBlok(linkBlok: NavLinkBlok): NavItem {
  return {
    id: linkBlok._uid,
    label: linkBlok.label ?? 'Link',
    href: resolveSbHref(linkBlok.link, {homeSlug: 'home'}),
    badge: linkBlok.badge,
  };
}
