// server.ts
import {storefrontRedirect} from '@shopify/hydrogen';
import {createRequestHandler} from '@shopify/remix-oxygen';
import {createAppLoadContext} from '~/lib/context';

export default {
  async fetch(request: Request, env: Env, executionContext: ExecutionContext) {
    try {
      const appLoadContext = await createAppLoadContext(
        request,
        env,
        executionContext,
      );

      const handleRequest = createRequestHandler({
        // eslint-disable-next-line import/no-unresolved
        build: await import('virtual:react-router/server-build'),
        mode: process.env.NODE_ENV,
        getLoadContext: () => appLoadContext,
      });

      let response = await handleRequest(request);

      if (appLoadContext.session.isPending) {
        response.headers.set(
          'Set-Cookie',
          await appLoadContext.session.commit(),
        );
      }

      if (response.status === 404) {
        // let Hydrogen handle Shopify redirects on 404s
        response = await storefrontRedirect({
          request,
          response,
          storefront: appLoadContext.storefront,
        });
      }

      // 🔐 Allow Storyblok Visual Editor to iframe this app
      // clone so we can safely edit headers
      const framed = new Response(response.body, response);

      // CSP: allow Storyblok to be a frame ancestor
      const fa =
        "frame-ancestors 'self' https://app.storyblok.com https://*.storyblok.com";
      const existingCsp = framed.headers.get('Content-Security-Policy');
      if (!existingCsp) {
        framed.headers.set('Content-Security-Policy', fa);
      } else if (!/frame-ancestors/i.test(existingCsp)) {
        framed.headers.set('Content-Security-Policy', `${existingCsp}; ${fa}`);
      } else {
        // replace any existing frame-ancestors with ours
        framed.headers.set(
          'Content-Security-Policy',
          existingCsp.replace(/frame-ancestors[^;]*/i, fa),
        );
      }

      // Old header — make sure it's not blocking
      framed.headers.delete('X-Frame-Options');

      return framed;
    } catch (error) {
      console.error(error);
      return new Response('An unexpected error occurred', {status: 500});
    }
  },
};
