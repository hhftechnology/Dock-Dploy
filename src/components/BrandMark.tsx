// Editorial brand mark — abstract dock/anchor stack.
// Original (not a copy of any third-party mark).
// All colors come from CSS tokens via currentColor; size is the only literal.

import type { SVGProps } from "react";

type Tone = "ink" | "on-dark";

interface BrandMarkProps extends Omit<SVGProps<SVGSVGElement>, "fill"> {
  size?: number;
  tone?: Tone;
}

export function BrandMark({ size = 28, tone = "ink", ...rest }: BrandMarkProps) {
  const fillClass = tone === "ink" ? "brand-mark--ink" : "brand-mark--on-dark";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={fillClass}
      {...rest}
    >
      <rect className="brand-mark__accent" x="4" y="6" width="24" height="4" rx="1" />
      <rect className="brand-mark__bar" x="6" y="13" width="20" height="4" rx="1" opacity="0.85" />
      <rect className="brand-mark__bar" x="9" y="20" width="14" height="4" rx="1" opacity="0.55" />
      <circle className="brand-mark__accent" cx="16" cy="28" r="1.6" />
    </svg>
  );
}
