// app/components/blocks/Page.tsx
import {StoryblokComponent} from '@storyblok/react';

export default function Page({blok}: any) {
  return (
    <main>
      {blok.body?.map((nestedBlok: any) => (
        <StoryblokComponent blok={nestedBlok} key={nestedBlok._uid} />
      ))}
    </main>
  );
}
