import { Section } from "@/components/layout/Section";
import type { SiteCopy } from "@/types/content";

type PhilosophySectionProps = {
  copy: SiteCopy;
};

/** Editorial philosophy statement: index rule, title, and body copy. */
export function PhilosophySection({ copy }: PhilosophySectionProps) {
  return (
    <Section
      index="01"
      label="Philosophy"
      data-ocid="home.philosophy_section"
      className="border-b border-border"
    >
      <div className="grid gap-10 md:grid-cols-12">
        <div className="md:col-span-5">
          <h2 className="text-balance font-display text-3xl font-bold tracking-tight md:text-4xl">
            {copy.philosophyTitle}
          </h2>
        </div>
        <div className="md:col-span-7">
          <p className="max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
            {copy.philosophyBody}
          </p>
        </div>
      </div>
    </Section>
  );
}
