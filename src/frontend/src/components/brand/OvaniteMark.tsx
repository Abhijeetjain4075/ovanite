import type { SVGProps } from "react";

import { cn } from "@/lib/utils";

/**
 * Ovanite brand mark.
 *
 * An abstract aperture/portal: a thick ring with a flat 45° cut on the
 * lower-right and a smaller solid inner disc offset toward that cut — reading
 * as a lens, an "O", and a forward vector at once. Purely geometric: no
 * robots, brains, circuits, or generic AI symbols.
 *
 * Color follows `currentColor`, so set it with a text color utility
 * (`text-foreground` on light surfaces, `text-ink-foreground` on navy bands).
 */
export function OvaniteMark({
  className,
  title = "Ovanite",
  ...props
}: SVGProps<SVGSVGElement> & { title?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      role="img"
      aria-label={title}
      className={cn("h-6 w-6 text-foreground", className)}
      {...props}
    >
      <title>{title}</title>
      {/* Outer ring, drawn as an arc with a flat 45° cut at the lower-right */}
      <path
        d="M 16 3 A 13 13 0 1 1 6.81 25.19"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="butt"
      />
      {/* Inner disc: solid, offset toward the aperture opening */}
      <circle cx="20.4" cy="20.4" r="3.2" fill="currentColor" />
    </svg>
  );
}

/**
 * Ovanite wordmark: mark + uppercase wordtype in the display face.
 * `orientation="stacked"` is available for compact footer/legal lockups.
 */
export function OvaniteWordmark({
  className,
  markClassName,
  textClassName,
  showTagline = false,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  markClassName?: string;
  textClassName?: string;
  showTagline?: boolean;
}) {
  return (
    <span
      className={cn("inline-flex items-center gap-2.5", className)}
      {...props}
    >
      <OvaniteMark className={cn("h-6 w-6 shrink-0", markClassName)} />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-display text-[1.0625rem] font-bold uppercase tracking-[0.18em]",
            textClassName,
          )}
        >
          Ovanite
        </span>
        {showTagline ? (
          <span className="mt-1 font-mono text-[0.625rem] uppercase tracking-[0.2em] opacity-60">
            Software, built to matter.
          </span>
        ) : null}
      </span>
    </span>
  );
}
