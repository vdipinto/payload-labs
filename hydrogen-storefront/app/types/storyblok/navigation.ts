// types/storyblok/navigation.ts
import type {SbBlok, SbMultiLink} from './common';
import type {RightActionType, MaxWidth} from './overrides';

export type NavLinkBlok = SbBlok & {
  component: 'nav_link';
  label?: string;
  link?: SbMultiLink;
  badge?: string;
};

export type NavGroupBlok = SbBlok & {
  component: 'nav_group';
  title?: string;
  items?: NavLinkBlok[];
};

export type NavItemBlok = SbBlok & {
  component: 'nav_item';
  label?: string;
  link?: SbMultiLink;
  subnav?: (NavGroupBlok | NavLinkBlok)[];
  highlight?: boolean;
};

export type RightActionBlok = SbBlok & {
  component: 'right_action';
  type?: RightActionType; // <- from overrides
  label?: string;
  link?: SbMultiLink;
  highlight?: boolean; // 👈 add this
};

export type HeaderBlok = SbBlok & {
  component: 'header';
  home_link?: SbMultiLink;
  nav?: NavItemBlok[];
  right_items?: RightActionBlok[];
  sticky?: boolean;
  max_width?: MaxWidth; // <- from overrides
};
