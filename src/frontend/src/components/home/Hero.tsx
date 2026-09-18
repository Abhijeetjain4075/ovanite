import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import { Container } from "@/components/layout/Container";
import { PrimaryButton, SecondaryButton } from "@/components/shared/primitives";
import { isAbsoluteUrl } from "@/lib/siteCopy";
import type { SiteCopy } from "@/types/content";

type HeroProps = {
  copy: SiteCopy;
};

/**
 * Asymmetric 7/5 hero: oversized display headline on the left, supporting
 * copy and the CTA pair on the right, introduced by a mono index rule.
 */
export function Hero({ copy }: HeroProps) {
  const primaryExternal = isAbsoluteUrl(copy.primaryCtaHref);
  const secondaryExternal = isAbsoluteUrl(copy.secondaryCtaHref);

  return (
    <section
      data-ocid="home.hero_section"
      className="relative overflow-hidden border-b border-border"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-dot-grid opacity-60 [mask-image:linear-gradient(to_bottom,black,transparent_75%)]"
      />
      <Container className="relative">
        <div className="flex items-baseline gap-3 border-t border-border pt-4">
          <span className="font-mono text-xs font-medium tracking-[0.22em] text-primary">
            00
          </span>
          <span className="eyebrow">Software company</span>
        </div>

        <div className="grid gap-12 py-20 md:grid-cols-12 md:gap-10 md:py-28">
          <div className="md:col-span-7">
            <h1 className="text-balance font-display text-5xl font-bold leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl">
              {copy.heroHeadline}
            </h1>
          </div>

          <div className="flex flex-col justify-end md:col-span-5">
            <p className="max-w-md text-pretty text-lg leading-relaxed text-muted-foreground">
              {copy.heroDescription}
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <PrimaryButton asChild size="lg">
                {primaryExternal ? (
                  <a
                    href={copy.primaryCtaHref}
                    rel="noreferrer"
                    target="_blank"
                    data-ocid="home.primary_cta_button"
                  >
                    {copy.primaryCtaLabel}
                    <ArrowRight aria-hidden="true" className="h-4 w-4" />
                  </a>
                ) : (
                  <Link
                    to={copy.primaryCtaHref}
                    data-ocid="home.primary_cta_button"
                  >
                    {copy.primaryCtaLabel}
                    <ArrowRight aria-hidden="true" className="h-4 w-4" />
                  </Link>
                )}
              </PrimaryButton>
              <SecondaryButton asChild size="lg">
                {secondaryExternal ? (
                  <a
                    href={copy.secondaryCtaHref}
                    rel="noreferrer"
                    target="_blank"
                    data-ocid="home.secondary_cta_button"
                  >
                    {copy.secondaryCtaLabel}
                  </a>
                ) : (
                  <Link
                    to={copy.secondaryCtaHref}
                    data-ocid="home.secondary_cta_button"
                  >
                    {copy.secondaryCtaLabel}
                  </Link>
                )}
              </SecondaryButton>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
