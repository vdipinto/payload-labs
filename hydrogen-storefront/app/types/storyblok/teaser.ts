import type {SbBlok} from '~/types/storyblok/common';

export type TeaserBlok = SbBlok & {
  component: 'teaser';
  text?: string; // single text field for now
};
