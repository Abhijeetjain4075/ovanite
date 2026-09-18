import { Container } from "@/components/layout/Container";

/**
 * Lightweight route-level loading fallback shown while a lazily imported page
 * chunk downloads. It mirrors the page rhythm (mono index rule, display
 * headline, body copy) so the transition into the real page is calm rather
 * than a blank flash.
 */
export function RouteFallback() {
  return (
    <output
      data-ocid="route.loading_state"
      aria-live="polite"
      className="block border-b border-border"
    >
      <Container>
        <div className="flex items-baseline gap-3 border-t border-border pt-4">
          <span className="font-mono text-xs font-medium tracking-[0.22em] text-primary">
            ··
          </span>
          <span className="eyebrow">Loading</span>
        </div>
        <div className="py-20 md:py-28">
          <div className="h-10 w-3/4 max-w-xl animate-pulse rounded-sm bg-muted md:h-14" />
          <div className="mt-6 h-4 w-full max-w-md animate-pulse rounded-sm bg-muted" />
          <div className="mt-3 h-4 w-2/3 max-w-sm animate-pulse rounded-sm bg-muted" />
        </div>
      </Container>
      <span className="sr-only">Loading page…</span>
    </output>
  );
}
