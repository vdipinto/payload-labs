// app/components/navigation/MobileMenu.tsx
import {useEffect, useMemo, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {Link} from 'react-router';
import type {NavItem} from './types';
import type {RightActionBlok} from '~/types/storyblok';
import {navClasses, BADGE_BASE} from './navClasses';
import HamburgerIcon from '../icons/HamburgerIcon';

type Props = {
  items: NavItem[];
  rightItems?: RightActionBlok[];
  homeHref?: string;
};

const EVENT = {
  OPEN_SEARCH: 'open-search',
  OPEN_CART: 'open-cart',
  TOGGLE_CURRENCY: 'toggle-currency',
} as const;

// Build a stable key for each drilldown level from the items' ids
const levelKeyFrom = (level: NavItem[], i: number) =>
  level.length ? level.map((it) => it.id).join('|') : `empty-${i}`;

export default function MobileMenu({
  items,
  rightItems = [],
  homeHref = '/',
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  // Drilldown: stack of levels; each level is a NavItem[]
  const [menuStack, setMenuStack] = useState<NavItem[][]>([items]);
  // Matching titles for each level (used for the centered title row)
  const [titleStack, setTitleStack] = useState<string[]>(['Menu']);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Inline actions next to hamburger; keep 'locale' for the bottom of the panel
  const {inlineActions, localeAction} = useMemo(() => {
    const locale = rightItems.find((r) => (r.type || 'search') === 'locale');
    const inline = rightItems.filter((r) => (r.type || 'search') !== 'locale');
    return {inlineActions: inline, localeAction: locale};
  }, [rightItems]);

  useEffect(() => setMounted(true), []);

  // Reset stack when items change or menu is closed
  useEffect(() => {
    if (!open) {
      setMenuStack([items]);
      setTitleStack(['Menu']);
    }
  }, [items, open]);

  // Focus trap + ESC + scroll lock
  useEffect(() => {
    if (!open) return;

    const getFocusable = () =>
      panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ) ?? [];

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
      if (e.key === 'Tab') {
        const nodes = getFocusable();
        if (!nodes.length) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        const active = document.activeElement as HTMLElement | null;

        if (e.shiftKey) {
          if (!active || active === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (!active || active === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    setTimeout(() => closeRef.current?.focus(), 0);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const levelIndex = menuStack.length - 1;

  const pushMenu = (subItems: NavItem[], title?: string) => {
    if (!subItems.length) return;
    setMenuStack((s) => [...s, subItems]);
    setTitleStack((ts) => [...ts, title || '']);
  };

  const popMenu = () => {
    setMenuStack((s) => (s.length > 1 ? s.slice(0, -1) : s));
    setTitleStack((ts) => (ts.length > 1 ? ts.slice(0, -1) : ts));
  };

  const closeMenu = () => {
    setOpen(false);
    setMenuStack([items]);
    setTitleStack(['Menu']);
    setTimeout(() => triggerRef.current?.focus(), 0);
  };

  const getSubItems = (it: NavItem): NavItem[] => {
    if (it.children?.length) return it.children;
    if (it.groups?.length) return it.groups.flatMap((g) => g.items);
    return [];
  };

  return (
    // Hide these controls from assistive tech when the modal is open
    <div className="flex items-center gap-3" aria-hidden={open}>
      {/* Inline right actions (except locale) */}
      {inlineActions.map((ri) => (
        <InlineRightAction key={ri._uid} act={ri} />
      ))}

      {/* Fullscreen panel */}
      {mounted &&
        createPortal(
          <div
            id="mobile-menu-panel"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-menu-title"
            className={[
              'fixed inset-0 z-[100010] bg-white',
              'flex h-dvh flex-col',
              'transition-transform duration-200 ease-out will-change-transform',
              open ? 'translate-x-0' : 'translate-x-full',
              'motion-reduce:transition-none',
            ].join(' ')}
          >
            {/* Top bar: brand left, actions + CLOSE right (re-render actions inside overlay) */}
            <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 bg-white">
              <Link
                to={homeHref}
                onClick={closeMenu}
                className="font-black tracking-tight text-neutral-900"
              >
                <strong id="mobile-menu-title">MyBrand</strong>
              </Link>
              <div className="flex items-center gap-2">
                {inlineActions.map((ri) => (
                  <InlineRightAction key={`panel-${ri._uid}`} act={ri} />
                ))}
                <button
                  ref={closeRef}
                  type="button"
                  onClick={closeMenu}
                  className="btn cursor-pointer text-sm font-semibold"
                >
                  CLOSE
                </button>
              </div>
            </div>

            {/* Drilldown slider */}
            <div className="relative flex-1 overflow-hidden bg-white">
              <div
                className={[
                  'flex h-full w-full',
                  'transition-transform duration-300 ease-out will-change-transform',
                  'motion-reduce:transition-none',
                ].join(' ')}
                style={{transform: `translateX(-${levelIndex * 100}%)`}}
              >
                {menuStack.map((level, i) => {
                  const levelKey = levelKeyFrom(level, i);
                  return (
                    <div
                      key={levelKey}
                      className="w-full flex-shrink-0 flex-grow-0"
                      aria-hidden={i !== levelIndex}
                    >
                      <ul className="flex flex-col divide-y divide-neutral-200">
                        {/* Centered title row FIRST (only on sub-levels) */}
                        {i > 0 && (
                          <li aria-hidden className="bg-white">
                            <div
                              role="heading"
                              aria-level={2}
                              className="flex items-center justify-center px-4 py-3 text-sm font-medium text-neutral-500"
                            >
                              {titleStack[i] || ''}
                            </div>
                          </li>
                        )}

                        {/* Back row NEXT (only on sub-levels) */}
                        {i > 0 && (
                          <li>
                            <button
                              type="button"
                              onClick={popMenu}
                              className="btn cursor-pointer flex w-full items-center gap-2 px-4 py-4 text-sm font-medium"
                              aria-label="Go back"
                            >
                              <span aria-hidden>←</span>
                              <span>Back</span>
                            </button>
                          </li>
                        )}

                        {/* Level content */}
                        {level.map((it) => {
                          const hasSub = Boolean(
                            it.children?.length || it.groups?.length,
                          );

                          if (hasSub) {
                            const subItems = getSubItems(it);
                            return (
                              <li key={it.id} id={`nav-item-${it.id}`}>
                                <button
                                  type="button"
                                  onClick={() => pushMenu(subItems, it.label)}
                                  className="btn cursor-pointer flex w-full items-center justify-between px-4 py-4 text-left"
                                  aria-haspopup="menu"
                                  aria-expanded={false}
                                >
                                  <span className={navClasses(!!it.highlight)}>
                                    {it.label}
                                  </span>
                                  <span
                                    className="i-ph-caret-right-bold text-[16px]"
                                    aria-hidden
                                  />
                                </button>
                              </li>
                            );
                          }

                          return (
                            <li key={it.id} id={`nav-item-${it.id}`}>
                              <Link
                                to={it.href || '#'}
                                className="flex items-center justify-between px-4 py-4"
                                onClick={closeMenu}
                              >
                                <span className={navClasses(!!it.highlight)}>
                                  {it.label}
                                </span>
                                {it.badge && (
                                  <span className={BADGE_BASE}>{it.badge}</span>
                                )}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Locale row at bottom */}
            {localeAction && (
              <div className="border-t border-neutral-200 bg-white">
                <button
                  type="button"
                  onClick={() =>
                    window.dispatchEvent(new CustomEvent(EVENT.TOGGLE_CURRENCY))
                  }
                  className="btn cursor-pointer flex w-full items-center justify-between px-4 py-4 text-left"
                  aria-label={
                    localeAction.label || 'Change shipping / currency'
                  }
                >
                  <span className="text-[13px] font-medium tracking-wide text-neutral-900">
                    {localeAction.label || 'SHIPPING TO / CURRENCY'}
                  </span>
                  <span className="text-[12px] font-semibold">CHANGE</span>
                </button>
              </div>
            )}
          </div>,
          document.body,
        )}

      {/* Hamburger (always visible outside the overlay) */}
      <button
        ref={triggerRef}
        type="button"
        aria-label="Open menu"
        aria-expanded={open}
        aria-controls="mobile-menu-panel"
        onClick={() => setOpen(true)}
        className="btn-reset cursor-pointer inline-flex h-10 w-10 items-center justify-center"
      >
        <HamburgerIcon className="w-6 h-6" />
      </button>
    </div>
  );
}

/* Inline right actions (used both near hamburger and inside panel header). */
function InlineRightAction({act}: {act: RightActionBlok}) {
  const type = act.type || 'search';
  const label =
    act.label ||
    (type === 'bag' ? 'Bag' : type === 'search' ? 'Search' : 'Link');
  const href = (act.link?.url || act.link?.cached_url || '#') as string;

  if (type === 'search') {
    return (
      <button
        type="button"
        className="btn cursor-pointer"
        aria-label="Open search"
        onClick={() => window.dispatchEvent(new CustomEvent(EVENT.OPEN_SEARCH))}
      >
        {label}
      </button>
    );
  }
  if (type === 'bag') {
    return (
      <button
        type="button"
        className="btn cursor-pointer"
        aria-label="Open cart"
        onClick={() => window.dispatchEvent(new CustomEvent(EVENT.OPEN_CART))}
      >
        {label}
      </button>
    );
  }
  return (
    <a href={href} className={navClasses(!!act.highlight)}>
      {label}
    </a>
  );
}
