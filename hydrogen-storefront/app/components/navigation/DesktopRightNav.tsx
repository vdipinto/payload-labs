import {navClasses} from './navClasses';
import {resolveSbHref} from '~/lib/linkResolver';
import type {RightActionBlok} from '~/types/storyblok';

type Props = {
  items?: RightActionBlok[] | null;
};

const EVENT = {
  OPEN_SEARCH: 'open-search',
  OPEN_CART: 'open-cart',
  TOGGLE_CURRENCY: 'toggle-currency',
} as const;

function ActionButton({
  onClick,
  label,
  highlight,
  ariaLabel,
}: {
  onClick: () => void;
  label: string;
  ariaLabel?: string;
  highlight?: boolean;
}) {
  return (
    <button
      type="button"
      className={navClasses(!!highlight)}
      onClick={onClick}
      aria-label={ariaLabel || label}
    >
      {label}
    </button>
  );
}

function ActionLink({
  href,
  label,
  highlight,
}: {
  href: string;
  label: string;
  highlight?: boolean;
}) {
  return (
    <a href={href} className={navClasses(!!highlight)}>
      {label}
    </a>
  );
}

export default function DesktopRightNav({items}: Props) {
  if (!items?.length) return null;

  return (
    <nav
      aria-label="Right navigation"
      className="ml-auto flex items-center gap-6"
    >
      {items.map((ri) => {
        const type = ri.type || 'search';
        const highlight = !!ri.highlight;

        if (type === 'search') {
          return (
            <ActionButton
              key={ri._uid}
              label={ri.label || 'Search'}
              ariaLabel="Open search"
              highlight={highlight}
              onClick={() =>
                window.dispatchEvent(new CustomEvent(EVENT.OPEN_SEARCH))
              }
            />
          );
        }

        if (type === 'locale') {
          return (
            <ActionButton
              key={ri._uid}
              label={ri.label || 'GB / £'}
              ariaLabel="Toggle currency"
              highlight={highlight}
              onClick={() =>
                window.dispatchEvent(new CustomEvent(EVENT.TOGGLE_CURRENCY))
              }
            />
          );
        }

        if (type === 'bag') {
          return (
            <ActionButton
              key={ri._uid}
              label={ri.label || 'Bag'}
              ariaLabel="Open cart"
              highlight={highlight}
              onClick={() =>
                window.dispatchEvent(new CustomEvent(EVENT.OPEN_CART))
              }
            />
          );
        }

        // Fallback: plain anchor for real links
        const href = resolveSbHref(ri.link, {homeSlug: 'home'});
        return (
          <ActionLink
            key={ri._uid}
            href={href}
            label={ri.label || 'Link'}
            highlight={highlight}
          />
        );
      })}
    </nav>
  );
}
