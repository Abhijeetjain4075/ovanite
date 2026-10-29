import { ArrowRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { Container } from "@/components/layout/Container";
import { PageMeta } from "@/components/layout/PageMeta";
import { PrimaryButton, SecondaryButton } from "@/components/shared/primitives";

type ThankYouState = { kind?: "contact" | "waitlist" };

export default function ThankYou() {
  const location = useLocation();
  const state = location.state as ThankYouState | null;
  const isWaitlist = state?.kind === "waitlist";
  const isConfirmed = state?.kind === "contact" || isWaitlist;

  const heading = !isConfirmed
    ? "No submission was sent."
    : isWaitlist
      ? "You're on the list."
      : "Thank you for reaching out.";
  const body = !isConfirmed
    ? "This page only confirms an accepted submission. Contact and waitlist intake are currently closed, so no details have been collected. Explore the products in development instead."
    : isWaitlist
      ? "We have your details and will be in touch when there is something real to share. No noise in between."
      : "We have received your message and will reply as soon as we can. In the meantime, feel free to explore what we are building.";

  return (
    <>
      <PageMeta
        title="Thank you"
        description={
          isConfirmed
            ? "Thank you for getting in touch with Ovanite. We have received your submission."
            : "No submission was sent. Contact and waitlist intake are currently closed."
        }
      />
      <Container className="py-24 md:py-36">
        <div className="mx-auto min-w-0 max-w-2xl">
          <div className="flex items-baseline gap-3 border-t border-border pt-4">
            <span className="font-mono text-xs font-medium tracking-[0.22em] text-primary">
              01
            </span>
            <span className="eyebrow">Confirmation</span>
          </div>

          <h1
            data-ocid="thank_you.heading"
            className="mt-10 text-balance break-words font-display text-4xl font-bold tracking-tight md:text-6xl"
          >
            {heading}
          </h1>
          <p className="mt-6 text-pretty break-words text-lg leading-relaxed text-muted-foreground">
            {body}
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <PrimaryButton asChild size="lg">
              <Link to="/products" data-ocid="thank_you.products_button">
                Explore products
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </PrimaryButton>
            <SecondaryButton asChild size="lg">
              <Link to="/" data-ocid="thank_you.home_button">
                Back to home
              </Link>
            </SecondaryButton>
          </div>
        </div>
      </Container>
    </>
  );
}
