export type SbBlok = {_uid: string; component: string; _editable?: string};

export type SbMultiLink = {
  linktype?: 'story' | 'url' | string;
  cached_url?: string;
  url?: string;
  anchor?: string;
  id?: string;
};
