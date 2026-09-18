import type * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Brand-aligned wrappers around the shadcn primitives.
 *
 * The design brief calls for sharp 4px corners, hairline borders, and mono
 * micro-labels. `components/ui/*` is read-only, so the overrides live here and
 * are applied at every use site through these named components.
 */

/** Primary CTA: solid cobalt, sharp corners. */
export function PrimaryButton({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return <Button className={cn("rounded-sm", className)} {...props} />;
}

/** Secondary action: hairline border, transparent surface. */
export function SecondaryButton({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      variant="outline"
      className={cn("rounded-sm border-border bg-transparent", className)}
      {...props}
    />
  );
}

/** Card: sharp corners, hairline border, lift on hover. */
export function SurfaceCard({
  className,
  interactive = false,
  ...props
}: React.ComponentProps<typeof Card> & { interactive?: boolean }) {
  return (
    <Card
      className={cn(
        "rounded-sm border-border bg-card shadow-none",
        interactive &&
          "transition-smooth hover:-translate-y-px hover:border-primary/30 hover:shadow-subtle",
        className,
      )}
      {...props}
    />
  );
}

/** Mono uppercase micro-label with a hairline border. */
export function MicroBadge({
  className,
  ...props
}: React.ComponentProps<typeof Badge>) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-sm border-border bg-muted/60 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

/** Small warm-orange status dot used for micro-highlights. */
export function StatusDot({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-block h-1.5 w-1.5 rounded-full bg-accent",
        className,
      )}
    />
  );
}
