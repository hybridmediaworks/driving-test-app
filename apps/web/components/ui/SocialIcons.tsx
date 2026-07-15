// lucide-react removed brand/logo icons (trademark reasons); these are small
// local replacements so the footer doesn't need an extra icon-pack dependency.
import type { SVGProps } from "react";

function IconBase(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      {...props}
    />
  );
}

export function Facebook(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M13.5 21v-8h2.7l.4-3.1h-3.1V8c0-.9.25-1.5 1.55-1.5H16.7V3.7C16.4 3.66 15.4 3.58 14.24 3.58c-2.4 0-4.05 1.47-4.05 4.16v2.16H7.5V13h2.69v8h3.31z" />
    </IconBase>
  );
}

export function Twitter(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M18.9 3h3l-6.6 7.55L23 21h-6.1l-4.78-6.24L6.6 21H3.6l7.05-8.06L2.9 3h6.25l4.32 5.7L18.9 3zm-1.05 16.17h1.66L7.24 4.74H5.46l12.4 14.43z" />
    </IconBase>
  );
}

export function Instagram(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props} fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </IconBase>
  );
}

export function Linkedin(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M6.94 8.5H3.56V21h3.38V8.5zM5.25 3.5a1.96 1.96 0 1 0 0 3.92 1.96 1.96 0 0 0 0-3.92zM20.5 21h-3.38v-6.4c0-1.53-.03-3.5-2.13-3.5-2.14 0-2.47 1.67-2.47 3.39V21H9.14V8.5h3.24v1.71h.05c.45-.85 1.56-1.75 3.21-1.75 3.43 0 4.86 2.26 4.86 5.19V21z" />
    </IconBase>
  );
}
