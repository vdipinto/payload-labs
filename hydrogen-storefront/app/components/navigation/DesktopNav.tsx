// app/components/navigation/DesktopNav.tsx
import {Link} from 'react-router';
import {useRef, useState} from 'react';
import type {NavItem} from './types';
import {navClasses, BADGE_BASE} from './navClasses';
import ChevronDownIcon from '../icons/ChevronDownIcon';

export default function DesktopNav({
  items,
  submenuTop,
}: {
  items: NavItem[];
  submenuTop: number;
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  // ONE shared close timer for the whole nav (prevents races)
  const closeTimer = useRef<number | null>(null);
  const cancelClose = () => {
    if (closeTimer.current != null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };
  const scheduleClose = (ms = 120) => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => setOpenId(null), ms);
  };

  return (
    <nav aria-label="Primary" className="desktop-nav">
      <ul
        className="flex items-center gap-8 min-w-0"
        onMouseEnter={cancelClose} // stay open while inside the bar
        onMouseLeave={() => scheduleClose(120)} // close when leaving the whole bar
        onFocus={cancelClose} // keep open while focused anywhere inside
        onBlur={() => scheduleClose(120)} // close after focus leaves the whole bar
      >
        {items.map((it) => (
          <li key={it.id} className="relative">
            <TopLevel
              it={it}
              isOpen={openId === it.id}
              open={() => {
                cancelClose();
                setOpenId(it.id);
              }}
              closeSoon={() => scheduleClose(120)}
              closeNow={() => setOpenId(null)}
              submenuTop={submenuTop}
            />
          </li>
        ))}
      </ul>
    </nav>
  );
}

function TopLevel({
  it,
  isOpen,
  open,
  closeSoon,
  closeNow,
  submenuTop,
}: {
  it: NavItem;
  isOpen: boolean;
  open: () => void;
  closeSoon: () => void;
  closeNow: () => void;
  submenuTop: number;
}) {
  const hasSimple = !!it.children?.length;
  const hasMega = !!it.groups?.length;
  const hasSubmenu = hasSimple || hasMega;

  const btnId = `topbtn-${it.id}`;
  const panelId = `submenu-${it.id}`;
  const panelRef = useRef<HTMLDivElement | null>(null);

  if (!hasSubmenu && it.href) {
    return (
      <Link to={it.href} className={navClasses(it.highlight)}>
        {it.label}
      </Link>
    );
  }

  const focusFirstItem = () => {
    const panel = panelRef.current;
    if (!panel) return;
    const firstFocusable = panel.querySelector<HTMLElement>(
      'a, button, [tabindex]:not([tabindex="-1"])',
    );
    firstFocusable?.focus();
  };

  return (
    // Wrapper gets a non-interactive role so a11y linter is happy about mouse handlers
    <div
      className="relative"
      role="none"
      onMouseEnter={open}
      onMouseLeave={closeSoon}
    >
      <button
        id={btnId}
        type="button"
        className={navClasses(it.highlight)}
        aria-expanded={isOpen}
        aria-controls={panelId}
        aria-haspopup="menu"
        onClick={() => {
          if (isOpen) {
            closeNow();
          } else {
            open();
          }
        }}
        onFocus={open} // keyboard users tabbing in will open
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            open();
            // focus after render
            setTimeout(focusFirstItem, 0);
          } else if (e.key === 'Escape') {
            e.preventDefault();
            closeNow();
            (e.currentTarget as HTMLButtonElement).focus();
          } else if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (isOpen) {
              closeNow();
            } else {
              open();
            }
          }
        }}
      >
        {it.label}
        <ChevronDownIcon className="w-4 h-4" />
      </button>

      {/* SIMPLE (full-width) */}
      {hasSimple && (
        <div
          id={panelId}
          ref={panelRef}
          role="menu"
          aria-labelledby={btnId}
          tabIndex={-1}
          className={[
            'fixed left-0 right-0',
            // hover bridge that does NOT capture the pointer
            "before:content-[''] before:absolute before:inset-x-0 before:-top-6 before:h-6 before:pointer-events-none",
            'transition-opacity duration-150',
            isOpen
              ? 'opacity-100 visible pointer-events-auto z-[9999]'
              : 'opacity-0 invisible pointer-events-none',
          ].join(' ')}
          style={{top: submenuTop}}
          onMouseEnter={open} // keep open while over the panel
          onMouseLeave={closeSoon}
          onFocus={open}
          onBlur={closeSoon}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              closeNow();
              const btn = document.getElementById(
                btnId,
              ) as HTMLButtonElement | null;
              btn?.focus();
            }
          }}
        >
          <SimpleSubmenu items={it.children!} />
        </div>
      )}

      {/* MEGA (anchored) */}
      {!hasSimple && hasMega && (
        <div
          id={panelId}
          ref={panelRef}
          role="menu"
          aria-labelledby={btnId}
          tabIndex={-1}
          className={[
            'absolute left-1/2 top-full -translate-x-1/2',
            "before:content-[''] before:absolute before:inset-x-0 before:-top-6 before:h-6 before:pointer-events-none",
            'transition-opacity duration-150',
            isOpen
              ? 'opacity-100 visible pointer-events-auto z-[9999]'
              : 'opacity-0 invisible pointer-events-none',
          ].join(' ')}
          onMouseEnter={open}
          onMouseLeave={closeSoon}
          onFocus={open}
          onBlur={closeSoon}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              closeNow();
              const btn = document.getElementById(
                btnId,
              ) as HTMLButtonElement | null;
              btn?.focus();
            }
          }}
        >
          <MegaSubmenu groups={it.groups!} />
        </div>
      )}
    </div>
  );
}

function SimpleSubmenu({items}: {items: NavItem[]}) {
  return (
    <div className="w-screen bg-white border-t border-neutral-200 shadow text-neutral-900">
      <div className="px-4">
        <ul className="flex gap-5 py-4 overflow-x-auto w-full">
          {items.map((lnk) => (
            <li key={lnk.id}>
              <Link
                to={lnk.href || '#'}
                role="menuitem"
                className={navClasses(lnk.highlight)}
              >
                {lnk.label}
                {lnk.badge && <span className={BADGE_BASE}>{lnk.badge}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function MegaSubmenu({
  groups,
}: {
  groups: {id: string; title?: string; items: NavItem[]}[];
}) {
  return (
    <div className="min-w-[560px] rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl text-neutral-900">
      <div className="grid grid-cols-2 gap-6">
        {groups.map((g) => (
          <div key={g.id}>
            {g.title && (
              <div className="mb-2 text-[12px]/[16px] font-semibold tracking-[0.03rem] uppercase text-neutral-500">
                {g.title}
              </div>
            )}
            <div className="flex flex-col gap-2">
              {g.items.map((it) => (
                <Link
                  key={it.id}
                  to={it.href || '#'}
                  role="menuitem"
                  className={navClasses(it.highlight)}
                >
                  <span>{it.label}</span>
                  {it.badge && <span className={BADGE_BASE}>{it.badge}</span>}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
