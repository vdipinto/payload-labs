// app/components/PageLayout.tsx
import {Await, Link} from 'react-router';
import {Suspense, useEffect, useId} from 'react';
import type {
  CartApiQueryFragment,
  FooterQuery,
  HeaderQuery,
} from 'storefrontapi.generated';

import {Aside, useAside} from '~/components/Aside';
import {Footer} from '~/components/Footer';
// ❌ remove the starter header imports
// import {Header, HeaderMenu} from "~/components/Header";

// ✅ add your Storyblok header wrapper + type
import SBHeader from '~/components/blocks/Header';
import type {HeaderBlok} from '~/types/storyblok';

import {CartMain} from '~/components/CartMain';
import {
  SEARCH_ENDPOINT,
  SearchFormPredictive,
} from '~/components/SearchFormPredictive';
import {SearchResultsPredictive} from '~/components/SearchResultsPredictive';

/**
 * We keep Shopify data (header/footer) for the starter Footer + predictive search,
 * but replace the starter Header with your Storyblok header.
 */
interface PageLayoutProps {
  cart: Promise<CartApiQueryFragment | null>;
  footer: Promise<FooterQuery | null>;
  header: HeaderQuery; // still used by Footer + predictive search
  isLoggedIn: Promise<boolean>;
  publicStoreDomain: string;
  children?: React.ReactNode;

  /** NEW: Storyblok header blok (provided from root loader) */
  sbHeaderBlok?: HeaderBlok | null;
}

/**
 * Bridges nav CustomEvents to Hydrogen's Aside drawers.
 * Your nav triggers:
 *   - window.dispatchEvent(new CustomEvent("open-cart"))
 *   - window.dispatchEvent(new CustomEvent("open-search"))
 *   - window.dispatchEvent(new CustomEvent("toggle-currency"))
 */
function NavEventBridge() {
  const {open} = useAside();

  useEffect(() => {
    const onCart = () => open('cart');
    const onSearch = () => open('search');
    const onToggleCurrency = () => {
      const next =
        (localStorage.getItem('currency') || 'GBP') === 'EUR' ? 'GBP' : 'EUR';
      localStorage.setItem('currency', next);
      document.dispatchEvent(
        new CustomEvent('currency-changed', {detail: next}),
      );
    };

    window.addEventListener('open-cart', onCart as EventListener);
    window.addEventListener('open-search', onSearch as EventListener);
    window.addEventListener(
      'toggle-currency',
      onToggleCurrency as EventListener,
    );

    return () => {
      window.removeEventListener('open-cart', onCart as EventListener);
      window.removeEventListener('open-search', onSearch as EventListener);
      window.removeEventListener(
        'toggle-currency',
        onToggleCurrency as EventListener,
      );
    };
  }, [open]);

  return null;
}

export function PageLayout({
  cart,
  children = null,
  footer,
  header,
  isLoggedIn,
  publicStoreDomain,
  sbHeaderBlok,
}: PageLayoutProps) {
  return (
    <Aside.Provider>
      {/* Bridge nav buttons → Hydrogen drawers */}
      <NavEventBridge />

      {/* Keep Shopify asides for cart & search */}
      <CartAside cart={cart} />
      <SearchAside />

      {/* ❌ Remove the starter <Header .../> */}
      {/* ✅ Render your Storyblok header */}
      {sbHeaderBlok ? <SBHeader blok={sbHeaderBlok} /> : null}

      <main>{children}</main>

      {/* Keep the starter footer (uses Shopify footer + header.shop.primaryDomain) */}
      <Footer
        footer={footer}
        header={header}
        publicStoreDomain={publicStoreDomain}
      />
    </Aside.Provider>
  );
}

function CartAside({cart}: {cart: PageLayoutProps['cart']}) {
  return (
    <Aside type="cart" heading="CART">
      <Suspense fallback={<p>Loading cart ...</p>}>
        <Await resolve={cart}>
          {(cart) => <CartMain cart={cart} layout="aside" />}
        </Await>
      </Suspense>
    </Aside>
  );
}

function SearchAside() {
  const queriesDatalistId = useId();
  return (
    <Aside type="search" heading="SEARCH">
      <div className="predictive-search">
        <br />
        <SearchFormPredictive>
          {({fetchResults, goToSearch, inputRef}) => (
            <>
              <input
                name="q"
                onChange={fetchResults}
                onFocus={fetchResults}
                placeholder="Search"
                ref={inputRef}
                type="search"
                list={queriesDatalistId}
              />
              &nbsp;
              <button onClick={goToSearch}>Search</button>
            </>
          )}
        </SearchFormPredictive>

        <SearchResultsPredictive>
          {({items, total, term, state, closeSearch}) => {
            const {articles, collections, pages, products, queries} = items;

            if (state === 'loading' && term.current) {
              return <div>Loading...</div>;
            }

            if (!total) {
              return <SearchResultsPredictive.Empty term={term} />;
            }

            return (
              <>
                <SearchResultsPredictive.Queries
                  queries={queries}
                  queriesDatalistId={queriesDatalistId}
                />
                <SearchResultsPredictive.Products
                  products={products}
                  closeSearch={closeSearch}
                  term={term}
                />
                <SearchResultsPredictive.Collections
                  collections={collections}
                  closeSearch={closeSearch}
                  term={term}
                />
                <SearchResultsPredictive.Pages
                  pages={pages}
                  closeSearch={closeSearch}
                  term={term}
                />
                <SearchResultsPredictive.Articles
                  articles={articles}
                  closeSearch={closeSearch}
                  term={term}
                />
                {term.current && total ? (
                  <Link
                    onClick={closeSearch}
                    to={`${SEARCH_ENDPOINT}?q=${term.current}`}
                  >
                    <p>
                      View all results for <q>{term.current}</q>
                      &nbsp; →
                    </p>
                  </Link>
                ) : null}
              </>
            );
          }}
        </SearchResultsPredictive>
      </div>
    </Aside>
  );
}

/* NOTE:
   We intentionally removed the starter MobileMenuAside:
   - Your MobileMenu lives inside the Storyblok header/nav UI.
   - If you ever want to drive the mobile menu via Hydrogen Aside instead,
     emit a custom "open-mobile" event from your hamburger and add a new
     <Aside type="mobile"> here. */
