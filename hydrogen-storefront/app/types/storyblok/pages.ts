import type {SbBlok} from './common';
// Add the specific blocks your pages can contain
import type {HeaderBlok} from './navigation';
// e.g., import type {HeroBlok} from "./sections/hero";

export type PageBlok = SbBlok & {
  component: 'page';
  // Most people model page content as `body` (array of bloks)
  body?: SbBlok[]; // or (HeroBlok | GridBlok | ...)[], once you add them
};

// If you prefer a 'layout' content type too, you can type it here later.
