// app/components/blocks/Page.tsx
import * as React from 'react';
import {StoryblokComponent, type SbBlokData} from '@storyblok/react';

type AnyBlok = SbBlokData & {_uid: string; component: string};
type PageBlok = {_uid: string; component: 'page'; body?: AnyBlok[]};

export default function Page({blok}: {blok: PageBlok}) {
  const body = Array.isArray(blok.body) ? blok.body : [];

  React.useEffect(() => {
    console.log('[SB Page] body length:', body.length, blok);
  }, [body.length]);

  if (body.length === 0) {
    return (
      <section className="mx-auto max-w-3xl p-6 text-sm text-neutral-600">
        <div className="rounded border bg-white p-4">
          This Storyblok page has no blocks yet. Add a block to the <b>Body</b>{' '}
          field (e.g. <code>teaser</code>) and click <b>Save</b>.
        </div>
      </section>
    );
  }

  return (
    <>
      {body.map((nested) => (
        <StoryblokComponent key={nested._uid} blok={nested} />
      ))}
    </>
  );
}
