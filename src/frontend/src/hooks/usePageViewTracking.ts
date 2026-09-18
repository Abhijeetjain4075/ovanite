import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import { createActor } from "@/backend";
import { hasAnalyticsConsent } from "@/lib/consent";
import { useActor } from "@caffeineai/core-infrastructure";

/**
 * Records one aggregate page view per public route change, and only after the
 * visitor has accepted analytics. Admin routes are never counted.
 *
 * The backend also normalizes and validates the path, so an invalid or admin
 * path is ignored server-side as well.
 */
export function usePageViewTracking(): void {
  const { pathname } = useLocation();
  const { actor, isFetching } = useActor(createActor);

  useEffect(() => {
    if (!actor || isFetching) return;
    if (pathname.startsWith("/admin")) return;
    if (!hasAnalyticsConsent()) return;

    void actor.recordPageView(pathname).catch(() => {
      // Analytics is best-effort; a failed count must never surface to the
      // visitor or interrupt navigation.
    });
  }, [actor, isFetching, pathname]);
}
