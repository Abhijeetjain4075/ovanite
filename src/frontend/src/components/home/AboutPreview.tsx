import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import { Section } from "@/components/layout/Section";
import { SecondaryButton } from "@/components/shared/primitives";
import type { SiteCopy } from "@/types/content";

type AboutPreviewProps = {
  copy: SiteCopy;
};

/** Short about summary with a link through to the full About page. */
export function AboutPreview({ copy }: AboutPreviewProps) {
  return (
    <Section
      index="04"
      label="About Ovanite"
      data-ocid="home.about_section"
      className="border-b border-border"
    >
      <div className="grid gap-10 md:grid-cols-12">
        <div className="md:col-span-5">
          <h2 className="text-balance font-display text-3xl font-bold tracking-tight md:text-4xl">
            {copy.aboutTitle}
          </h2>
        </div>
        <div className="md:col-span-7">
          <p className="max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
            {copy.aboutBody}
          </p>
          <SecondaryButton asChild size="lg" className="mt-8">
            <Link to="/about" data-ocid="home.about_link">
              More about Ovanite
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </SecondaryButton>
        </div>
      </div>
    </Section>
  );
}
