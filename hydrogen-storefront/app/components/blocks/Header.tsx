// app/components/blocks/Header.tsx
import {storyblokEditable} from '@storyblok/react';
import type {HeaderBlok} from '~/types/storyblok';
import MainNav from '~/components/navigation/MainNav';

/**
 * Storyblok "header" blok renderer.
 * - We keep all UI/logic in <MainNav>.
 * - The wrapper exists so we can attach Storyblok’s inline-editing attrs.
 */
export default function Header({blok}: {blok: HeaderBlok}) {
  // Attach editable attributes so the visual editor can highlight this blok.
  return (
    <div {...storyblokEditable(blok)}>
      <MainNav blok={blok} />
    </div>
  );
}
