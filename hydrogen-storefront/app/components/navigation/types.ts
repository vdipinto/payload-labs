export type NavItem = {
  id: string;
  label: string;
  href?: string;
  highlight?: boolean;
  badge?: string;

  // one of these is present if it has a submenu
  children?: NavItem[]; // simple flat submenu
  groups?: {id: string; title?: string; items: NavItem[]}[]; // mega-menu
};

export type DesktopNavProps = {items: NavItem[]};
export type MobileMenuProps = {items: NavItem[]};
