import { Section } from "@/components/layout/Section";
import type { SiteCopy } from "@/types/content";

type ApproachSectionProps = {
  copy: SiteCopy;
};

/** Approach statement on a muted surface for zone separation. */
export function ApproachSection({ copy }: ApproachSectionProps) {
  return (
    <Section
      index="03"
      label="Approach"
      muted
      data-ocid="home.approach_section"
      className="border-b border-border"
    >
      <div className="grid gap-10 md:grid-cols-12">
        <div className="md:col-span-5">
          <h2 className="text-balance font-display text-3xl font-bold tracking-tight md:text-4xl">
            {copy.approachTitle}
          </h2>
        </div>
        <div className="md:col-span-7">
          <p className="max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
            {copy.approachBody}
          </p>
        </div>
      </div>
    </Section>
  );
}
