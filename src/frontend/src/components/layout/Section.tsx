import type * as React from "react";

import { Container } from "@/components/layout/Container";
import { cn } from "@/lib/utils";

type SectionProps = React.ComponentProps<"section"> & {
  /** Mono index label rendered over the hairline rule, e.g. "01 — PHILOSOPHY". */
  index?: string;
  label?: string;
  /** Alternate the surface to bg-muted/40 for zone separation. */
  muted?: boolean;
  /** Render the section head inside the container (default true). */
  contained?: boolean;
};

/**
 * A page section introduced by the signature "index rule": a hairline rule
 * with a mono index + label sitting on it.
 */
export function Section({
  index,
  label,
  muted = false,
  contained = true,
  className,
  children,
  ...props
}: SectionProps) {
  const head =
    index || label ? (
      <div className="mb-10 md:mb-14">
        <div className="flex items-baseline gap-3 border-t border-border pt-4">
          {index ? (
            <span className="font-mono text-xs font-medium tracking-[0.22em] text-primary">
              {index}
            </span>
          ) : null}
          {label ? <span className="eyebrow">{label}</span> : null}
        </div>
      </div>
    ) : null;

  return (
    <section
      className={cn("py-20 md:py-28", muted && "bg-muted/40", className)}
      {...props}
    >
      {contained ? (
        <Container>
          {head}
          {children}
        </Container>
      ) : (
        <>
          {head ? <Container>{head}</Container> : null}
          {children}
        </>
      )}
    </section>
  );
}
