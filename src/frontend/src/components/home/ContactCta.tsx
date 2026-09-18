import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import { Container } from "@/components/layout/Container";
import { PrimaryButton, SecondaryButton } from "@/components/shared/primitives";

/** Closing call to action on the navy ink band, linking to Contact and Waitlist. */
export function ContactCta() {
  return (
    <section
      data-ocid="home.contact_cta_section"
      className="bg-ink text-ink-foreground"
    >
      <Container>
        <div className="grid gap-10 py-20 md:grid-cols-12 md:py-28">
          <div className="md:col-span-7">
            <div className="flex items-baseline gap-3 border-t border-ink-foreground/20 pt-4">
              <span className="font-mono text-xs font-medium tracking-[0.22em] text-accent">
                06
              </span>
              <span className="font-mono text-xs font-medium uppercase tracking-[0.22em] text-ink-foreground/60">
                Get in touch
              </span>
            </div>
            <h2 className="mt-8 text-balance font-display text-3xl font-bold tracking-tight md:text-5xl">
              Let&rsquo;s build something that matters.
            </h2>
          </div>

          <div className="flex flex-col justify-end md:col-span-5">
            <p className="max-w-md text-pretty text-lg leading-relaxed text-ink-foreground/70">
              Tell us what you are working on, or join the waitlist to follow
              what we ship next.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <PrimaryButton asChild size="lg">
                <Link to="/contact" data-ocid="home.contact_cta_button">
                  Start a conversation
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Link>
              </PrimaryButton>
              <SecondaryButton
                asChild
                size="lg"
                className="border-ink-foreground/25 bg-transparent text-ink-foreground hover:bg-ink-foreground/10 hover:text-ink-foreground"
              >
                <Link to="/waitlist" data-ocid="home.waitlist_cta_button">
                  Join the waitlist
                </Link>
              </SecondaryButton>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
