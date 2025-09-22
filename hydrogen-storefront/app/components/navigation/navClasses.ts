// app/components/navigation/navClasses.ts
export const NAV_BASE =
  'btn inline-flex items-center gap-1 text-[12px]/[16px] uppercase tracking-[0.03rem] text-basic-black no-underline cursor-pointer focus-visible:outline-none focus-visible:focus-ring';

export const BADGE_BASE =
  'rounded px-1.5 py-0.5 text-[10px] font-semibold border';

const cls = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(' ');

export const navClasses = (highlight?: boolean, extra?: string) =>
  cls(NAV_BASE, highlight && 'font-semibold', extra);
