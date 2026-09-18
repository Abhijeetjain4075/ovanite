import { useEffect, useState } from "react";

import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/button";
import {
  CONSENT_CHANGE_EVENT,
  type ConsentChoice,
  readConsent,
  writeConsent,
} from "@/lib/consent";

/**
 * First-visit analytics consent banner.
 *
 * Renders only while no choice is stored. Accept and Decline both persist the
 * choice and dismiss the banner; the footer's "Cookie preferences" link clears
 * the choice and brings it back.
 */
export function ConsentBanner() {
  const [choice, setChoice] = useState<ConsentChoice | null>(() =>
    readConsent(),
  );

  // Keep the banner in sync when the stored choice changes elsewhere
  // (footer link, another tab).
  useEffect(() => {
    function sync() {
      setChoice(readConsent());
    }
    window.addEventListener(CONSENT_CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CONSENT_CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  if (choice !== null) return null;

  function decide(next: ConsentChoice) {
    writeConsent(next);
    setChoice(next);
  }

  return (
    <section
      aria-label="Analytics consent"
      data-ocid="consent.banner"
      className="fixed inset-x-0 bottom-0 z-[70] border-t border-border bg-card shadow-elevated"
    >
      <Container>
        <div className="flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between md:gap-8">
          <div className="max-w-2xl">
            <p className="eyebrow text-muted-foreground">Privacy</p>
            <p className="mt-2 text-sm leading-relaxed text-foreground">
              We count anonymous page views to understand which parts of the
              site are useful. No personal data, no third-party analytics, and
              no tracking cookies — just aggregate totals stored in our own
              backend.
            </p>
          </div>

          <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              type="button"
              variant="outline"
              className="rounded-sm"
              data-ocid="consent.decline_button"
              onClick={() => decide("declined")}
            >
              Decline
            </Button>
            <Button
              type="button"
              className="rounded-sm"
              data-ocid="consent.accept_button"
              onClick={() => decide("accepted")}
            >
              Accept
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
