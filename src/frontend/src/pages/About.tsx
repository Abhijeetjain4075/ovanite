import { Link } from "react-router-dom";

import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Container } from "@/components/layout/Container";
import { PageMeta } from "@/components/layout/PageMeta";
import { Section } from "@/components/layout/Section";
import { SecondaryButton } from "@/components/shared/primitives";
import { useSiteContent } from "@/hooks/useSiteContent";
import { resolveSiteCopy } from "@/lib/siteCopy";

export default function About() {
  const { data } = useSiteContent();
  const copy = resolveSiteCopy(data);

  return (
    <>
      <PageMeta
        title="About"
        description="Ovanite is a software company building products designed to matter. Learn how we work and what we believe."
      />
      <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "About" }]} />

      <Container className="py-16 md:py-24">
        <div className="flex items-baseline gap-3 border-t border-border pt-4">
          <span className="font-mono text-xs font-medium tracking-[0.22em] text-primary">
            01
          </span>
          <span className="eyebrow">About Ovanite</span>
        </div>

        <div className="mt-10 grid gap-10 md:grid-cols-12">
          <div className="min-w-0 md:col-span-7">
            <h1 className="text-balance break-words font-display text-4xl font-bold tracking-tight md:text-6xl">
              {copy.aboutTitle}
            </h1>
          </div>
          <div className="min-w-0 md:col-span-5">
            <p className="max-w-md text-pretty break-words text-lg leading-relaxed text-muted-foreground">
              {copy.aboutBody}
            </p>
          </div>
        </div>
      </Container>

      <Section
        index="02"
        label="Philosophy"
        muted
        data-ocid="about.philosophy_section"
        className="border-y border-border"
      >
        <div className="grid gap-10 md:grid-cols-12">
          <div className="min-w-0 md:col-span-5">
            <h2 className="text-balance break-words font-display text-3xl font-bold tracking-tight md:text-4xl">
              {copy.philosophyTitle}
            </h2>
          </div>
          <div className="min-w-0 md:col-span-7">
            <p className="max-w-2xl text-pretty break-words text-lg leading-relaxed text-muted-foreground">
              {copy.philosophyBody}
            </p>
          </div>
        </div>
      </Section>

      <Section index="03" label="Approach" data-ocid="about.approach_section">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="min-w-0 md:col-span-5">
            <h2 className="text-balance break-words font-display text-3xl font-bold tracking-tight md:text-4xl">
              {copy.approachTitle}
            </h2>
          </div>
          <div className="min-w-0 md:col-span-7">
            <p className="max-w-2xl text-pretty break-words text-lg leading-relaxed text-muted-foreground">
              {copy.approachBody}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <SecondaryButton asChild>
                <Link to="/products" data-ocid="about.products_link">
                  Explore products
                </Link>
              </SecondaryButton>
              <SecondaryButton asChild>
                <Link to="/contact" data-ocid="about.contact_link">
                  Start a conversation
                </Link>
              </SecondaryButton>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
