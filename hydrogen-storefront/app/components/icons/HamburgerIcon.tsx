import * as React from 'react';

type IconProps = React.SVGProps<SVGSVGElement> & {
  /** Accessible name. If omitted, the icon is hidden from screen readers. */
  title?: string;
};

const HamburgerIcon = ({title, ...props}: IconProps) => (
  <svg
    width="24"
    height="13"
    viewBox="0 0 24 13"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    role={title ? 'img' : 'presentation'}
    aria-hidden={title ? undefined : true}
    {...props}
  >
    {title ? <title>{title}</title> : null}
    <path
      d="M24 2.074H.008V1.5H24v.574zM24 6.58H.008v-.573H24v.573zM.008 11.497H24v-.574H.008v.574z"
      fill="currentColor"
    />
  </svg>
);

export default HamburgerIcon;
