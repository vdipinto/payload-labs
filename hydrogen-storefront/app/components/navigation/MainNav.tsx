import {clsx} from 'clsx';
import {useEffect, useRef, useState} from 'react';
import type {HeaderBlok, RightActionBlok} from '~/types/storyblok';
import DesktopNav from './DesktopNav';
import MobileMenu from './MobileMenu';
import {toTopLevelItems, getHomeHref} from './transform';
import DesktopRightNav from './DesktopRightNav';

// Placeholder logo – swap for your component
function Logo() {
  return <span className="font-black tracking-tight">MyBrand</span>;
}

export default function MainNav({blok}: {blok: HeaderBlok}) {
  const headerRef = useRef<HTMLElement | null>(null);
  const [submenuTop, setSubmenuTop] = useState(0);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    const measure = () => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      const borderBottom = parseFloat(cs.borderBottomWidth || '0');
      setSubmenuTop(r.bottom - borderBottom);
    };

    measure();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(measure);
      ro.observe(el);
    }

    let ticking = false;
    const onScrollOrResize = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          measure();
          ticking = false;
        });
      }
    };
    window.addEventListener('scroll', onScrollOrResize, {passive: true});
    window.addEventListener('resize', onScrollOrResize);

    return () => {
      ro?.disconnect();
      window.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, []);

  const items = toTopLevelItems(blok.nav);
  const homeHref = getHomeHref(blok, '/');
  const isFull = blok.max_width === 'full';

  return (
    <header
      ref={headerRef}
      className={clsx(
        'w-full border-b border-neutral-200 overflow-visible px-4',
        blok.sticky &&
          'sticky top-0 z-[60] bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60',
      )}
    >
      <div
        className={clsx('w-full', !isFull && 'mx-auto max-w-7xl px-4')}
        data-max-width={blok.max_width}
        data-is-full={String(isFull)}
      >
        <div className="flex h-14 items-center">
          {/* Left: Logo */}
          <a
            href={homeHref}
            aria-label="Home"
            className="inline-flex items-center shrink-0"
          >
            <Logo />
          </a>

          {/* Middle (grows) */}
          <div className="ml-8 hidden md:flex items-center flex-1 min-w-0">
            <DesktopNav items={items} submenuTop={submenuTop} />
            <DesktopRightNav items={blok.right_items as RightActionBlok[]} />
          </div>

          {/* Mobile hamburger */}
          <div className="ml-auto md:hidden">
            <MobileMenu
              items={items}
              rightItems={blok.right_items}
              homeHref={homeHref}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
